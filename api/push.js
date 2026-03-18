const webpush = require('web-push');
const { JsonDB, Config } = require('node-json-db');

webpush.setVapidDetails(
  'mailto:marketing@waldbuehne-kloster-oesede.com',
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

let db;
function getDB() {
  if (!db) db = new JsonDB(new Config('/tmp/subscriptions', true, true, '/'));
  return db;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  // Simple admin key check
  if (req.headers['x-admin-key'] !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { title, body, icon } = req.body;
  const payload = JSON.stringify({ title, body, icon: icon || '/icon.png' });

  let subs = [];
  try {
    const db = getDB();
    subs = await db.getData('/subscriptions');
  } catch(e) {}

  const results = await Promise.allSettled(
    subs.map(sub => webpush.sendNotification(sub, payload))
  );

  const sent = results.filter(r => r.status === 'fulfilled').length;
  res.status(200).json({ sent, total: subs.length });
};
