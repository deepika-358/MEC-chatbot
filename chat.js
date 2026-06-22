// api/chat.js
// The core RAG endpoint:
// 1. Turn the student's question into an embedding
// 2. Find the most similar document chunks in Supabase (pgvector)
// 3. Ask the LLM to answer using only those chunks
// 4. Log the question + answer into chat_history for the admin panel

const { getSupabaseAdmin } = require('../lib/supabaseAdmin');
const { embedText, answerQuestion } = require('../lib/openai');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const { question, studentName, sessionId } = req.body || {};

    if (!question || typeof question !== 'string' || !question.trim()) {
      res.status(400).json({ error: 'Please type a question.' });
      return;
    }
    if (!sessionId) {
      res.status(400).json({ error: 'Missing session id.' });
      return;
    }

    const supabase = getSupabaseAdmin();

    // 1. Embed the question
    const queryEmbedding = await embedText(question);

    // 2. Vector similarity search via the match_document_chunks() SQL function
    const { data: matches, error: matchError } = await supabase.rpc(
      'match_document_chunks',
      {
        query_embedding: queryEmbedding,
        match_count: 5,
        match_threshold: 0.3,
      }
    );

    if (matchError) throw matchError;

    // 3. Ask the LLM, grounded in the retrieved chunks
    const answer = await answerQuestion(question, matches || []);

    // 4. Log to chat_history (best-effort — don't fail the response if logging fails)
    const matchedChunkIds = (matches || []).map((m) => m.id);
    await supabase.from('chat_history').insert({
      student_name: studentName || null,
      session_id: sessionId,
      question,
      answer,
      matched_chunk_ids: matchedChunkIds,
    });

    res.status(200).json({
      answer,
      sourcesUsed: matches ? matches.length : 0,
    });
  } catch (err) {
    console.error('chat.js error:', err);
    res.status(500).json({
      error: 'Something went wrong while generating the answer. Please try again.',
    });
  }
};
