// lib/supabaseAdmin.js
// Server-side Supabase client using the SERVICE ROLE key.
// This key bypasses Row Level Security — it must NEVER be sent to the browser.
// It is only used inside /api functions, read from Vercel environment variables.

const { createClient } = require('@supabase/supabase-js');

let client = null;

function getSupabaseAdmin() {
  if (client) return client;

  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    throw new Error(
      'Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.'
    );
  }

  client = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  return client;
}

module.exports = { getSupabaseAdmin };
