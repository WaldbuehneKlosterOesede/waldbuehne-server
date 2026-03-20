const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

async function supabase(method, table, body) {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method,
    headers: {
      'apikey': SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': method === 'POST' ? 'return=minimal' : ''
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (method === 'GET') return r.json();
  return r;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const sub = req.body;
    if (!sub || !sub.endpoint) return res.status(400).json({ error: 'Invalid' });

    // Prüfen ob bereits vorhanden
    const existing = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?endpoint=eq.${encodeURIComponent(sub.endpoint)}&select=id`,
      { headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` } }
    ).then(r => r.json());

    if (!existing || existing.length === 0) {
      await supabase('POST', 'subscriptions', {
        endpoint: sub.endpoint,
        p256dh: sub.keys?.p256dh || '',
        auth: sub.keys?.auth || ''
      });
    }
    res.status(200).json({ success: true });
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
