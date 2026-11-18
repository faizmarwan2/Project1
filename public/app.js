/* Web HR – Absensi. Vanilla JS, tanpa build. API: /api (same origin) */
'use strict';

const $ = (s, r = document) => r.querySelector(s);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const store = {
  get token() { try { return localStorage.getItem('hr_token'); } catch { return null; } },
  set token(v) { try { v ? localStorage.setItem('hr_token', v) : localStorage.removeItem('hr_token'); } catch {} },
};
let me = null;
let timer = null;

/* ---------- API ---------- */
async function api(path, { method = 'GET', json, raw } = {}) {
  const headers = {};
  if (store.token) headers.Authorization = 'Bearer ' + store.token;
  if (json) headers['Content-Type'] = 'application/json';
  let res;
  try {
    res = await fetch('/api' + path, { method, headers, body: json ? JSON.stringify(json) : undefined });
  } catch {
    throw new Error('Tidak bisa terhubung ke server. Periksa koneksi lalu coba lagi.'); // ATT-08: tidak ada sukses palsu
  }
  if (res.status === 401 && path !== '/login') { logout('Sesi berakhir, silakan login lagi.'); throw new Error('Sesi berakhir'); } // ATT-07
  if (raw) { if (!res.ok) throw new Error('Gagal memuat'); return res.blob(); }
  const body = await res.json().catch(() => null);
  if (!res.ok) throw new Error(body?.error?.message || `Terjadi kesalahan (${res.status})`);
  return body;
}
const qs = (o) => Object.entries(o).filter(([, v]) => v !== '' && v != null).map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');

/* ---------- util ---------- */
function toast(msg, bad) {
  const t = $('#toast'); t.textContent = msg; t.className = 'show' + (bad ? ' bad' : '');
  clearTimeout(toast.t); toast.t = setTimeout(() => (t.className = ''), 3200);
}
const hhmm = (iso) => (iso ? String(iso).slice(11, 16) : '–'); // sudah WIB dari server
const dmy = (d) => (d ? d.split('-').reverse().join('/') : '');
const todayStr = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Jakarta' }).format(new Date());
const STATUS = {
  TEPAT_WAKTU: ['Tepat waktu', 'b-ok'], TERLAMBAT: ['Terlambat', 'b-late'],
  BELUM_OUT: ['Belum OUT', 'b-out'], SUDAH_OUT: ['Sudah OUT', 'b-ok'], BELUM_IN: ['Belum IN', 'b-no'],
};
const badge = (s) => { const [t, c] = STATUS[s] || [s, 'b-off']; return `<span class="badge ${c}">${t}</span>`; };
const outBadge = (r) => (r.check_out_at ? hhmm(r.check_out_at) : r.status === 'BELUM_IN' ? '–' : '<span class="badge b-out">Belum OUT</span>');
const loading = '<div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>';
const errBox = (m) => `<div class="err" role="alert">${esc(m)}</div>`;

function modal(html) {
  const d = $('#modal'); d.innerHTML = html; if (!d.open) d.showModal(); return d;
}
const closeModal = () => $('#modal').close();
$('#modal').addEventListener('click', (e) => { if (e.target.id === 'modal') closeModal(); });

/* ---------- auth ---------- */
function logout(msg) {
  store.token = null; me = null; clearInterval(timer);
  closeModalSafe(); renderLogin(msg);
}
const closeModalSafe = () => { const d = $('#modal'); if (d.open) d.close(); };

function renderLogin(msg) {
  $('#app').innerHTML = `
  <div class="login">
    <section class="login-art">
      <div class="brand" style="padding:0"><i></i> Absensi HR</div>
      <div>
        <div class="clock" id="clk">--:--</div>
        <small class="muted" id="clkd" style="display:block;margin:8px 0 28px;color:#aab6d3">Waktu server: Asia/Jakarta</small>
        <h1>Pantau kehadiran karyawan hari ini.</h1>
        <p>Jam masuk 08.00 WIB, toleransi 15 menit. Lewat 08.15 tercatat terlambat.</p>
      </div>
      <span></span>
    </section>
    <section class="login-form">
      <form id="lf" novalidate>
        <h2>Masuk sebagai HR</h2>
        ${msg ? `<div class="err" role="alert">${esc(msg)}</div>` : ''}
        <div id="lerr"></div>
        <label>Email<input name="email" type="email" autocomplete="username" required autofocus></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <button class="btn" type="submit">Masuk</button>
      </form>
    </section>
  </div>`;
  const tick = () => {
    const n = new Date(), f = (o) => new Intl.DateTimeFormat('id-ID', { timeZone: 'Asia/Jakarta', ...o }).format(n);
    const c = $('#clk'); if (!c) return clearInterval(renderLogin.t);
    c.textContent = f({ hour: '2-digit', minute: '2-digit', hour12: false }).replace('.', ':');
    $('#clkd').textContent = f({ weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + ' · WIB';
  };
  clearInterval(renderLogin.t); tick(); renderLogin.t = setInterval(tick, 10000);
  $('#lf').onsubmit = async (e) => {
    e.preventDefault();
    const f = e.target, btn = f.querySelector('button'), box = $('#lerr');
    if (!f.email.value || !f.password.value) { box.innerHTML = errBox('Email dan password wajib diisi'); return; }
    btn.disabled = true; btn.textContent = 'Memeriksa…'; box.innerHTML = '';
    try {
      const r = await api('/login', { method: 'POST', json: { email: f.email.value, password: f.password.value } });
      if (r.role !== 'HR') throw new Error('Akun ini bukan HR. Karyawan login lewat aplikasi mobile.');
      store.token = r.token; me = r.user; boot();
    } catch (err) { box.innerHTML = errBox(err.message); btn.disabled = false; btn.textContent = 'Masuk'; }
  };
}

/* ---------- shell & routing ---------- */
const PAGES = { dashboard: ['Dashboard', pgDashboard], absensi: ['Absensi', pgAttendance], karyawan: ['Karyawan', pgEmployees], office: ['Office', pgOffices] };

async function boot() {
  if (!store.token) return renderLogin();
  try { const m = await api('/me'); if (m.role !== 'HR') throw 0; me = m; } catch { if (store.token) logout(); return; }
  $('#app').innerHTML = `
  <div class="shell">
    <aside class="side">
      <div class="brand"><i></i> Absensi HR</div>
      <nav class="nav">${Object.entries(PAGES).map(([k, [t]]) => `<a href="#/${k}" data-k="${k}">${t}</a>`).join('')}</nav>
      <div class="who"><span>${esc(me.email)}</span><button class="btn sm" id="lo">Keluar</button></div>
    </aside>
    <main class="main" id="view"></main>
  </div>`;
  $('#lo').onclick = () => logout();
  route();
}
window.addEventListener('hashchange', () => me && route());

function route() {
  clearInterval(timer);
  const k = (location.hash.replace('#/', '') || 'dashboard').split('?')[0];
  const key = PAGES[k] ? k : 'dashboard';
  document.querySelectorAll('.nav a').forEach((a) => a.classList.toggle('on', a.dataset.k === key));
  document.title = PAGES[key][0] + ' · Absensi HR';
  PAGES[key][1]($('#view'));
}

/* ---------- Dashboard ---------- */
async function pgDashboard(v) {
  let date = todayStr(), tab = 'late', data;
  v.innerHTML = `
    <div class="head"><h1>Dashboard</h1>
      <div class="row"><label>Tanggal<input type="date" id="dd" value="${date}"></label>
      <button class="btn ghost" id="rf">Muat ulang</button></div></div>
    <div id="dbody">${loading}</div>`;
  const load = async (quiet) => {
    if (!quiet) $('#dbody').innerHTML = loading;
    try { data = await api('/dashboard/attendance?date=' + date); draw(); }
    catch (e) { if (!quiet || !data) $('#dbody').innerHTML = errBox(e.message); else toast('Gagal memperbarui: ' + e.message, true); }
  };
  const draw = () => {
    const s = data.summary, max = Math.max(1, ...data.trend.map((t) => t.sudah_in));
    const lists = {
      late: ['Terlambat', data.late], out: ['Belum OUT', data.not_checked_out], no: ['Belum IN', data.not_checked_in],
    };
    const rows = lists[tab][1];
    $('#dbody').innerHTML = `
      <div class="tiles">
        ${tile('t-in', s.sudah_in, 'Sudah IN')}${tile('t-ok', s.tepat_waktu, 'Tepat waktu')}${tile('t-late', s.terlambat, 'Terlambat')}
        ${tile('t-out', s.belum_out, 'Belum OUT')}${tile('t-no', s.belum_in, 'Belum IN')}
      </div>
      <div class="grid2">
        <div class="card">
          <div class="tabs">${Object.entries(lists).map(([k, [t, l]]) => `<button data-t="${k}" class="${k === tab ? 'on' : ''}">${t}<b>${l.length}</b></button>`).join('')}</div>
          <div class="tw">${rows.length ? `<table><thead><tr><th>Kode</th><th>Nama</th>${tab === 'no' ? '' : '<th>IN</th><th>OUT</th>'}</tr></thead><tbody>
            ${rows.map((r) => `<tr><td>${esc(r.employee_code)}</td><td>${esc(r.name)}</td>${tab === 'no' ? '' : `<td class="num">${hhmm(r.check_in_at)}</td><td class="num">${outBadge(r)}</td>`}</tr>`).join('')}
            </tbody></table>` : `<div class="empty">${tab === 'late' ? 'Tidak ada yang terlambat.' : tab === 'out' ? 'Semua yang sudah IN sudah OUT.' : 'Semua karyawan aktif sudah IN.'}</div>`}</div>
        </div>
        <div class="card pad">
          <h2>7 hari terakhir</h2>
          <div class="trend">${data.trend.map((t) => `<div title="${dmy(t.date)}: ${t.sudah_in} hadir, ${t.terlambat} terlambat"><em>${t.sudah_in}</em>
            <span class="bar" style="height:${(t.sudah_in / max) * 100 * 0.8}%">${t.terlambat ? `<i style="height:${(t.terlambat / t.sudah_in) * 100}%"></i>` : ''}</span>${t.date.slice(8)}</div>`).join('')}</div>
          <div class="legend"><span><s style="background:var(--teal)"></s>Hadir</span><span><s style="background:var(--amber)"></s>Terlambat</span></div>
          <p class="muted" style="margin:14px 0 0">Total karyawan aktif: <b>${data.total_active_employees}</b></p>
        </div>
      </div>`;
    document.querySelectorAll('.tabs button').forEach((b) => (b.onclick = () => { tab = b.dataset.t; draw(); }));
  };
  const tile = (c, n, l) => `<div class="card tile ${c}"><b>${n}</b><span>${l}</span></div>`;
  $('#dd').onchange = (e) => { date = e.target.value || todayStr(); load(); };
  $('#rf').onclick = () => load();
  await load();
  timer = setInterval(() => load(true), 60000);
}

/* ---------- Absensi ---------- */
async function pgAttendance(v) {
  const f = { preset: 'today', from: '', to: '', status: '', search: '', page: 1 };
  v.innerHTML = `
    <div class="head"><h1>Absensi</h1><button class="btn ghost" id="csv">Unduh CSV</button></div>
    <div class="card pad" style="margin-bottom:14px"><form class="row" id="af">
      <label>Periode<select name="preset">
        ${[['today', 'Hari ini'], ['yesterday', 'Kemarin'], ['this_week', 'Minggu ini'], ['last7', '7 hari terakhir'], ['last30', '30 hari terakhir'], ['this_month', 'Bulan ini'], ['last_month', 'Bulan lalu'], ['custom', 'Pilih tanggal…']].map(([k, t]) => `<option value="${k}">${t}</option>`).join('')}</select></label>
      <label class="cust" hidden>Dari<input type="date" name="from"></label>
      <label class="cust" hidden>Sampai<input type="date" name="to"></label>
      <label>Status<select name="status"><option value="">Semua</option>
        ${['TEPAT_WAKTU', 'TERLAMBAT', 'BELUM_OUT', 'SUDAH_OUT', 'BELUM_IN'].map((s) => `<option value="${s}">${STATUS[s][0]}</option>`).join('')}</select></label>
      <label style="flex:1;min-width:180px">Cari<input name="search" type="search" placeholder="Nama atau kode karyawan"></label>
    </form><p class="hint" id="ah" style="margin:8px 0 0"></p></div>
    <div class="card"><div id="abody">${loading}</div></div>`;
  const form = $('#af');
  const sync = () => {
    f.preset = form.preset.value; f.status = form.status.value; f.search = form.search.value.trim();
    f.from = form.from.value; f.to = form.to.value;
    document.querySelectorAll('.cust').forEach((e) => (e.hidden = f.preset !== 'custom'));
  };
  const params = (extra = {}) => qs({
    ...(f.preset === 'custom' ? { from: f.from || f.to, to: f.to || f.from } : { preset: f.preset }),
    status: f.status, search: f.search, limit: 20, page: f.page, ...extra,
  });
  let last, rows = [];
  const load = async () => {
    $('#abody').innerHTML = loading;
    try {
      last = await api('/attendance?' + params()); rows = last.data;
      const m = last.meta;
      $('#ah').textContent = `Periode ${dmy(m.from)}${m.from !== m.to ? ' – ' + dmy(m.to) : ''}`;
      $('#abody').innerHTML = rows.length ? `<div class="tw"><table><thead><tr><th>Tanggal</th><th>Kode</th><th>Nama</th><th>IN</th><th>OUT</th><th>Status</th><th>Foto</th><th></th></tr></thead><tbody>
        ${rows.map((r, i) => `<tr><td>${dmy(r.work_date)}</td><td>${esc(r.employee_code)}</td><td>${esc(r.employee_name)}</td>
          <td class="num">${hhmm(r.check_in_at)}</td><td class="num">${outBadge(r)}</td>
          <td>${r.status === 'BELUM_IN' ? badge('BELUM_IN') : badge(r.status)}</td>
          <td>${r.check_in ? `<img class="thumb" alt="Foto IN ${esc(r.employee_name)}" data-photo="${esc(r.check_in.photo_url || '')}">` : ''}</td>
          <td>${r.id ? `<button class="btn ghost sm" data-d="${i}">Detail</button>` : ''}</td></tr>`).join('')}
        </tbody></table></div>
        <div class="pager"><span>${m.total} data · halaman ${m.page} dari ${Math.max(1, m.total_pages)}</span>
        <span><button class="btn ghost sm" id="pv" ${m.page <= 1 ? 'disabled' : ''}>Sebelumnya</button> <button class="btn ghost sm" id="nx" ${m.page >= m.total_pages ? 'disabled' : ''}>Berikutnya</button></span></div>`
        : '<div class="empty">Tidak ada data untuk filter ini. Coba ubah periode atau status.</div>';
      loadThumbs();
      document.querySelectorAll('[data-d]').forEach((b) => (b.onclick = () => detail(rows[+b.dataset.d])));
      const pv = $('#pv'), nx = $('#nx');
      if (pv) pv.onclick = () => { f.page--; load(); };
      if (nx) nx.onclick = () => { f.page++; load(); };
    } catch (e) { $('#abody').innerHTML = errBox(e.message); }
  };
  form.onsubmit = (e) => e.preventDefault();
  form.oninput = () => { clearTimeout(form.t); form.t = setTimeout(() => { sync(); f.page = 1; if (f.preset === 'custom' && !(f.from || f.to)) return; load(); }, 350); };
  $('#csv').onclick = async (e) => {
    const b = e.target; b.disabled = true;
    try {
      const all = []; let p = 1, tp = 1;
      do { const r = await api('/attendance?' + params({ limit: 200, page: p })); all.push(...r.data); tp = r.meta.total_pages; p++; } while (p <= tp && p <= 25);
      const head = ['Tanggal', 'Kode', 'Nama', 'IN', 'OUT', 'Status', 'Jarak IN (m)', 'Jarak OUT (m)'];
      const line = (r) => [r.work_date, r.employee_code, r.employee_name, hhmm(r.check_in_at), hhmm(r.check_out_at), (STATUS[r.status] || [r.status])[0], r.check_in?.distance_m ?? '', r.check_out?.distance_m ?? '']
        .map((c) => `"${String(c).replace(/"/g, '""').replace(/^([=+\-@])/, "'$1")}"`).join(',');
      const blob = new Blob(['﻿' + [head.join(','), ...all.map(line)].join('\n')], { type: 'text/csv' });
      const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `absensi-${todayStr()}.csv` });
      a.click(); URL.revokeObjectURL(a.href); toast(`${all.length} baris diunduh`);
    } catch (err) { toast(err.message, true); }
    b.disabled = false;
  };
  sync(); load();
}

async function loadThumbs() {
  for (const img of document.querySelectorAll('img[data-photo]')) {
    const u = img.dataset.photo;
    if (!u) { img.style.visibility = 'hidden'; continue; }
    try { img.src = URL.createObjectURL(await api(u.replace(/^\/api/, ''), { raw: true })); img.onclick = () => img.closest('tr').querySelector('[data-d]')?.click(); }
    catch { img.style.visibility = 'hidden'; }
  }
}

async function detail(r) {
  const loc = (c) => (c && c.lat != null ? `<a href="https://www.openstreetmap.org/?mlat=${c.lat}&mlon=${c.lng}#map=18/${c.lat}/${c.lng}" target="_blank" rel="noopener">${(+c.lat).toFixed(5)}, ${(+c.lng).toFixed(5)}</a> · ${c.distance_m} m dari office` : '–');
  const d = modal(`<div class="box"><h2>${esc(r.employee_name)} <span class="muted" style="font-weight:500">· ${esc(r.employee_code)} · ${dmy(r.work_date)}</span></h2>
    <div>${badge(r.status)} ${r.check_out_at ? '' : badge('BELUM_OUT')}</div>
    <div class="photos">
      <figure><div class="noimg" id="pi">Memuat foto…</div><figcaption><b>IN ${hhmm(r.check_in_at)}</b><br>${loc(r.check_in)}</figcaption></figure>
      <figure><div class="noimg" id="po">${r.check_out ? 'Memuat foto…' : 'Belum OUT'}</div><figcaption><b>OUT ${hhmm(r.check_out_at)}</b><br>${loc(r.check_out)}</figcaption></figure>
    </div><div class="actions"><button class="btn ghost" onclick="closeModal()">Tutup</button></div></div>`);
  const put = async (id, c) => {
    if (!c?.photo_url) { if (c) $(id, d).textContent = 'Tidak ada foto'; return; }
    try { const u = URL.createObjectURL(await api(c.photo_url.replace(/^\/api/, ''), { raw: true })); $(id, d).outerHTML = `<img id="${id.slice(1)}" alt="Foto absensi" src="${u}">`; }
    catch { $(id, d).textContent = 'Foto gagal dimuat'; }
  };
  put('#pi', r.check_in); put('#po', r.check_out);
}

/* ---------- Karyawan ---------- */
async function pgEmployees(v) {
  const f = { search: '', status: '', page: 1 };
  v.innerHTML = `
    <div class="head"><h1>Karyawan</h1><button class="btn teal" id="add">Tambah karyawan</button></div>
    <div class="card pad" style="margin-bottom:14px"><form class="row" id="ef" onsubmit="return false">
      <label style="flex:1;min-width:180px">Cari<input name="search" type="search" placeholder="Nama, kode, atau email"></label>
      <label>Status<select name="status"><option value="">Semua</option><option value="ACTIVE">Aktif</option><option value="INACTIVE">Nonaktif</option></select></label>
    </form></div>
    <div class="card"><div id="ebody">${loading}</div></div>`;
  let rows = [];
  const load = async () => {
    $('#ebody').innerHTML = loading;
    try {
      const r = await api('/employees?' + qs({ search: f.search, status: f.status, page: f.page, limit: 20 })); rows = r.data; const m = r.meta;
      $('#ebody').innerHTML = rows.length ? `<div class="tw"><table><thead><tr><th>Kode</th><th>Nama</th><th>Email</th><th>Status</th><th></th></tr></thead><tbody>
        ${rows.map((e, i) => `<tr><td>${esc(e.employee_code)}</td><td>${esc(e.name)}</td><td>${esc(e.email || '–')}</td>
          <td>${e.status === 'ACTIVE' ? '<span class="badge b-ok">Aktif</span>' : '<span class="badge b-off">Nonaktif</span>'}</td>
          <td style="text-align:right;white-space:nowrap"><button class="btn ghost sm" data-e="${i}">Ubah</button> <button class="btn ghost sm" data-r="${i}">Reset password</button></td></tr>`).join('')}
        </tbody></table></div>
        <div class="pager"><span>${m.total} karyawan · halaman ${m.page} dari ${Math.max(1, m.total_pages)}</span>
        <span><button class="btn ghost sm" id="pv" ${m.page <= 1 ? 'disabled' : ''}>Sebelumnya</button> <button class="btn ghost sm" id="nx" ${m.page >= m.total_pages ? 'disabled' : ''}>Berikutnya</button></span></div>`
        : '<div class="empty">Belum ada karyawan yang cocok. Klik “Tambah karyawan” untuk membuat yang pertama.</div>';
      document.querySelectorAll('[data-e]').forEach((b) => (b.onclick = () => empForm(rows[+b.dataset.e], load)));
      document.querySelectorAll('[data-r]').forEach((b) => (b.onclick = () => resetPw(rows[+b.dataset.r])));
      const pv = $('#pv'), nx = $('#nx');
      if (pv) pv.onclick = () => { f.page--; load(); }; if (nx) nx.onclick = () => { f.page++; load(); };
    } catch (e) { $('#ebody').innerHTML = errBox(e.message); }
  };
  const form = $('#ef');
  form.oninput = () => { clearTimeout(form.t); form.t = setTimeout(() => { f.search = form.search.value.trim(); f.status = form.status.value; f.page = 1; load(); }, 350); };
  $('#add').onclick = () => empForm(null, load);
  load();
}

function empForm(e, reload) {
  const edit = !!e;
  const d = modal(`<form novalidate><h2>${edit ? 'Ubah karyawan' : 'Tambah karyawan'}</h2><div id="fe"></div>
    <label>Nama<input name="name" required value="${esc(e?.name)}"></label>
    <label>Kode karyawan${edit ? '' : ' <span class="hint">(opsional, otomatis EMP001, EMP002…)</span>'}<input name="employee_code" value="${esc(e?.employee_code)}"></label>
    <label>Email login${edit ? '' : ' <span class="hint">(opsional, otomatis nama.depan@ethes.tech)</span>'}<input name="email" type="email" value="${esc(e?.email)}"></label>
    ${edit ? `<label>Status<select name="status"><option value="ACTIVE" ${e.status === 'ACTIVE' ? 'selected' : ''}>Aktif</option><option value="INACTIVE" ${e.status === 'INACTIVE' ? 'selected' : ''}>Nonaktif</option></select>
      <span class="hint">Karyawan nonaktif tidak bisa login dan IN/OUT. Riwayat tetap tersimpan.</span></label>` : ''}
    <label>${edit ? 'Password baru' : 'Password'} <span class="hint">${edit ? '(kosongkan jika tidak diganti)' : '(opsional, acak jika kosong; minimal 8 karakter)'}</span><input name="password" type="text" autocomplete="off"></label>
    <div class="actions"><button type="button" class="btn ghost" onclick="closeModal()">Batal</button><button class="btn" type="submit">${edit ? 'Simpan perubahan' : 'Simpan'}</button></div></form>`);
  const form = $('form', d);
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const b = form.querySelector('[type=submit]'), body = {};
    for (const k of ['name', 'employee_code', 'email', 'password', 'status']) { const el = form.elements[k]; if (el && (el.value.trim() || (edit && k !== 'password'))) body[k] = el.value.trim(); }
    if (!body.name) { $('#fe', d).innerHTML = errBox('Nama wajib diisi'); return; }
    b.disabled = true; $('#fe', d).innerHTML = '';
    try {
      const r = await api(edit ? '/employees/' + e.id : '/employees', { method: edit ? 'PUT' : 'POST', json: body });
      if (!edit) credsDialog('Karyawan ditambahkan', r.name, r.email, r.initial_password); else { closeModal(); toast('Perubahan disimpan'); }
      reload();
    } catch (err) { $('#fe', d).innerHTML = errBox(err.message); b.disabled = false; }
  };
}

function credsDialog(title, name, email, pw) {
  const d = modal(`<div class="box"><h2>${esc(title)}</h2>
    <p style="margin:0">Berikan akun ini ke <b>${esc(name)}</b> untuk login di aplikasi mobile. Password hanya tampil sekali, jadi salin sekarang.</p>
    <div><div class="hint">Email</div><div class="secret">${esc(email)}</div></div>
    <div><div class="hint">Password</div><div class="secret">${esc(pw)}</div></div>
    <div class="actions"><button class="btn ghost" id="cp">Salin email &amp; password</button><button class="btn" onclick="closeModal()">Selesai</button></div></div>`);
  $('#cp', d).onclick = async () => { try { await navigator.clipboard.writeText(`Email: ${email}\nPassword: ${pw}`); toast('Disalin'); } catch { toast('Gagal menyalin, salin manual', true); } };
}

function resetPw(e) {
  const d = modal(`<div class="box"><h2>Reset password</h2><p style="margin:0">Password lama <b>${esc(e.name)}</b> tidak berlaku lagi dan diganti password acak baru.</p><div id="fe"></div>
    <div class="actions"><button class="btn ghost" onclick="closeModal()">Batal</button><button class="btn" id="go">Reset password</button></div></div>`);
  $('#go', d).onclick = async (ev) => {
    ev.target.disabled = true;
    try { const r = await api(`/employees/${e.id}/reset-password`, { method: 'POST' }); credsDialog('Password direset', e.name, r.email, r.new_password); }
    catch (err) { $('#fe', d).innerHTML = errBox(err.message); ev.target.disabled = false; }
  };
}

/* ---------- Office ---------- */
async function pgOffices(v) {
  v.innerHTML = `<div class="head"><h1>Office</h1><button class="btn teal" id="add">Tambah office</button></div>
    <p class="muted" style="margin-top:-8px;max-width:60ch">Karyawan hanya bisa IN/OUT jika GPS mereka berada di dalam radius salah satu office aktif.</p>
    <div class="card"><div id="obody">${loading}</div></div>`;
  let rows = [];
  const load = async () => {
    try {
      rows = (await api('/offices')).data;
      $('#obody').innerHTML = rows.length ? `<div class="tw"><table><thead><tr><th>Nama</th><th>Alamat</th><th>Koordinat</th><th>Radius</th><th></th></tr></thead><tbody>
        ${rows.map((o, i) => `<tr><td><b>${esc(o.name)}</b></td><td>${esc(o.address || '–')}</td>
          <td><a target="_blank" rel="noopener" href="https://www.openstreetmap.org/?mlat=${o.latitude}&mlon=${o.longitude}#map=17/${o.latitude}/${o.longitude}">${(+o.latitude).toFixed(5)}, ${(+o.longitude).toFixed(5)}</a></td>
          <td class="num">${o.radius_m} m</td><td style="text-align:right"><button class="btn ghost sm" data-o="${i}">Ubah</button></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty">Belum ada office aktif. Tambahkan satu agar karyawan bisa IN/OUT.</div>';
      document.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => officeForm(rows[+b.dataset.o], load)));
    } catch (e) { $('#obody').innerHTML = errBox(e.message); }
  };
  $('#add').onclick = () => officeForm(null, load);
  load();
}

function officeForm(o, reload) {
  const edit = !!o;
  const d = modal(`<form novalidate><h2>${edit ? 'Ubah office' : 'Tambah office'}</h2><div id="fe"></div>
    <label>Nama office<input name="name" required value="${esc(o?.name)}"></label>
    <label>Alamat<input name="address" value="${esc(o?.address)}"></label>
    <div class="row"><label style="flex:1">Latitude<input name="latitude" inputmode="decimal" required value="${esc(o?.latitude)}"></label>
      <label style="flex:1">Longitude<input name="longitude" inputmode="decimal" required value="${esc(o?.longitude)}"></label></div>
    <button type="button" class="btn ghost sm" id="gps" style="justify-self:start">Pakai lokasi saya sekarang</button>
    <label>Radius (meter)<span class="hint">10–5000. Jarak maksimal karyawan dari titik office.</span><input name="radius_m" type="number" min="10" max="5000" required value="${esc(o?.radius_m ?? 100)}"></label>
    ${edit ? '<label style="display:flex;align-items:center;gap:8px;font-weight:500"><input type="checkbox" name="active" checked style="width:auto;min-height:0"> Office aktif <span class="hint">(nonaktif = tidak dipakai validasi GPS dan disembunyikan)</span></label>' : ''}
    <div class="actions"><button type="button" class="btn ghost" onclick="closeModal()">Batal</button><button class="btn" type="submit">Simpan</button></div></form>`);
  const form = $('form', d);
  $('#gps', d).onclick = (ev) => {
    if (!navigator.geolocation) return toast('Browser tidak mendukung GPS', true);
    ev.target.textContent = 'Mencari lokasi…';
    navigator.geolocation.getCurrentPosition((p) => { form.latitude.value = p.coords.latitude.toFixed(6); form.longitude.value = p.coords.longitude.toFixed(6); ev.target.textContent = 'Pakai lokasi saya sekarang'; },
      () => { ev.target.textContent = 'Pakai lokasi saya sekarang'; toast('Lokasi tidak bisa diambil. Izinkan akses lokasi atau isi manual.', true); }, { enableHighAccuracy: true, timeout: 10000 });
  };
  form.onsubmit = async (ev) => {
    ev.preventDefault();
    const x = form.elements, b = form.querySelector('[type=submit]');
    const body = { name: x.name.value.trim(), address: x.address.value.trim(), latitude: x.latitude.value.trim().replace(',', '.'), longitude: x.longitude.value.trim().replace(',', '.'), radius_m: x.radius_m.value };
    if (edit) body.is_active = x.active.checked;
    if (!body.name || body.latitude === '' || body.longitude === '' || isNaN(+body.latitude) || isNaN(+body.longitude)) { $('#fe', d).innerHTML = errBox('Nama, latitude, dan longitude wajib diisi dengan angka'); return; }
    b.disabled = true; $('#fe', d).innerHTML = '';
    try { await api(edit ? '/offices/' + o.id : '/offices', { method: edit ? 'PUT' : 'POST', json: body }); closeModal(); toast('Office disimpan'); reload(); }
    catch (err) { $('#fe', d).innerHTML = errBox(err.message); b.disabled = false; }
  };
}

boot();
