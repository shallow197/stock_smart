const { invoiceDatePartFromDateKey } = require("../utils/time");

async function nextInvoiceNumberTx(tx, vendorId, dateKey) {
  const datePart = invoiceDatePartFromDateKey(dateKey);
  const prefix = `INV-${datePart}-`;

  const last = await tx.logEntry.findFirst({
    where: { vendorId, invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: "desc" },
    select: { invoiceNumber: true },
  });

  let next = 1;
  if (last?.invoiceNumber) {
    const parts = last.invoiceNumber.split("-");
    const seq = Number(parts[2]);
    if (!Number.isNaN(seq)) next = seq + 1;
  }

  const seqStr = String(next).padStart(4, "0");
  return `${prefix}${seqStr}`;
}

module.exports = { nextInvoiceNumberTx };

