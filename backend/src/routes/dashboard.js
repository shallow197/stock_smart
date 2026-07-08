const express = require("express");

const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");
const { dateKeyDakar, dayRangeDakar } = require("../utils/time");

const dashboardRouter = express.Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get("/today", async (req, res, next) => {
  try {
    const vendorId = req.user.id;
    const dateKey = dateKeyDakar();
    const { start, end } = dayRangeDakar(dateKey);

    const revenueAgg = await prisma.logEntry.aggregate({
      where: { vendorId, type: "VENTE", timestamp: { gte: start, lt: end } },
      _sum: { total: true },
      _count: { _all: true },
    });

    const top = await prisma.logEntry.groupBy({
      by: ["productId"],
      where: { vendorId, type: "VENTE", productId: { not: null }, timestamp: { gte: start, lt: end } },
      _sum: { total: true, quantity: true },
      orderBy: { _sum: { total: "desc" } },
      take: 5,
    });

    const productIds = top.map((t) => t.productId).filter((id) => id !== null);
    const products = await prisma.product.findMany({
      where: { vendorId, id: { in: productIds } },
      select: { id: true, name: true, unit: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    const topProducts = top
      .filter((t) => t.productId !== null)
      .map((t) => ({
        productId: t.productId,
        name: productById.get(t.productId)?.name ?? "Produit supprimé",
        unit: productById.get(t.productId)?.unit ?? null,
        total: t._sum.total ?? "0",
        quantity: t._sum.quantity ?? "0",
      }));

    const allProducts = await prisma.product.findMany({
      where: { vendorId, isAvailable: true },
      select: { id: true, name: true, quantity: true, lowStockThreshold: true, unit: true },
    });
    const lowStock = allProducts
      .filter((p) => Number(p.quantity) <= Number(p.lowStockThreshold))
      .map((p) => ({
        id: p.id,
        name: p.name,
        quantity: p.quantity,
        threshold: p.lowStockThreshold,
        unit: p.unit,
      }))
      .slice(0, 20);

    const recentActivity = await prisma.logEntry.findMany({
      where: { vendorId },
      orderBy: { timestamp: "desc" },
      take: 10,
      include: {
        product: { select: { id: true, name: true, unit: true } },
        client: { select: { id: true, name: true } },
      },
    });

    return res.json({
      dateKey,
      revenue: revenueAgg._sum.total ?? "0",
      salesCount: revenueAgg._count._all,
      topProducts,
      lowStock,
      recentActivity,
    });
  } catch (err) {
    return next(err);
  }
});

module.exports = { dashboardRouter };

