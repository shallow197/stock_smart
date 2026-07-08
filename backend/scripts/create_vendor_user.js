require("dotenv").config();

const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");
const { PrismaMariaDb } = require("@prisma/adapter-mariadb");

function buildAdapter() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL manquant dans backend/.env");
  if (typeof PrismaMariaDb.fromUrl === "function") return PrismaMariaDb.fromUrl(url);
  return new PrismaMariaDb(url);
}

const prisma = new PrismaClient({ adapter: buildAdapter() });

async function main() {
  const email = "locheikhsaliou@gmail.com".toLowerCase();
  const password = "password";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    // eslint-disable-next-line no-console
    console.log(`EXISTS id=${existing.id} email=${existing.email}`);
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: {
      shopName: "Boutique",
      ownerName: "Locheikh Saliou",
      email,
      passwordHash,
      category: "General",
    },
    select: { id: true, email: true, shopName: true },
  });

  // eslint-disable-next-line no-console
  console.log(`CREATED id=${user.id} email=${user.email} shop=${user.shopName}`);
}

main()
  .catch((e) => {
    // eslint-disable-next-line no-console
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
