// lib/auth.js
// Verifies the Supabase Auth access token sent by the admin frontend.
// Every protected /api route (history, upload, documents) calls this first.

const { getSupabaseAdmin } = require('./supabaseAdmin');

async function requireAdmin(req, res) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ error: 'Missing admin session. Please log in again.' });
    return null;
  }

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data?.user) {
    res.status(401).json({ error: 'Session expired. Please log in again.' });
    return null;
  }

  // data.user is a real, signed-in Supabase Auth user — safe to treat as admin,
  // since this app never exposes a public sign-up flow (admins are created
  // manually in the Supabase dashboard).
  return data.user;
}

module.exports = { requireAdmin };
