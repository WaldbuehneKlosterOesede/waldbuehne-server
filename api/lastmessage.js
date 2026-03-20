const JSONBIN_KEY = process.env.JSONBIN_MASTER_KEY;
const MSG_BIN_ID = process.env.MSG_BIN_ID;
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    if (!MSG_BIN_ID) return res.status(200).json(null);
    const r = await fetch(`${JSONBIN_BASE}/${MSG_BIN_ID}/latest`, {
      headers: { 'X-Master-Key': JSONBIN_KEY }
    });
    const data = await r.json();
    res.status(200).json(data.record || null);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
