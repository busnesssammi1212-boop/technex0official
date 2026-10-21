// Vercel serverless function: returns the visitor's country/city (from Vercel edge headers).
module.exports = (req, res) => {
  let city = '';
  try { city = decodeURIComponent(req.headers['x-vercel-ip-city'] || ''); } catch {}
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json({ country: req.headers['x-vercel-ip-country'] || '??', city });
};
