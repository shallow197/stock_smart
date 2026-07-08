const express = require("express");
const { z } = require("zod");

const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { nowDakar, dateKeyDakar } = require("../utils/time");
const { optionalDecimalString } = require("../utils/validation");
const { ensureDailyLogTx } = require("../services/dailyLog");
const { nextInvoiceNumberTx } = require("../services/invoice");

const logsRouter = express.Router();
logsRouter.use(requireAuth);

const dateKeySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const monthKeySchema = z.string().regex(/^\d{4}-\d{2}$/);

const createEntrySchema = z.object({
  type: z.enum(["ARRIVAGE", "VENTE", "RETOUR", "AJUSTEMENT", "NOTE"]),
  productId: z.number().int().positive().optional(),
  clientId: z.number().int().positive().optional(),
  clientName: z.string().min(2).optional(),
  quantity: optionalDecimalString,
  unitPrice: optionalDecimalString,
  note: z.string().min(1).optional(),
});

function computeTotal(quantityStr, unitPriceStr) {
  const q = Number(quantityStr);
  const p = Number(unitPriceStr);
  const total = q * p;
  return String(Math.round(total * 100) / 100);
}

async function getLogWithEntries(vendorId, dateKey) {
  return prisma.dailyLog.findUnique({
    where: { vendorId_dateKey: { vendorId, dateKey } },
    include: {
      entries: {
        orderBy: { timestamp: "asc" },
        include: {
          product: { select: { id: true, name: true, unit: true } },
          client: { select: { id: true, name: true, phone: true } },
        },
      },
    },
  });
}

async function computeCurrentStockValue(vendorId) {
  const products = await prisma.product.findMany({
    where: { vendorId },
    select: { quantity: true, price: true },
  });
  const total = products.reduce((acc, p) => acc + Number(p.quantity) * Number(p.price), 0);
  return String(Math.round(total * 100) / 100);
}

async function getDailySummary(vendorId, dateKey) {
  const log = await prisma.dailyLog.findUnique({
    where: { vendorId_dateKey: { vendorId, dateKey } },
    select: { id: true, status: true, openingStockValue: true, closingStockValue: true },
  });
  if (!log) return null;

  const totals = await prisma.logEntry.aggregate({
    where: { vendorId, dailyLogId: log.id },
    _sum: { total: true },
  });

  const sales = await prisma.logEntry.aggregate({
    where: { vendorId, dailyLogId: log.id, type: "VENTE" },
    _sum: { total: true },
    _count: { _all: true },
  });

  const arrivals = await prisma.logEntry.aggregate({
    where: { vendorId, dailyLogId: log.id, type: "ARRIVAGE" },
    _sum: { total: true },
    _count: { _all: true },
  });

  const closing =
    log.status === "CLOSED" ? log.closingStockValue : await computeCurrentStockValue(vendorId);

  return {
    openingStockValue: log.openingStockValue,
    closingStockValue: closing,
    totalSales: sales._sum.total ?? "0",
    salesCount: sales._count._all,
    totalArrivals: arrivals._sum.total ?? "0",
    arrivalsCount: arrivals._count._all,
    totalValueAllEntries: totals._sum.total ?? "0",
  };
}

logsRouter.get("/today", async (req, res, next) => {
  try {
    const dateKey = dateKeyDakar();
    await prisma.$transaction((tx) => ensureDailyLogTx(tx, req.user.id, dateKey));
    const log = await getLogWithEntries(req.user.id, dateKey);
    return res.json({ dateKey, log });
  } catch (err) {
    return next(err);
  }
});

logsRouter.get("/today/summary", async (req, res, next) => {
  try {
    const dateKey = dateKeyDakar();
    await prisma.$transaction((tx) => ensureDailyLogTx(tx, req.user.id, dateKey));
    const summary = await getDailySummary(req.user.id, dateKey);
    return res.json({ dateKey, summary });
  } catch (err) {
    return next(err);
  }
});

logsRouter.get("/dates", async (req, res, next) => {
  try {
    const month = monthKeySchema.parse(req.query.month);
    const start = `${month}-01`;
    const endMonth = Number(month.slice(5, 7)) === 12
      ? `${Number(month.slice(0, 4)) + 1}-01`
      : `${month.slice(0, 5)}${String(Number(month.slice(5, 7)) + 1).padStart(2, "0")}`;
    const end = `${endMonth}-01`;

    const logs = await prisma.dailyLog.findMany({
      where: {
        vendorId: req.user.id,
        dateKey: { gte: start, lt: end },
      },
      orderBy: { dateKey: "asc" },
      select: { dateKey: true, status: true },
    });
    return res.json({ month, dates: logs });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Paramètre month invalide. Format: YYYY-MM." });
    return next(err);
  }
});

logsRouter.get("/range", async (req, res, next) => {
  try {
    const from = dateKeySchema.parse(req.query.from);
    const to = dateKeySchema.parse(req.query.to);
    if (from > to) return res.status(400).json({ message: "from doit être <= to." });

    const logs = await prisma.dailyLog.findMany({
      where: {
        vendorId: req.user.id,
        dateKey: { gte: from, lte: to },
      },
      orderBy: { dateKey: "asc" },
      select: {
        dateKey: true,
        status: true,
        openingStockValue: true,
        closingStockValue: true,
        openedAt: true,
        closedAt: true,
      },
    });
    return res.json({ from, to, logs });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Paramètres from/to invalides. Format: YYYY-MM-DD." });
    return next(err);
  }
});

logsRouter.get("/:dateKey/summary", async (req, res, next) => {
  try {
    const dateKey = dateKeySchema.parse(req.params.dateKey);
    const summary = await getDailySummary(req.user.id, dateKey);
    if (!summary) return res.status(404).json({ message: "Journal introuvable pour cette date." });
    return res.json({ dateKey, summary });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Date invalide. Format: YYYY-MM-DD." });
    return next(err);
  }
});

logsRouter.get("/:dateKey", async (req, res, next) => {
  try {
    const dateKey = dateKeySchema.parse(req.params.dateKey);
    const log = await getLogWithEntries(req.user.id, dateKey);
    if (!log) return res.status(404).json({ message: "Journal introuvable pour cette date." });
    return res.json({ dateKey, log });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Date invalide. Format: YYYY-MM-DD." });
    return next(err);
  }
});

logsRouter.post("/entries", async (req, res, next) => {
  try {
    const body = createEntrySchema.parse(req.body);
    const vendorId = req.user.id;
    const dateKey = dateKeyDakar();
    const ts = nowDakar().toJSDate();

    const entry = await prisma.$transaction(async (tx) => {
      const log = await ensureDailyLogTx(tx, vendorId, dateKey);

      const needsProduct = ["ARRIVAGE", "VENTE", "RETOUR", "AJUSTEMENT"].includes(body.type);
      if (needsProduct && !body.productId) {
        const e = new Error("Produit requis pour ce type d'entrée.");
        e.statusCode = 400;
        throw e;
      }

      if (body.type === "NOTE" && !body.note) {
        const e = new Error("Le champ note est requis pour le type NOTE.");
        e.statusCode = 400;
        throw e;
      }

      if (["ARRIVAGE", "VENTE", "RETOUR"].includes(body.type)) {
        if (!body.quantity || !body.unitPrice) {
          const e = new Error("Quantité et prix unitaire sont requis.");
          e.statusCode = 400;
          throw e;
        }
      }

      if (body.type === "AJUSTEMENT" && !body.quantity) {
        const e = new Error("La quantité est requise pour AJUSTEMENT.");
        e.statusCode = 400;
        throw e;
      }

      let product = null;
      if (body.productId) {
        product = await tx.product.findFirst({ where: { id: body.productId, vendorId } });
        if (!product) {
          const e = new Error("Produit introuvable.");
          e.statusCode = 404;
          throw e;
        }
      }

      let client = null;
      if (body.clientId) {
        client = await tx.client.findFirst({ where: { id: body.clientId, vendorId } });
        if (!client) {
          const e = new Error("Client introuvable.");
          e.statusCode = 404;
          throw e;
        }
      }

      const invoiceNumber =
        body.type === "VENTE" || body.type === "RETOUR"
          ? await nextInvoiceNumberTx(tx, vendorId, dateKey)
          : null;

      const quantity = body.quantity ?? undefined;
      const unitPrice = body.unitPrice ?? undefined;
      const total =
        quantity && unitPrice && ["ARRIVAGE", "VENTE", "RETOUR"].includes(body.type)
          ? computeTotal(quantity, unitPrice)
          : undefined;

      const created = await tx.logEntry.create({
        data: {
          vendorId,
          dailyLogId: log.id,
          type: body.type,
          productId: body.productId ?? null,
          clientId: body.clientId ?? null,
          clientName: body.clientName ?? client?.name ?? null,
          quantity: quantity ?? null,
          unitPrice: unitPrice ?? null,
          total: total ?? null,
          invoiceNumber,
          note: body.note ?? null,
          timestamp: ts,
        },
      });

      if (product) {
        if (body.type === "ARRIVAGE") {
          await tx.product.update({
            where: { id: product.id },
            data: { quantity: { increment: quantity } },
          });
        } else if (body.type === "VENTE") {
          await tx.product.update({
            where: { id: product.id },
            data: { quantity: { decrement: quantity } },
          });
        } else if (body.type === "RETOUR") {
          await tx.product.update({
            where: { id: product.id },
            data: { quantity: { increment: quantity } },
          });
        } else if (body.type === "AJUSTEMENT") {
          await tx.product.update({
            where: { id: product.id },
            data: { quantity },
          });
        }
      }

      return created;
    });

    return res.status(201).json({ entry });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    if (err?.code === "P2002") {
      return res.status(409).json({ message: "Conflit (facture déjà générée). Réessaie." });
    }
    return next(err);
  }
});

module.exports = { logsRouter };

