const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");

const { prisma } = require("../prisma");
const { requireAuth } = require("../middleware/auth");

const authRouter = express.Router();

const registerSchema = z.object({
  shopName: z.string().min(2),
  ownerName: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  category: z.string().min(2),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

function signToken(userId) {
  return jwt.sign({ sub: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
}

authRouter.post("/register", async (req, res, next) => {
  try {
    const body = registerSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ message: "Cet email existe déjà." });

    const passwordHash = await bcrypt.hash(body.password, 12);

    const user = await prisma.user.create({
      data: {
        shopName: body.shopName,
        ownerName: body.ownerName,
        email,
        passwordHash,
        category: body.category,
      },
      select: { id: true, shopName: true, ownerName: true, email: true, category: true, createdAt: true },
    });

    const token = signToken(user.id);
    return res.status(201).json({ token, user });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    return next(err);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const body = loginSchema.parse(req.body);
    const email = body.email.toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ message: "Email ou mot de passe incorrect." });

    const ok = await bcrypt.compare(body.password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: "Email ou mot de passe incorrect." });

    const token = signToken(user.id);
    return res.json({
      token,
      user: { id: user.id, shopName: user.shopName, ownerName: user.ownerName, email: user.email, category: user.category },
    });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ message: "Données invalides.", issues: err.issues });
    return next(err);
  }
});

authRouter.get("/me", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, shopName: true, ownerName: true, email: true, category: true, createdAt: true, updatedAt: true },
    });
    return res.json({ user });
  } catch (err) {
    return next(err);
  }
});

module.exports = { authRouter };

