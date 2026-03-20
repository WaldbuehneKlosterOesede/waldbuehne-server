const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    // since parameter: alle Nachrichten nach diesem Timestamp
    const since = parseInt(req.query && req.query.since) || 0;
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/messages?ts=gt.${since}&order=ts.asc&select=*`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    );
    const data = await r.json();
    res.status(200).json(Array.isArray(data) ? data : []);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
