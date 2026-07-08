const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const { z } = require("zod");

const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { decimalString, optionalDecimalString } = require("../utils/validation");

const productsRouter = express.Router();
productsRouter.use(requireAuth);

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function safeResolveUploadFile(relPath) {
  if (!relPath) return null;
  const uploadRoot = path.resolve(process.env.UPLOAD_DIR || "uploads");
  const abs = path.resolve(uploadRoot, relPath);
  if (!abs.startsWith(uploadRoot + path.sep) && abs !== uploadRoot) return null;
  return abs;
}

function tryUnlink(absPath) {
  if (!absPath) return;
  try {
    if (fs.existsSync(absPath)) fs.unlinkSync(absPath);
  } catch {
    // best-effort: ne pas faire échouer la requête
  }
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const uploadRoot = process.env.UPLOAD_DIR || "uploads";
    const dest = path.resolve(uploadRoot, "products", String(req.user.id));
    ensureDirSync(dest);
    cb(null, dest);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || "").slice(0, 10);
    cb(null, `${crypto.randomUUID?.() || crypto.randomBytes(16).toString("hex")}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

const createProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().min(2),
  description: z.string().optional(),
  price: decimalString,
  quantity: optionalDecimalString,
  unit: z.string().min(1),
  isAvailable: z
    .union([z.boolean(), z.string()])
    .transform((v) => (typeof v === "string" ? v === "true" : v))
    .optional(),
  lowStockThreshold: optionalDecimalString,
});

const updateProductSchema = createProductSchema.partial();

productsRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const category = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const available = typeof req.query.available === "string" ? req.query.available : undefined;
    const lowStockOnly = req.query.lowStockOnly === "true";

    const where = {
      vendorId: req.user.id,
      ...(category ? { category } : {}),
      ...(available === "true" ? { isAvailable: true } : {}),
      ...(available === "false" ? { isAvailable: false } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { category: { contains: q } },
              { description: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    const products = lowStockOnly
      ? items.filter((p) => Number(p.quantity) <= Number(p.lowStockThreshold))
      : items;

    return res.json({ page, pageSize, total, products });
  } catch (err) {
    return next(err);
  }
});

productsRouter.post("/", upload.single("photo"), async (req, res, next) => {
  try {
    const body = createProductSchema.parse(req.body);

    const photoPath = req.file
      ? path.posix.join("products", String(req.user.id), req.file.filename)
      : null;

    const product = await prisma.product.create({
      data: {
        vendorId: req.user.id,
        name: body.name,
        category: body.category,
        description: body.description ?? null,
        price: body.price,
        quantity: body.quantity ?? "0",
        unit: body.unit,
        photoPath,
        isAvailable: body.isAvailable ?? true,
        lowStockThreshold: body.lowStockThreshold ?? "0",
      },
    });

    return res.status(201).json({ product });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    return next(err);
  }
});

productsRouter.put("/:id", upload.single("photo"), async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "ID invalide." });

    const existing = await prisma.product.findFirst({ where: { id, vendorId: req.user.id } });
    if (!existing) return res.status(404).json({ message: "Produit introuvable." });

    const body = updateProductSchema.parse(req.body);
    const photoPath = req.file
      ? path.posix.join("products", String(req.user.id), req.file.filename)
      : undefined;

    const product = await prisma.product.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        category: body.category ?? undefined,
        description: body.description ?? undefined,
        price: body.price ?? undefined,
        quantity: body.quantity ?? undefined,
        unit: body.unit ?? undefined,
        isAvailable: body.isAvailable ?? undefined,
        lowStockThreshold: body.lowStockThreshold ?? undefined,
        photoPath,
      },
    });

    if (photoPath && existing.photoPath && existing.photoPath !== photoPath) {
      tryUnlink(safeResolveUploadFile(existing.photoPath));
    }

    return res.json({ product });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    return next(err);
  }
});

productsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "ID invalide." });

    const existing = await prisma.product.findFirst({ where: { id, vendorId: req.user.id } });
    if (!existing) return res.status(404).json({ message: "Produit introuvable." });

    await prisma.product.delete({ where: { id } });
    if (existing.photoPath) tryUnlink(safeResolveUploadFile(existing.photoPath));
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = { productsRouter };

