// api/documents.js
// Admin-only. GET lists all uploaded documents (newest first).
// DELETE ?id=... removes a document, its chunks, and its stored file.

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const { requireAdmin } = require('../lib/auth');

module.exports = async function handler(req, res) {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const supabase = getSupabaseAdmin();

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase
        .from('documents')
        .select('id, filename, file_type, category, has_embeddings, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      res.status(200).json({ documents: data });
    } catch (err) {
      console.error('documents.js GET error:', err);
      res.status(500).json({ error: 'Could not load documents.' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    try {
      const id = req.query.id;
      if (!id) {
        res.status(400).json({ error: 'Missing document id.' });
        return;
      }

      const { data: doc, error: fetchError } = await supabase
        .from('documents')
        .select('storage_path')
        .eq('id', id)
        .single();
      if (fetchError) throw fetchError;

      await supabase.storage.from('documents').remove([doc.storage_path]);
      // document_chunks rows are removed automatically via "on delete cascade"
      const { error: delError } = await supabase.from('documents').delete().eq('id', id);
      if (delError) throw delError;

      res.status(200).json({ success: true });
    } catch (err) {
      console.error('documents.js DELETE error:', err);
      res.status(500).json({ error: 'Could not delete document.' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
