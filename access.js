// Paid-project unlock flow (visitors) + admin review panel (requests, keys, visitors).
const $ = (s, r = document) => r.querySelector(s);
const esc = (v = '') => String(v).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
// Price shown to visitors: a bare number like 10 or $10 becomes "10 USDT"; anything else (e.g. 0.01 ETH) is shown as typed.
export function fmtPrice(v) { v = String(v || '').trim(); const m = v.match(/^\$?\s*(\d+(?:\.\d+)?)$/); return m ? `${m[1]} USDT` : v; }
let geo = { country: '??', city: '' };
const device = localStorage.getItem('tnx_device') || (() => { const d = crypto.randomUUID(); localStorage.setItem('tnx_device', d); return d; })();
async function loadGeo() { try { geo = await (await fetch('/api/geo')).json(); } catch {} }

// ===== Maintenance mode (timer ends it automatically; admins can still use the site) =====
const mt = { endsAt: 0, message: '', db: null, isAdmin: () => false };
const ov = document.createElement('div'); ov.className = 'mt-overlay hidden';
ov.innerHTML = '<div class="mt-box"><img class="brand-logo mt-logo" src="logo.png" alt="Technex"><div class="section-kicker mt-kicker">UNDER MAINTENANCE</div><h2>We’ll be <span>back soon.</span></h2><p id="mt-msg" class="modal-copy"></p><div id="mt-count" class="mt-count"></div><button id="mt-admin" class="button button-quiet" type="button">Admin ↗</button></div>';
const mtBar = document.createElement('div'); mtBar.className = 'mt-banner hidden';
document.body.append(ov, mtBar);
$('#mt-admin', ov).onclick = () => document.getElementById('admin-open').click();
const fmtLeft = (ms) => { const t = Math.max(0, Math.floor(ms / 1000)), d = Math.floor(t / 86400), p = n => String(n).padStart(2, '0'); return `${d ? d + 'd ' : ''}${p(Math.floor(t % 86400 / 3600))}:${p(Math.floor(t % 3600 / 60))}:${p(t % 60)}`; };
function mtTick() {
  const left = mt.endsAt - Date.now();
  if (left <= 0) { ov.classList.add('hidden'); mtBar.classList.add('hidden'); if (mt.endsAt) { mt.endsAt = 0; pollMaintenance(mt.db); } return; }
  const admin = mt.isAdmin();
  ov.classList.toggle('hidden', admin); mtBar.classList.toggle('hidden', !admin);
  $('#mt-count', ov).textContent = fmtLeft(left);
  $('#mt-msg', ov).textContent = mt.message || 'We are improving the site. Please check back soon.';
  mtBar.textContent = `Maintenance mode is ON — visitors see the maintenance page. Ends in ${fmtLeft(left)}.`;
}
export async function pollMaintenance(db) {
  const { data } = await db.rpc('get_maintenance');
  mt.endsAt = data?.active ? Date.now() + data.seconds_left * 1000 : 0; mt.message = data?.message || '';
  mtTick();
}
export function initMaintenance(db, isAdmin) {
  mt.db = db; mt.isAdmin = isAdmin; pollMaintenance(db);
  setInterval(mtTick, 1000); setInterval(() => pollMaintenance(db), 30000);
}

// ===== Ads: Monetag tag (admin pastes it) + Sponsored card (e.g. Design.com affiliate link) =====
function runSnippet(html) {
  const t = document.createElement('template'); t.innerHTML = html;
  t.content.querySelectorAll('script').forEach(old => {
    const s = document.createElement('script');
    [...old.attributes].forEach(a => s.setAttribute(a.name, a.value));
    s.text = old.textContent; document.head.append(s); old.remove();
  });
  document.head.append(t.content);
}
function showSponsor(a) {
  const el = $('#sponsor-slot'); if (!el) return;
  let u = null; try { const x = new URL(a.sponsor_url); if (['https:', 'http:'].includes(x.protocol)) u = x.href; } catch {}
  if (!a.sponsor_enabled || !u || !a.sponsor_title) { el.innerHTML = ''; return; }
  el.innerHTML = `<article class="team-card sponsor-card"><div class="team-body"><span class="team-role">Sponsored</span><h3>${esc(a.sponsor_title)}</h3>${a.sponsor_text ? `<p>${esc(a.sponsor_text)}</p>` : ''}</div><a class="button button-outline" href="${esc(u)}" target="_blank" rel="sponsored noopener noreferrer">${esc(a.sponsor_label || 'Learn more')} <span>↗</span></a></article>`;
}
export async function initAds(db, isAdmin) {
  const { data } = await db.rpc('get_ads'); const a = data || {};
  showSponsor(a);
  if (a.monetag_enabled && a.monetag_code && !isAdmin()) runSnippet(a.monetag_code); // never load ads for the admin (avoids accidental self-clicks)
}
const adForm = (off) => ({ monetag_enabled: !off && $('#ad-m-on').checked, monetag_code: $('#ad-m-code').value.trim(), sponsor_enabled: !off && $('#ad-s-on').checked, sponsor_title: $('#ad-s-title').value.trim(), sponsor_text: $('#ad-s-text').value.trim(), sponsor_url: $('#ad-s-url').value.trim(), sponsor_label: $('#ad-s-label').value.trim() });

// ===== Remember unlocked projects (so refresh / back keeps "View project") =====
const unlocked = new Map();
export const unlockedUrl = (id) => unlocked.get(id)?.url ?? null;
export const isUnlocked = (id) => unlocked.has(id);
const notifyUnlock = () => window.dispatchEvent(new Event('tnx-unlocked'));
export async function restoreUnlocks(db, posts) {
  const todo = posts.filter(p => p.access_type === 'paid' && !unlocked.has(p.id)); if (!todo.length) return;
  if (geo.country === '??') await loadGeo();
  let changed = false;
  for (const p of todo) {
    let key = localStorage.getItem('tnx_key_' + p.id);
    if (!key) { // bought earlier: if the request was approved, pick the key up automatically
      const code = localStorage.getItem('tnx_req_' + p.id);
      if (code) { const { data } = await db.rpc('check_purchase', { p_code: code }); if (data?.[0]?.status === 'approved') key = data[0].access_key; }
    }
    if (!key) continue;
    const { data: r } = await db.rpc('redeem_key', { p_key: key, p_project: p.id, p_device: device, p_country: geo.country, p_city: geo.city });
    if (r?.ok) { unlocked.set(p.id, { url: r.url, hasFile: !!r.has_file }); localStorage.setItem('tnx_key_' + p.id, key); changed = true; }
    else if (r?.reason === 'invalid') localStorage.removeItem('tnx_key_' + p.id); // revoked or wrong key
  }
  if (changed) notifyUnlock();
}

// ===== Project files: upload (admin) + download (paid, key-protected) =====
const B_PUBLIC = 'project-files-public', B_PRIVATE = 'project-files-private', MAX_FILE = 50 * 1024 * 1024;
async function cleanupFiles(db, pid, keepPath) {
  for (const b of [B_PUBLIC, B_PRIVATE]) {
    const { data } = await db.storage.from(b).list(pid);
    const del = (data || []).map(f => `${pid}/${f.name}`).filter(p => p !== keepPath);
    if (del.length) await db.storage.from(b).remove(del);
  }
}
export const removeFiles = (db, pid) => cleanupFiles(db, pid, null);

// Validates the admin form, uploads the file (if any) and saves the post. Returns { error } (null on success).
export async function savePost(db, { allPosts, safeUrl }) {
  const title = $('#post-title').value.trim(), description = $('#post-description').value.trim(), url = safeUrl($('#post-url').value.trim());
  const paid = $('#post-access').value === 'paid', id = $('#post-id').value, file = $('#post-file')?.files?.[0], rm = !!$('#post-file-rm')?.checked;
  const ex = id ? allPosts.find(p => p.id === id) : null;
  const keep = !!(ex?.file_name && !file && !rm);
  if (!title || !description) return { error: 'Enter a title and a description.' };
  if (!url && !file && !keep) return { error: 'Add a project URL, or upload a project file.' };
  if (file && file.size > MAX_FILE) return { error: 'File is too large (max 50 MB).' };
  if (keep && (ex.access_type === 'paid') !== paid) return { error: 'You changed Free/Paid. Please upload the file again.' };
  const pid = id || crypto.randomUUID(), bucket = paid ? B_PRIVATE : B_PUBLIC;
  const fields = { title, description, category: $('#post-category').value, tags: [...new Set($('#post-tags').value.split(',').map(t => t.trim()).filter(Boolean))].slice(0, 10),
    access_type: paid ? 'paid' : 'free', price_text: paid ? ($('#post-price').value.trim() || null) : null, project_url: paid ? null : url };
  let path = null;
  if (file) {
    path = `${pid}/${Date.now()}-${file.name.replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80)}`;
    const up = await db.storage.from(bucket).upload(path, file, { contentType: file.type || 'application/octet-stream' });
    if (up.error) return { error: 'Upload failed: ' + up.error.message };
    Object.assign(fields, { file_name: file.name.slice(0, 120), file_size: file.size, file_path: paid ? null : path });
  } else if (!keep) Object.assign(fields, { file_name: null, file_size: null, file_path: null });
  const r = id ? await db.from('posts').update(fields).eq('id', pid).select('id').single() : await db.from('posts').insert({ id: pid, ...fields }).select('id').single();
  if (r.error) { if (path) await db.storage.from(bucket).remove([path]); return { error: r.error.message }; }
  let pr;
  if (paid) { const priv = { project_id: pid, secret_url: url }; if (file) priv.file_path = path; else if (!keep) priv.file_path = null; pr = await db.from('project_private').upsert(priv); }
  else pr = await db.from('project_private').delete().eq('project_id', pid);
  if (pr.error) return { error: pr.error.message };
  if (file || rm || (ex && ex.access_type !== fields.access_type)) await cleanupFiles(db, pid, path);
  return { error: null };
}

export async function downloadPaid(id, onError = () => {}) {
  const key = localStorage.getItem('tnx_key_' + id); if (!key) return onError('Enter your key first.');
  try {
    const r = await fetch('/api/download', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key, project: id, device }) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.url) return onError(j.error || 'Download failed.');
    location.href = j.url;
  } catch { onError('Download failed.'); }
}

export async function loadSupporters(db) {
  const box = $('#supporter-list'); if (!box) return;
  const { data, error } = await db.from('supporters').select('id,name,amount_text,message,created_at').order('created_at', { ascending: false }).limit(60);
  if (error) { box.innerHTML = '<p class="muted">Supporters list is unavailable right now.</p>'; return; }
  box.innerHTML = data.length ? data.map(s => `<div class="sup-card"><div class="project-avatar">${esc((s.name.trim()[0] || '?').toUpperCase())}</div><div class="sup-info"><strong>${esc(s.name)}</strong>${s.amount_text ? `<span class="tag">${esc(s.amount_text)}</span>` : ''}${s.message ? `<p>${esc(s.message)}</p>` : ''}</div></div>`).join('') : '<p class="muted">No supporters listed yet. Be the first one — use the Donate section above.</p>';
}

export async function logVisit(db) {
  if (sessionStorage.getItem('tnx_v')) return;
  sessionStorage.setItem('tnx_v', '1'); await loadGeo();
  db.rpc('log_visit', { p_visitor: device, p_country: geo.country, p_city: geo.city });
}

const dlg = document.createElement('dialog'); dlg.className = 'modal'; dlg.id = 'unlock-dialog'; document.body.append(dlg);
const say = (sel, text, cls = '') => { const e = $(sel, dlg); e.textContent = text; e.className = 'form-message ' + cls; };

export async function openUnlock(post, db) {
  if (!post) return;
  if (geo.country === '??') await loadGeo();
  const wallet = $('#wallet-address')?.textContent.trim() || '';
  const saved = localStorage.getItem('tnx_req_' + post.id) || '';
  dlg.innerHTML = `<div class="modal-card"><button class="modal-close" type="button" data-x aria-label="Close">×</button>
    <div class="section-kicker">PAID PROJECT · ${esc(fmtPrice(post.price_text))}</div><h2>${esc(post.title)}</h2>
    <label class="field-label">I have an access key</label><input id="u-key" placeholder="TNX-XXXXXX-XXXXXX-XXXXXX-XXXXXX" autocomplete="off">
    <button id="u-redeem" class="button button-primary button-full" type="button">Unlock</button><p id="u-msg" class="form-message"></p><hr>
    <div class="section-kicker">BUY ACCESS</div>
    <p class="modal-copy">Send <b>${esc(fmtPrice(post.price_text) || 'the listed price')}</b> to <code>${esc(wallet)}</code> (EVM networks only, e.g. BEP20 / ERC20 / Polygon), then upload the payment screenshot. The admin verifies it within 24 hours.</p>
    <label class="field-label">Your contact (email or Discord)</label><input id="u-contact" maxlength="200">
    <label class="field-label">Transaction hash (optional)</label><input id="u-tx" maxlength="200">
    <label class="field-label">Payment screenshot (PNG/JPG/WEBP, max 20 MB)</label><input id="u-file" type="file" accept="image/png,image/jpeg,image/webp">
    <button id="u-buy" class="button button-outline button-full" type="button">Submit payment proof</button><p id="u-bmsg" class="form-message"></p><hr>
    <label class="field-label">Already submitted? Enter your request code</label><input id="u-code" value="${esc(saved)}" autocomplete="off">
    <button id="u-check" class="button button-quiet button-full" type="button">Check status</button><p id="u-cmsg" class="form-message"></p></div>`;
  dlg.showModal();
  $('[data-x]', dlg).onclick = () => dlg.close();

  $('#u-redeem', dlg).onclick = async () => {
    const key = $('#u-key', dlg).value.trim(); if (!key) return say('#u-msg', 'Enter your key.', 'error-text');
    say('#u-msg', 'Checking…');
    const { data } = await db.rpc('redeem_key', { p_key: key, p_project: post.id, p_device: device, p_country: geo.country, p_city: geo.city });
    if (!data?.ok) return say('#u-msg', data?.reason === 'device_limit' ? 'This key is already used on the maximum number of devices.' : 'Invalid or revoked key.', 'error-text');
    unlocked.set(post.id, { url: data.url, hasFile: !!data.has_file }); localStorage.setItem('tnx_key_' + post.id, key); notifyUnlock();
    const m = $('#u-msg', dlg); m.className = 'form-message success-text';
    m.innerHTML = `Unlocked. ${data.url ? `<a class="text-link" href="${esc(data.url)}" target="_blank" rel="noopener noreferrer">Open project ↗</a>` : ''} ${data.has_file ? '<button id="u-dl" class="mini-button" type="button">⬇ Download file</button>' : ''}`;
    $('#u-dl', dlg)?.addEventListener('click', () => downloadPaid(post.id, (msg) => say('#u-msg', msg, 'error-text')));
  };

  $('#u-buy', dlg).onclick = async () => {
    const contact = $('#u-contact', dlg).value.trim(), tx = $('#u-tx', dlg).value.trim(), f = $('#u-file', dlg).files[0];
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' }[f?.type];
    if (contact.length < 3 || !ext || f.size > 20 * 1024 * 1024) return say('#u-bmsg', 'Enter your contact and a PNG/JPG/WEBP screenshot under 20 MB.', 'error-text');
    say('#u-bmsg', 'Uploading…');
    const path = `${crypto.randomUUID()}.${ext}`;
    const up = await db.storage.from('payment-proofs').upload(path, f, { contentType: f.type });
    if (up.error) return say('#u-bmsg', up.error.message, 'error-text');
    const { data, error } = await db.rpc('submit_purchase', { p_project: post.id, p_contact: contact, p_tx: tx, p_proof: path, p_country: geo.country, p_city: geo.city });
    if (error) return say('#u-bmsg', error.message, 'error-text');
    localStorage.setItem('tnx_req_' + post.id, data); $('#u-code', dlg).value = data;
    say('#u-bmsg', `Submitted. SAVE this request code: ${data} — check back within 24h.`, 'success-text');
  };

  $('#u-check', dlg).onclick = async () => {
    const code = $('#u-code', dlg).value.trim(); if (!code) return;
    const { data, error } = await db.rpc('check_purchase', { p_code: code }); const r = data?.[0];
    if (error || !r) return say('#u-cmsg', 'Request not found.', 'error-text');
    if (r.status === 'approved') { $('#u-key', dlg).value = r.access_key; say('#u-cmsg', `Approved! Your key: ${r.access_key} (copied into the key box above — press Unlock).`, 'success-text'); }
    else say('#u-cmsg', r.status === 'pending' ? 'Pending review (up to 24h).' : `Rejected. ${r.admin_note || ''}`, r.status === 'pending' ? '' : 'error-text');
  };
}

export async function renderAdminExtras(ctx) {
  const { db, getPosts, showToast } = ctx; const box = $('#admin-extra');
  box.innerHTML = '<p class="muted">Loading…</p>';
  const posts = getPosts(), title = Object.fromEntries(posts.map(p => [p.id, p.title])), paid = posts.filter(p => p.access_type === 'paid');
  const [rq, ks, vs, sp, mtq, adq] = await Promise.all([
    db.from('purchase_requests').select('*').order('created_at', { ascending: false }).limit(100),
    db.from('access_keys').select('*, key_uses(country, city, last_used)').order('created_at', { ascending: false }),
    db.from('site_visits').select('visitor_id, country, city, created_at').order('created_at', { ascending: false }).limit(5000),
    db.from('supporters').select('*').order('created_at', { ascending: false }).limit(100),
    db.rpc('get_maintenance'),
    db.rpc('get_ads')]);
  const ad = adq.data || {};
  const mOn = !!mtq.data?.active;
  const v = vs.data || [], by = {};
  for (const x of v) { const e = by[x.country || '??'] ||= { n: 0, s: new Set() }; e.n++; e.s.add(x.visitor_id); }
  const top = Object.entries(by).sort((a, b) => b[1].n - a[1].n).slice(0, 12);
  const reqHtml = (rq.data || []).map(r => `<div class="xrow"><div><strong>${esc(title[r.project_id] || 'Deleted project')}</strong><small>${esc(r.contact)} · ${esc(r.country || '??')} ${esc(r.city || '')} · ${new Date(r.created_at).toLocaleString()}${r.tx_hash ? ' · tx ' + esc(r.tx_hash) : ''} · <b>${r.status.toUpperCase()}</b></small></div><div class="admin-post-actions"><button class="mini-button" data-act="proof" data-path="${esc(r.proof_path)}">Screenshot</button>${r.status === 'pending' ? `<button class="mini-button" data-act="approve" data-id="${r.id}">Approve + key</button><button class="mini-button mini-danger" data-act="reject" data-id="${r.id}">Reject</button>` : ''}</div></div>`).join('') || '<p class="muted">No requests yet.</p>';
  const keyHtml = (ks.data || []).map(k => `<div class="xrow"><div><code>${esc(k.key_code)}</code><small>${esc(title[k.project_id] || '')} · ${esc(k.label || '')} · ${k.status} · devices ${k.key_uses.length}/${k.max_devices}${k.key_uses.length ? ' · ' + k.key_uses.map(u => esc(u.country || '??') + (u.city ? '/' + esc(u.city) : '') + ' ' + new Date(u.last_used).toLocaleDateString()).join(', ') : ''}</small></div><div class="admin-post-actions"><button class="mini-button" data-act="${k.status === 'active' ? 'revoke' : 'activate'}" data-id="${k.id}">${k.status === 'active' ? 'Revoke' : 'Activate'}</button><button class="mini-button mini-danger" data-act="delkey" data-id="${k.id}">Delete</button></div></div>`).join('') || '<p class="muted">No keys yet.</p>';
  box.innerHTML = `<div class="xsec"><div class="admin-list-head"><h3>Maintenance mode</h3><span class="mono">${mOn ? 'ON · ' + Math.ceil(mtq.data.seconds_left / 60) + ' MIN LEFT' : 'OFF'}</span></div>
    <div class="xrow"><input id="x-mnum" type="number" min="1" value="1"><select id="x-munit"><option value="1">minutes</option><option value="60" selected>hours</option><option value="1440">days</option></select><input id="x-mmsg" placeholder="Message for visitors (optional)" maxlength="200"><button class="mini-button" data-act="mstart">Start maintenance</button>${mOn ? '<button class="mini-button mini-danger" data-act="mend">End now</button>' : ''}</div></div>
    <div class="xsec"><div class="admin-list-head"><h3>Ads</h3><span class="mono">${ad.monetag_enabled || ad.sponsor_enabled ? 'ON' : 'OFF'}</span></div>
    <div class="xcol"><label class="xchk"><input id="ad-m-on" type="checkbox" ${ad.monetag_enabled ? 'checked' : ''}> Monetag ads ON</label>
    <textarea id="ad-m-code" rows="4" placeholder="Paste the Monetag tag/script here" maxlength="4000">${esc(ad.monetag_code || '')}</textarea>
    <label class="xchk"><input id="ad-s-on" type="checkbox" ${ad.sponsor_enabled ? 'checked' : ''}> Sponsored card (Design.com) ON</label>
    <input id="ad-s-title" placeholder="Title" maxlength="80" value="${esc(ad.sponsor_title || 'Create a professional logo with Design.com')}">
    <input id="ad-s-text" placeholder="Short text" maxlength="200" value="${esc(ad.sponsor_text || 'Design a logo and brand in minutes.')}">
    <input id="ad-s-url" placeholder="Your Design.com affiliate link (https://...)" maxlength="500" value="${esc(ad.sponsor_url || '')}">
    <input id="ad-s-label" placeholder="Button text" maxlength="30" value="${esc(ad.sponsor_label || 'Try Design.com')}">
    <div class="row"><button class="mini-button" data-act="adsave">Save ads</button><button class="mini-button mini-danger" data-act="adsoff">Hide all ads now</button></div></div></div>
    <div class="xsec"><div class="admin-list-head"><h3>Payment requests</h3><span class="mono">${(rq.data || []).filter(r => r.status === 'pending').length} PENDING</span></div>${reqHtml}</div>
    <div class="xsec"><div class="admin-list-head"><h3>Access keys</h3></div>
    <div class="xrow"><select id="x-proj">${paid.map(p => `<option value="${p.id}">${esc(p.title)}</option>`).join('') || '<option value="">No paid projects</option>'}</select><input id="x-label" placeholder="Label (e.g. buyer name)" maxlength="80"><button class="mini-button" data-act="gen">Generate key</button></div>${keyHtml}</div>
    <div class="xsec"><div class="admin-list-head"><h3>Visitors (last ${v.length})</h3><span class="mono">${new Set(v.map(x => x.visitor_id)).size} UNIQUE</span></div>${top.map(([c, e]) => `<div class="xrow"><span>${esc(c)}</span><span class="mono">${e.n} visits · ${e.s.size} visitors</span></div>`).join('') || '<p class="muted">No visits logged yet.</p>'}</div>
    <div class="xsec"><div class="admin-list-head"><h3>Supporters (public list)</h3><span class="mono">${(sp.data || []).length} LISTED</span></div>
    <div class="xrow"><input id="x-sname" placeholder="Name / nickname" maxlength="60"><input id="x-samt" placeholder="Amount (e.g. 5 USDT)" maxlength="30"><input id="x-smsg" placeholder="Short message (optional)" maxlength="200"><button class="mini-button" data-act="addsup">Add supporter</button></div>
    ${(sp.data || []).map(s => `<div class="xrow"><div><strong>${esc(s.name)}</strong><small>${esc(s.amount_text || '')} ${esc(s.message || '')}</small></div><div class="admin-post-actions"><button class="mini-button mini-danger" data-act="delsup" data-id="${s.id}">Remove</button></div></div>`).join('')}</div>`;
  box.onclick = async (e) => {
    const b = e.target.closest('[data-act]'); if (!b) return; const id = b.dataset.id, act = b.dataset.act; let r = {};
    if (act === 'proof') { const w = window.open('', '_blank'); const { data, error } = await db.storage.from('payment-proofs').createSignedUrl(b.dataset.path, 300); if (error) { w?.close(); return showToast(error.message, 'error'); } if (w) { w.opener = null; w.location = data.signedUrl; } return; }
    if (act === 'approve') { const n = prompt('Max devices for this key?', '2'); if (n === null) return; r = await db.rpc('admin_approve_purchase', { p_request: id, p_note: '', p_max_devices: +n || 2 }); }
    if (act === 'reject') { const note = prompt('Reason (shown to buyer):', '') ?? ''; r = await db.from('purchase_requests').update({ status: 'rejected', admin_note: note, reviewed_at: new Date().toISOString() }).eq('id', id); }
    if (act === 'gen') { const p = $('#x-proj').value; if (!p) return; r = await db.rpc('admin_generate_key', { p_project: p, p_label: $('#x-label').value, p_max_devices: 2 }); if (!r.error) prompt('New key (copy it):', r.data); }
    if (act === 'revoke' || act === 'activate') r = await db.from('access_keys').update({ status: act === 'revoke' ? 'revoked' : 'active' }).eq('id', id);
    if (act === 'addsup') { const name = $('#x-sname').value.trim(); if (!name) return showToast('Enter a name.', 'error'); r = await db.from('supporters').insert({ name, amount_text: $('#x-samt').value.trim() || null, message: $('#x-smsg').value.trim() || null }); }
    if (act === 'delsup') { if (!confirm('Remove this supporter?')) return; r = await db.from('supporters').delete().eq('id', id); }
    if (act === 'mstart') { const n = Math.floor(+$('#x-mnum').value); if (!(n > 0)) return showToast('Enter a valid time.', 'error'); r = await db.rpc('admin_set_maintenance', { p_minutes: n * +$('#x-munit').value, p_message: $('#x-mmsg').value.trim() }); }
    if (act === 'mend') r = await db.rpc('admin_set_maintenance', { p_minutes: 0, p_message: '' });
    if (act === 'adsave' || act === 'adsoff') r = await db.rpc('admin_set_ads', { p: adForm(act === 'adsoff') });
    if (act === 'delkey') { if (!confirm('Delete this key?')) return; r = await db.from('access_keys').delete().eq('id', id); }
    if (r.error) return showToast(r.error.message, 'error');
    showToast('Done.', 'success'); renderAdminExtras(ctx); loadSupporters(db); pollMaintenance(db);
  };
}
