const JSONBIN_KEY = process.env.JSONBIN_MASTER_KEY;
const SUBS_BIN_ID = process.env.SUBS_BIN_ID;
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const { endpoint } = req.body;
    if (!endpoint) return res.status(400).json({ error: 'No endpoint' });

    const r = await fetch(`${JSONBIN_BASE}/${SUBS_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const data = await r.json();
    const all = Array.isArray(data.record) ? data.record : [];
    const filtered = all.filter(s => s && s.endpoint && s.endpoint !== endpoint);

    await fetch(`${JSONBIN_BASE}/${SUBS_BIN_ID}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
      body: JSON.stringify(filtered)
    });
    res.status(200).json({ success: true, remaining: filtered.length });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
