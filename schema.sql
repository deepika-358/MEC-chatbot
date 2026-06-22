// lib/openai.js
// Thin wrapper around the OpenAI API: embeddings (for vector search) and
// chat completion (for the actual answer). Reads the key from env vars.

const OPENAI_URL = 'https://api.openai.com/v1';

function getApiKey() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('Missing OPENAI_API_KEY environment variable.');
  return key;
}

// Turns text into a 1536-dimension embedding vector.
async function embedText(text) {
  const res = await fetch(`${OPENAI_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI embeddings error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.data[0].embedding;
}

// Embeds many chunks of text in one batched request (cheaper & faster than one-by-one).
async function embedBatch(texts) {
  const res = await fetch(`${OPENAI_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: texts,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI embeddings error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.data.map((d) => d.embedding);
}

// Generates the final answer, grounded in the retrieved context chunks.
async function answerQuestion(question, contextChunks) {
  const context = contextChunks.length
    ? contextChunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n\n')
    : 'No matching college documents were found for this question.';

  const systemPrompt = `You are MEC Assistant, the official AI helper for Mahendra Engineering College (MEC).
Answer the student's question using ONLY the context below, which comes from the college's own uploaded documents (handbooks, syllabi, exam schedules, etc).
- If the context contains the answer, answer clearly and concisely, in a friendly and helpful tone.
- If the context does NOT contain enough information to answer, say so honestly and suggest the student contact the college office — do NOT make anything up.
- Do not mention "context" or "documents" explicitly to the student; just answer naturally as MEC Assistant.

Context from college documents:
${context}`;

  const res = await fetch(`${OPENAI_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: question },
      ],
      temperature: 0.3,
      max_tokens: 600,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`OpenAI chat error: ${res.status} ${errText}`);
  }

  const data = await res.json();
  return data.choices[0].message.content.trim();
}

// Splits long text into overlapping chunks suitable for embedding.
function chunkText(text, chunkSize = 1000, overlap = 150) {
  const clean = text.replace(/\s+/g, ' ').trim();
  const chunks = [];
  let start = 0;

  while (start < clean.length) {
    const end = Math.min(start + chunkSize, clean.length);
    chunks.push(clean.slice(start, end));
    if (end === clean.length) break;
    start = end - overlap;
  }

  return chunks.filter((c) => c.trim().length > 30);
}

module.exports = { embedText, embedBatch, answerQuestion, chunkText };
