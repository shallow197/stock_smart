const { z } = require("zod");

const decimalString = z
  .union([z.string(), z.number()])
  .transform((v) => (typeof v === "number" ? String(v) : v.trim()))
  .refine((v) => v.length > 0 && !Number.isNaN(Number(v)), { message: "Nombre invalide." });

const optionalDecimalString = z
  .union([z.string(), z.number(), z.null(), z.undefined()])
  .transform((v) => {
    if (v === null || v === undefined) return undefined;
    return typeof v === "number" ? String(v) : v.trim();
  })
  .refine((v) => v === undefined || (v.length > 0 && !Number.isNaN(Number(v))), { message: "Nombre invalide." });

module.exports = { decimalString, optionalDecimalString };

