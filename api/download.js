// Vercel function: gives a 60-second download link for a PAID project's file, only if the access key is valid.
// Needs the env var SUPABASE_SERVICE_KEY (Supabase secret / service_role key) set in Vercel. Never put it in the repo.
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const SB = process.env.SUPABASE_URL || 'https://nkpenqvvruduavuvlevt.supabase.co';
  const ANON = process.env.SUPABASE_ANON_KEY || 'sb_publishable_Y1_cSFe75vLd-DikJDMeTA_aHzRlYPX';
  const SECRET = process.env.SUPABASE_SERVICE_KEY;
  if (!SECRET) return res.status(500).json({ error: 'Downloads are not configured yet. Please contact the admin.' });
  let b = req.body; if (typeof b === 'string') { try { b = JSON.parse(b); } catch { b = {}; } }
  const { key, project, device } = b || {};
  if (typeof key !== 'string' || typeof device !== 'string' || typeof project !== 'string' || !UUID.test(project) || key.length > 80 || device.length > 64) return res.status(400).json({ error: 'Bad request' });
  const hdr = (k) => ({ apikey: k, 'Content-Type': 'application/json', ...(k.startsWith('eyJ') ? { Authorization: `Bearer ${k}` } : {}) });
  try {
    const rr = await fetch(`${SB}/rest/v1/rpc/redeem_key`, { method: 'POST', headers: hdr(ANON), body: JSON.stringify({ p_key: key, p_project: project, p_device: device, p_country: req.headers['x-vercel-ip-country'] || null, p_city: null }) });
    const r = await rr.json();
    if (!r || !r.ok) return res.status(403).json({ error: r && r.reason === 'device_limit' ? 'Device limit reached for this key.' : 'Invalid or revoked key.' });
    if (!r.has_file) return res.status(404).json({ error: 'This project has no downloadable file.' });
    const pr = await (await fetch(`${SB}/rest/v1/project_private?project_id=eq.${project}&select=file_path`, { headers: hdr(SECRET) })).json();
    const path = pr && pr[0] && pr[0].file_path; if (!path) return res.status(404).json({ error: 'File not found.' });
    const po = await (await fetch(`${SB}/rest/v1/posts?id=eq.${project}&select=file_name`, { headers: hdr(ANON) })).json();
    const name = (po && po[0] && po[0].file_name) || 'project-file';
    const sr = await fetch(`${SB}/storage/v1/object/sign/project-files-private/${path.split('/').map(encodeURIComponent).join('/')}`, { method: 'POST', headers: hdr(SECRET), body: JSON.stringify({ expiresIn: 60 }) });
    const sj = await sr.json();
    if (!sj.signedURL) return res.status(500).json({ error: 'Could not create the download link.' });
    return res.status(200).json({ url: `${SB}/storage/v1${sj.signedURL}${sj.signedURL.includes('?') ? '&' : '?'}download=${encodeURIComponent(name)}` });
  } catch { return res.status(500).json({ error: 'Server error' }); }
};
