const express = require("express");
const { z } = require("zod");

const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const settingsRouter = express.Router();
settingsRouter.use(requireAuth);

settingsRouter.get("/shop", async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, shopName: true, ownerName: true, email: true, category: true, createdAt: true, updatedAt: true },
    });
    return res.json({ shop: user });
  } catch (err) {
    return next(err);
  }
});

const updateShopSchema = z.object({
  shopName: z.string().min(2).optional(),
  ownerName: z.string().min(2).optional(),
  category: z.string().min(2).optional(),
});

settingsRouter.put("/shop", async (req, res, next) => {
  try {
    const body = updateShopSchema.parse(req.body);
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        shopName: body.shopName ?? undefined,
        ownerName: body.ownerName ?? undefined,
        category: body.category ?? undefined,
      },
      select: { id: true, shopName: true, ownerName: true, email: true, category: true, createdAt: true, updatedAt: true },
    });
    return res.json({ shop: user });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    return next(err);
  }
});

module.exports = { settingsRouter };

