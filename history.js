// api/upload.js
// Admin-only endpoint. Accepts a multipart/form-data upload (file + category),
// stores the raw file in Supabase Storage, and — for text-extractable files
// (pdf, docx, txt) — chunks the text and stores embeddings for vector search.
// Image files are stored for record-keeping but are not embedded (no OCR yet).

const Busboy = require('busboy');
const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const { requireAdmin } = require('../lib/auth');
const { embedBatch, chunkText } = require('../lib/openai');

// Note: this is a plain Vercel serverless function (not Next.js), so
// req.body is only auto-parsed for json/text/urlencoded — multipart
// form-data is left as a raw stream automatically, which is exactly
// what we want here. We read it directly with busboy below.

function parseMultipart(req) {
  return new Promise((resolve, reject) => {
    const busboy = Busboy({ headers: req.headers, limits: { fileSize: 25 * 1024 * 1024 } });
    const fields = {};
    let fileBuffer = null;
    let fileInfo = null;

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, fileStream, info) => {
      const chunks = [];
      fileStream.on('data', (d) => chunks.push(d));
      fileStream.on('limit', () => reject(new Error('File too large (max 25MB).')));
      fileStream.on('end', () => {
        fileBuffer = Buffer.concat(chunks);
        fileInfo = info; // { filename, encoding, mimeType }
      });
    });

    busboy.on('error', reject);
    busboy.on('finish', () => resolve({ fields, fileBuffer, fileInfo }));

    req.pipe(busboy);
  });
}

function detectFileType(filename, mimeType) {
  const ext = (filename.split('.').pop() || '').toLowerCase();
  if (['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(ext)) return 'image';
  if (ext === 'pdf') return 'pdf';
  if (ext === 'docx') return 'docx';
  if (['txt', 'md'].includes(ext)) return 'txt';
  return mimeType || 'other';
}

async function extractText(fileType, buffer) {
  if (fileType === 'pdf') {
    const pdfParse = require('pdf-parse');
    const result = await pdfParse(buffer);
    return result.text;
  }
  if (fileType === 'docx') {
    const mammoth = require('mammoth');
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  }
  if (fileType === 'txt') {
    return buffer.toString('utf-8');
  }
  return null; // images / unsupported types
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const admin = await requireAdmin(req, res);
  if (!admin) return; // requireAdmin already sent the response

  try {
    const { fields, fileBuffer, fileInfo } = await parseMultipart(req);

    if (!fileBuffer || !fileInfo) {
      res.status(400).json({ error: 'No file received.' });
      return;
    }

    const category = fields.category || 'general';
    const filename = fileInfo.filename;
    const fileType = detectFileType(filename, fileInfo.mimeType);
    const storagePath = `${Date.now()}-${filename}`.replace(/\s+/g, '_');

    const supabase = getSupabaseAdmin();

    // 1. Upload raw file to Supabase Storage (private bucket "documents")
    const { error: storageError } = await supabase.storage
      .from('documents')
      .upload(storagePath, fileBuffer, {
        contentType: fileInfo.mimeType,
        upsert: false,
      });
    if (storageError) throw storageError;

    // 2. Create the documents row
    const { data: docRow, error: docError } = await supabase
      .from('documents')
      .insert({
        filename,
        file_type: fileType,
        category,
        storage_path: storagePath,
        uploaded_by: admin.id,
      })
      .select()
      .single();
    if (docError) throw docError;

    // 3. Extract text + embed, if this file type supports it
    const text = await extractText(fileType, fileBuffer);

    if (text && text.trim().length > 30) {
      const chunks = chunkText(text);
      if (chunks.length > 0) {
        const embeddings = await embedBatch(chunks);
        const rows = chunks.map((content, i) => ({
          document_id: docRow.id,
          chunk_index: i,
          content,
          embedding: embeddings[i],
        }));
        const { error: chunkError } = await supabase.from('document_chunks').insert(rows);
        if (chunkError) throw chunkError;

        await supabase
          .from('documents')
          .update({ has_embeddings: true })
          .eq('id', docRow.id);
      }
    }

    res.status(200).json({
      success: true,
      document: { ...docRow, has_embeddings: !!text },
      message:
        fileType === 'image'
          ? 'Image stored. (Image text recognition is not enabled yet, so it will not be used to answer questions.)'
          : 'File processed and added to the knowledge base.',
    });
  } catch (err) {
    console.error('upload.js error:', err);
    res.status(500).json({ error: err.message || 'Upload failed.' });
  }
};
