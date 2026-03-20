const webpush = require('web-push');
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

webpush.setVapidDetails(
  'mailto:marketing@waldbuehne-kloster-oesede.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function getSubs() {
  const r = await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?select=*`, {
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
  return r.json();
}

async function deleteSub(id) {
  await fetch(`${SUPABASE_URL}/rest/v1/subscriptions?id=eq.${id}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
  });
}

async function saveMessage(title, body) {
  // Nachricht anhängen (nicht ersetzen)
  await fetch(`${SUPABASE_URL}/rest/v1/messages`, {
    method: 'POST',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}`, 'Content-Type': 'application/json', 'Prefer': 'return=minimal' },
    body: JSON.stringify({ title, body, ts: Date.now() })
  });
  // Alte Nachrichten (älter als 7 Tage) aufräumen
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  await fetch(`${SUPABASE_URL}/rest/v1/messages?ts=lt.${weekAgo}`, {
    method: 'DELETE',
    headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
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

  // Nachricht speichern
  await saveMessage(title, body);

  const subs = await getSubs();
  const payload = JSON.stringify({ title, body, icon: '/icon.png' });

  const results = await Promise.allSettled(
    subs.map(sub => webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      payload
    ))
  );

  // Ungültige entfernen
  for (let i = 0; i < results.length; i++) {
    if (results[i].status === 'rejected') await deleteSub(subs[i].id);
  }

  const sent = results.filter(r => r.status === 'fulfilled').length;
  res.status(200).json({ sent, total: subs.length });
};
