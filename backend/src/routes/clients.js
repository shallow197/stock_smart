const express = require("express");
const { z } = require("zod");

const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const clientsRouter = express.Router();
clientsRouter.use(requireAuth);

const createClientSchema = z.object({
  name: z.string().min(2),
  phone: z.string().min(5),
  email: z.string().email().optional(),
  address: z.string().min(3).optional(),
});

const updateClientSchema = createClientSchema.partial();

clientsRouter.get("/", async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";

    const where = {
      vendorId: req.user.id,
      ...(q
        ? {
            OR: [
              { name: { contains: q } },
              { phone: { contains: q } },
              { email: { contains: q } },
            ],
          }
        : {}),
    };

    const [total, clients] = await Promise.all([
      prisma.client.count({ where }),
      prisma.client.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return res.json({ page, pageSize, total, clients });
  } catch (err) {
    return next(err);
  }
});

clientsRouter.post("/", async (req, res, next) => {
  try {
    const body = createClientSchema.parse(req.body);
    const client = await prisma.client.create({
      data: {
        vendorId: req.user.id,
        name: body.name,
        phone: body.phone,
        email: body.email ?? null,
        address: body.address ?? null,
      },
    });
    return res.status(201).json({ client });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    if (err?.code === "P2002") return res.status(409).json({ message: "Un client avec ce téléphone existe déjà." });
    return next(err);
  }
});

clientsRouter.get("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "ID invalide." });

    const client = await prisma.client.findFirst({
      where: { id, vendorId: req.user.id },
    });
    if (!client) return res.status(404).json({ message: "Client introuvable." });

    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 20)));
    const type = typeof req.query.type === "string" ? req.query.type : "";

    const where = {
      vendorId: req.user.id,
      clientId: id,
      ...(type ? { type } : {}),
    };

    const [total, history] = await Promise.all([
      prisma.logEntry.count({ where }),
      prisma.logEntry.findMany({
        where,
        orderBy: { timestamp: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { product: { select: { id: true, name: true, unit: true } } },
      }),
    ]);

    return res.json({ client, page, pageSize, total, history });
  } catch (err) {
    return next(err);
  }
});

clientsRouter.put("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "ID invalide." });

    const existing = await prisma.client.findFirst({ where: { id, vendorId: req.user.id } });
    if (!existing) return res.status(404).json({ message: "Client introuvable." });

    const body = updateClientSchema.parse(req.body);
    const client = await prisma.client.update({
      where: { id },
      data: {
        name: body.name ?? undefined,
        phone: body.phone ?? undefined,
        email: body.email ?? undefined,
        address: body.address ?? undefined,
      },
    });
    return res.json({ client });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    if (err?.code === "P2002") return res.status(409).json({ message: "Un client avec ce téléphone existe déjà." });
    return next(err);
  }
});

clientsRouter.delete("/:id", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) return res.status(400).json({ message: "ID invalide." });

    const existing = await prisma.client.findFirst({ where: { id, vendorId: req.user.id } });
    if (!existing) return res.status(404).json({ message: "Client introuvable." });

    await prisma.client.delete({ where: { id } });
    return res.status(204).send();
  } catch (err) {
    return next(err);
  }
});

module.exports = { clientsRouter };

