const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).end();

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/appstate?select=data&limit=1`, {
      headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
    });
    const rows = await r.json();
    const data = rows && rows.length ? rows[0].data : {};

    // Nur modus + ticketStatus + die aktive Show zurückgeben
    const modus = data.modus || 'auto';
    const ticketStatus = data.ticketStatus || {};
    const ticketUrl = data.ticketUrl || '';
    const neutralText = data.neutralText || '';

    // Aktive Show bestimmen
    let activeShowKey = null;
    if (modus !== 'neutral' && modus !== 'homepage' && modus !== 'auto') {
      activeShowKey = modus;
    } else if (modus === 'auto' && data.shows) {
      // Heute's Datum prüfen
      const today = new Date().toISOString().split('T')[0];
      const SHOW_KEYS = ['familienmusical','abendmusical','winterstueck','wintertheater','event1','event2','event3','event4'];
      for (const key of SHOW_KEYS) {
        const show = data.shows[key];
        if (show && show.termine) {
          const hasToday = show.termine.some(t => {
            const d = typeof t === 'object' ? t.date : t;
            return d === today;
          });
          if (hasToday) { activeShowKey = key; break; }
        }
      }
    }

    // Minimaler State: nur was für den Startscreen nötig ist
    const minimal = {
      modus,
      ticketStatus,
      ticketUrl,
      neutralText,
      shows: {}
    };

    // Nur die aktive Show einbeziehen
    if (activeShowKey && data.shows && data.shows[activeShowKey]) {
      const show = data.shows[activeShowKey];
      minimal.shows[activeShowKey] = {
        name: show.name,
        logo: show.logo,
        bg: show.bg,
        bgColor: show.bgColor,
        accentColor: show.accentColor,
        termine: show.termine,
        standort: show.standort
      };
    }

    // Nächste Termine für Neutral-Screen
    if (modus === 'neutral' || modus === 'auto' && !activeShowKey) {
      minimal.shows = {};
      if (data.shows) {
        Object.keys(data.shows).forEach(key => {
          const show = data.shows[key];
          if (show && show.termine && show.termine.length) {
            minimal.shows[key] = {
              name: show.name,
              logo: show.logo,
              termine: show.termine
            };
          }
        });
      }
    }

    res.status(200).json(minimal);
  } catch(e) {
    res.status(500).json({ error: e.message });
  }
};
