const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function buildAdapter() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    const e = new Error("DATABASE_URL manquant. Copie `.env.example` vers `.env` et configure MySQL.");
    e.statusCode = 500;
    throw e;
  }
  if (typeof PrismaMariaDb.fromUrl === "function") return PrismaMariaDb.fromUrl(url);
  return new PrismaMariaDb(url);
}

const prisma = new PrismaClient({ adapter: buildAdapter() });

module.exports = { prisma };

