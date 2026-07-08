const { DateTime } = require("luxon");

const DAKAR_TZ = "Africa/Dakar";

function nowDakar() {
  return DateTime.now().setZone(DAKAR_TZ);
}

function dateKeyDakar(dt = nowDakar()) {
  return dt.toFormat("yyyy-LL-dd");
}

function invoiceDatePartFromDateKey(dateKey) {
  return dateKey.replaceAll("-", "");
}

function dayRangeDakar(dateKey) {
  const start = DateTime.fromFormat(dateKey, "yyyy-LL-dd", { zone: DAKAR_TZ }).startOf("day");
  const end = start.plus({ days: 1 });
  return { start: start.toJSDate(), end: end.toJSDate() };
}

module.exports = { DAKAR_TZ, nowDakar, dateKeyDakar, invoiceDatePartFromDateKey, dayRangeDakar };

