const { JsonDB, Config } = require('node-json-db');

let db;
function getDB() {
  if (!db) db = new JsonDB(new Config('/tmp/subscriptions', true, true, '/'));
  return db;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).end();

  try {
    const subscription = req.body;
    const db = getDB();
    let subs = [];
    try { subs = await db.getData('/subscriptions'); } catch(e) {}
    const exists = subs.find(s => s.endpoint === subscription.endpoint);
    if (!exists) {
      subs.push(subscription);
      await db.push('/subscriptions', subs);
    }
    res.status(200).json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
