const webpush = require('web-push');
const JSONBIN_KEY = process.env.JSONBIN_MASTER_KEY;
const SUBS_BIN_ID = process.env.SUBS_BIN_ID;
const JSONBIN_BASE = 'https://api.jsonbin.io/v3/b';

webpush.setVapidDetails(
  'mailto:marketing@waldbuehne-kloster-oesede.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getSubs() {
  const r = await fetch(`${JSONBIN_BASE}/${SUBS_BIN_ID}/latest`, {
    headers: { 'X-Master-Key': JSONBIN_KEY }
  });
  const data = await r.json();
  const all = Array.isArray(data.record) ? data.record : [];
  // Nur gültige Subscriptions mit endpoint
  return all.filter(s => s && s.endpoint);
}

async function saveSubs(subs) {
  await fetch(`${JSONBIN_BASE}/${SUBS_BIN_ID}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'X-Master-Key': JSONBIN_KEY },
    body: JSON.stringify(subs)
  });
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body } = req.body;
  const payload = JSON.stringify({ title, body, icon: '/icon.png' });

  let subs = await getSubs();
  const results = await Promise.allSettled(
    subs.map(sub => webpush.sendNotification(sub, payload))
  );

  // Ungültige Subscriptions entfernen
  const validSubs = subs.filter((_, i) => results[i].status === 'fulfilled');
  if (validSubs.length !== subs.length) await saveSubs(validSubs);

  const sent = results.filter(r => r.status === 'fulfilled').length;
  res.status(200).json({ sent, total: sent });
};
