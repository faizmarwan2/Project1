const cfg = require('../config');

const dateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: cfg.tz, year: 'numeric', month: '2-digit', day: '2-digit' });
const timeFmt = new Intl.DateTimeFormat('en-GB', { timeZone: cfg.tz, hour: '2-digit', minute: '2-digit', hour12: false });

/** Tanggal kerja (YYYY-MM-DD) di zona Asia/Jakarta */
const workDate = (d = new Date()) => dateFmt.format(d);

/** Menit sejak 00:00 WIB */
const minutesOfDay = (d = new Date()) => {
  const [h, m] = timeFmt.format(d).split(':').map(Number);
  return h * 60 + m;
};

/** Status: lewat 08.15 => TERLAMBAT (08.15 tepat masih TEPAT_WAKTU) */
const attendanceStatus = (d = new Date()) => {
  const [h, m] = cfg.workStart.split(':').map(Number);
  const limit = h * 60 + m + cfg.lateToleranceMin;
  return minutesOfDay(d) > limit ? 'TERLAMBAT' : 'TEPAT_WAKTU';
};

const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !isNaN(Date.parse(s));

const addDays = (ymd, n) => {
  const d = new Date(ymd + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

/** Preset periode -> {from,to} */
const resolvePreset = (preset) => {
  const today = workDate();
  const [y, m] = today.split('-').map(Number);
  const ms = String(m).padStart(2, '0');
  switch (preset) {
    case 'today': return { from: today, to: today };
    case 'yesterday': { const y1 = addDays(today, -1); return { from: y1, to: y1 }; }
    case 'last7': return { from: addDays(today, -6), to: today };
    case 'last30': return { from: addDays(today, -29), to: today };
    case 'this_week': {
      const dow = new Date(today + 'T00:00:00Z').getUTCDay() || 7; // Senin=1
      return { from: addDays(today, -(dow - 1)), to: today };
    }
    case 'this_month': return { from: `${y}-${ms}-01`, to: today };
    case 'last_month': {
      const pm = m === 1 ? 12 : m - 1, py = m === 1 ? y - 1 : y;
      return { from: `${py}-${String(pm).padStart(2, '0')}-01`, to: addDays(`${y}-${ms}-01`, -1) };
    }
    default: return null;
  }
};

module.exports = { workDate, attendanceStatus, isDate, addDays, resolvePreset };

/** ISO dengan offset +07:00 (WIB) untuk disimpan & ditampilkan */
module.exports.nowWib = (d = new Date()) => new Date(d.getTime() + 7 * 3600e3).toISOString().replace('Z', '+07:00');
