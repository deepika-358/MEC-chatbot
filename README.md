# MEC Assistant — RAG College Chatbot

AI assistant for Mahendra Engineering College. Students ask about syllabi, exam
schedules, campus facilities, and rules. Answers come from real college
documents using **vector similarity search (pgvector) + OpenAI**, not basic
keyword matching.

## What's inside

```
mec-assistant/
├── index.html              ← the entire frontend (chat + settings + admin panel)
├── api/
│   ├── config.js            → gives the frontend its public Supabase keys
│   ├── chat.js               → RAG: embed question → vector search → OpenAI answer
│   ├── upload.js             → admin-only: upload + chunk + embed a document
│   ├── documents.js          → admin-only: list / delete documents
│   └── history.js            → admin-only: search chat history
├── lib/
│   ├── supabaseAdmin.js      → server-side Supabase client (service role key)
│   ├── auth.js                → checks the admin is really logged in
│   └── openai.js              → embeddings + chat completion + text chunking
├── sql/schema.sql            → run this once in Supabase to create your database
├── package.json
├── vercel.json
└── .env.example
```

Everything that touches your **OpenAI key** or your **Supabase service role
key** runs inside `/api` on Vercel's server — never in the browser. Those two
keys must stay secret. The frontend only ever uses the public Supabase anon
key, which is safe to expose.

---

## STEP 1 — Create your Supabase project

1. Go to https://supabase.com → **New Project**.
2. Pick a name (e.g. `mec-assistant`), a strong database password, and a region close to your users (e.g. Mumbai/Singapore). Save the password somewhere safe.
3. Wait ~2 minutes for it to finish provisioning.

### Enable pgvector
1. In the left sidebar, go to **Database → Extensions**.
2. Search for `vector` and toggle it **ON**.

### Run the schema
1. Go to **SQL Editor → New query**.
2. Open `sql/schema.sql` from this project, copy the whole file, paste it in, and click **Run**.
3. This creates the `documents`, `document_chunks`, and `chat_history` tables, the vector search function, and locks everything down with Row Level Security.

### Create a Storage bucket
1. Go to **Storage → New bucket**.
2. Name it exactly `documents`.
3. Keep it **Private** (do not make it public).

### Create your admin login
1. Go to **Authentication → Users → Add user**.
2. Enter your email and a password. Tick "Auto Confirm User".
3. This is the email + password you'll use to log into the Admin Panel inside the app. There is no public sign-up — only logins you create here can become admin.

### Get your API keys
1. Go to **Project Settings → API**.
2. Copy these three values — you'll need them in Step 3:
   - **Project URL** → `SUPABASE_URL`
   - **anon public key** → `SUPABASE_ANON_KEY`
   - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" — keep this one secret, never share it)

---

## STEP 2 — Get your OpenAI API key

1. Go to https://platform.openai.com/api-keys
2. Create a new secret key, copy it. This is your `OPENAI_API_KEY`.
3. Add a small amount of billing credit (this app uses cheap models — `gpt-4o-mini` and `text-embedding-3-small` — so costs stay low even for many students chatting).

---

## STEP 3 — Push this project to GitHub

```bash
cd mec-assistant
git init
git add .
git commit -m "Initial commit - MEC Assistant"
```

Create a new **empty** repository on https://github.com/new (don't add a README there), then:

```bash
git remote add origin https://github.com/YOUR-USERNAME/mec-assistant.git
git branch -M main
git push -u origin main
```

Your `.env` file (if you ever create one locally) is already excluded by
`.gitignore` — it will never be uploaded.

---

## STEP 4 — Deploy to Vercel

1. Go to https://vercel.com/new and import the GitHub repo you just pushed.
2. Before clicking Deploy, open **Environment Variables** and add all four:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | from Step 1 |
   | `SUPABASE_ANON_KEY` | from Step 1 |
   | `SUPABASE_SERVICE_ROLE_KEY` | from Step 1 |
   | `OPENAI_API_KEY` | from Step 2 |

3. Click **Deploy**. Vercel will install `package.json` dependencies and deploy `index.html` + everything in `/api` automatically — no build step needed.
4. Once deployed, open the live URL. The chat should load, and going to **Settings → Admin Panel** should let you log in with the email/password you created in Step 1.

If you ever change an environment variable later, go to **Project → Settings → Environment Variables**, update it, then **Redeploy**.

---

## STEP 5 — Upload your first college document

1. Open your deployed site → Settings (⚙ icon) → Admin Panel → log in.
2. Tap **Upload Document**.
3. Either choose a PDF / Word (.docx) / image / .txt file, or paste text directly (e.g. paste your exam timetable text).
4. Pick a category and tap **Upload & Index**.
5. Go back to the main chat and ask a related question — the answer should now come from that document.

> Images are stored for record-keeping but their visual content isn't read automatically (no OCR yet). If you want an image's information searchable, paste a short text caption describing it in the "paste text" box as a separate upload.

---

## How the RAG pipeline works

1. A student asks a question in the chat.
2. `/api/chat` turns that question into a 1536-number embedding vector using OpenAI.
3. Supabase (pgvector) finds the document chunks whose embeddings are closest in meaning — not just matching keywords.
4. Those chunks are handed to `gpt-4o-mini` as context, which writes the final answer.
5. The question + answer are saved to `chat_history`, searchable later in the Admin Panel.

## Admin features

- **Chat History** — search every question a student has asked, by name or by keyword.
- **Document Upload** — add PDFs, Word docs, images, or pasted text; each is automatically split into chunks and embedded for search. Documents can also be deleted.
- **Secure login** — real Supabase Auth (email + password), not a hardcoded password. Only accounts you create in the Supabase dashboard can log in.

## Mobile + navigation

The whole app is one responsive page. Every screen other than the main chat
(Settings, Admin Login, Dashboard, History, Upload) shows a **back arrow**
in the header. On phones, the layout automatically narrows to a single
column.

## Costs (approximate, OpenAI)

- Asking a question: ~$0.0002 (embedding) + ~$0.001–0.003 (answer) per question.
- Uploading a 10-page document: a few cents to embed all its chunks.
- Supabase free tier covers database + storage + auth for a project this size comfortably.

## If something doesn't work

- **Chat says "Something went wrong"** → check the OpenAI key and billing in Vercel's environment variables.
- **Admin login fails** → confirm the user exists in Supabase Authentication → Users, and that "Auto Confirm User" was ticked.
- **Upload fails** → make sure you created the `documents` Storage bucket (exact name) and ran the full `sql/schema.sql`.
- **Vector search returns nothing** → make sure the `vector` extension is enabled and you've uploaded at least one document.
