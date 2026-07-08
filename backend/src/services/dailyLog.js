const { nowDakar, dateKeyDakar } = require("../utils/time");

async function computeStockValueTx(tx, vendorId) {
  const products = await tx.product.findMany({
    where: { vendorId },
    select: { quantity: true, price: true },
  });
  const total = products.reduce((acc, p) => acc + Number(p.quantity) * Number(p.price), 0);
  return String(Math.round(total * 100) / 100);
}

async function ensureDailyLogTx(tx, vendorId, dateKey) {
  const now = nowDakar().toJSDate();

  const openToClose = await tx.dailyLog.findMany({
    where: { vendorId, status: "OPEN", dateKey: { not: dateKey } },
    select: { id: true },
  });
  if (openToClose.length > 0) {
    const closingStockValue = await computeStockValueTx(tx, vendorId);
    await tx.dailyLog.updateMany({
      where: { id: { in: openToClose.map((l) => l.id) } },
      data: { status: "CLOSED", closedAt: now, closingStockValue },
    });
  }

  const existing = await tx.dailyLog.findUnique({
    where: { vendorId_dateKey: { vendorId, dateKey } },
  });
  if (existing) return existing;

  const openingStockValue = await computeStockValueTx(tx, vendorId);
  const log = await tx.dailyLog.create({
    data: { vendorId, dateKey, status: "OPEN", openedAt: now, openingStockValue },
  });

  return log;
}

async function ensureTodayDailyLog(prisma, vendorId) {
  const dateKey = dateKeyDakar();
  const log = await prisma.$transaction((tx) => ensureDailyLogTx(tx, vendorId, dateKey));
  return { log, dateKey };
}

module.exports = { ensureDailyLogTx, ensureTodayDailyLog };

