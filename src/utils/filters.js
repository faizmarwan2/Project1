const { ApiError } = require('./http');
const T = require('./time');

const MAX_RANGE_DAYS = 366;

/**
 * Filter tanggal (prioritas): ?date= > ?from=&to= > ?preset= > default.
 * preset: today | yesterday | this_week | last7 | last30 | this_month | last_month
 */
function dateRange(q, def = 'today') {
  let from, to;
  if (q.date) { from = to = q.date; }
  else if (q.from || q.to) { from = q.from || q.to; to = q.to || q.from; }
  else {
    const p = T.resolvePreset(q.preset || def);
    if (!p) throw new ApiError(400, 'preset tidak valid (today, yesterday, this_week, last7, last30, this_month, last_month)', 'VALIDATION');
    ({ from, to } = p);
  }
  if (!T.isDate(from) || !T.isDate(to)) throw new ApiError(400, 'Format tanggal harus YYYY-MM-DD', 'VALIDATION');
  if (from > to) throw new ApiError(400, '"from" tidak boleh setelah "to"', 'VALIDATION');
  if ((Date.parse(to) - Date.parse(from)) / 864e5 > MAX_RANGE_DAYS) throw new ApiError(400, `Rentang maksimal ${MAX_RANGE_DAYS} hari`, 'VALIDATION');
  return { from, to };
}

const paging = (q) => {
  const page = Math.max(1, +q.page || 1), limit = Math.min(200, Math.max(1, +q.limit || 20));
  return { page, limit, offset: (page - 1) * limit };
};

module.exports = { dateRange, paging };
