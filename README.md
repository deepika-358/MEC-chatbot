<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>MEC Assistant</title>
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
<style>
  :root{
    --navy:#15224a;
    --navy-light:#22356e;
    --bg:#f4f6fb;
    --card:#ffffff;
    --border:#e3e7f0;
    --muted:#6b7280;
    --accent:#3a56d6;
    --accent-soft:#eef1fd;
    --danger:#d6453a;
    --radius:16px;
  }
  *{box-sizing:border-box;}
  body{
    margin:0;
    background:var(--bg);
    font-family:'Segoe UI', Inter, system-ui, -apple-system, sans-serif;
    color:#1c2236;
    -webkit-font-smoothing:antialiased;
  }
  #app{
    max-width:720px;
    margin:0 auto;
    min-height:100vh;
    display:flex;
    flex-direction:column;
    background:var(--bg);
  }

  /* ---------- HEADER ---------- */
  .topbar{
    background:var(--navy);
    color:#fff;
    padding:14px 18px;
    display:flex;
    align-items:center;
    justify-content:space-between;
    position:sticky;
    top:0;
    z-index:10;
    box-shadow:0 2px 10px rgba(0,0,0,0.12);
  }
  .topbar-left{display:flex;align-items:center;gap:12px;}
  .logo{
    width:38px;height:38px;border-radius:10px;
    background:linear-gradient(145deg,#3a56d6,#1c2c66);
    display:flex;align-items:center;justify-content:center;
    font-family:Georgia, serif;font-weight:700;font-size:14px;
    flex-shrink:0;
  }
  .title-block h1{
    font-family:Georgia, 'Times New Roman', serif;
    font-size:17px;margin:0;line-height:1.2;font-weight:600;
  }
  .title-block p{
    margin:1px 0 0;font-size:11.5px;color:#aab3d6;
  }
  .topbar-actions{display:flex;gap:6px;}
  .icon-btn{
    background:rgba(255,255,255,0.08);
    border:none;color:#fff;
    width:34px;height:34px;border-radius:9px;
    display:flex;align-items:center;justify-content:center;
    cursor:pointer;transition:background .15s;
  }
  .icon-btn:hover{background:rgba(255,255,255,0.18);}
  .icon-btn svg{width:17px;height:17px;}

  /* ---------- VIEWS ---------- */
  .view{display:none;flex:1;}
  .view.active{display:flex;flex-direction:column;}

  /* ---------- CHAT ---------- */
  #view-chat{flex:1;overflow-y:auto;padding:0 16px;}
  .welcome{
    text-align:center;padding:36px 10px 20px;
  }
  .avatar-ring{
    width:54px;height:54px;border-radius:50%;margin:0 auto 18px;
    background:radial-gradient(circle at 30% 30%, #4d6bf0, #15224a);
    box-shadow:0 0 0 6px var(--accent-soft);
  }
  .welcome h2{
    font-family:Georgia, serif;font-size:22px;color:var(--navy);margin:0 0 8px;
  }
  .welcome p{
    color:var(--muted);font-size:14.5px;max-width:420px;margin:0 auto 22px;line-height:1.5;
  }
  .quick-grid{
    display:grid;grid-template-columns:1fr 1fr;gap:10px;text-align:left;
  }
  .quick-card{
    background:var(--card);border:1px solid var(--border);border-radius:14px;
    padding:14px;font-size:13.5px;text-align:left;cursor:pointer;
    display:flex;gap:10px;align-items:flex-start;
    color:#33395a;transition:transform .12s, box-shadow .12s;
  }
  .quick-card:hover{transform:translateY(-1px);box-shadow:0 4px 14px rgba(21,34,74,0.08);}
  .quick-card .emoji{font-size:18px;flex-shrink:0;}

  .messages{padding:14px 0 18px;display:flex;flex-direction:column;gap:14px;}
  .msg{max-width:84%;padding:11px 14px;border-radius:14px;font-size:14.5px;line-height:1.5;white-space:pre-wrap;}
  .msg.user{align-self:flex-end;background:var(--navy);color:#fff;border-bottom-right-radius:4px;}
  .msg.bot{align-self:flex-start;background:var(--card);border:1px solid var(--border);border-bottom-left-radius:4px;}
  .msg.typing{align-self:flex-start;background:var(--card);border:1px solid var(--border);color:var(--muted);font-style:italic;}

  .chat-input-bar{
    display:none;gap:10px;padding:12px 16px;background:var(--bg);
    position:sticky;bottom:0;border-top:1px solid var(--border);
  }
  .chat-input-bar.active{display:flex;}
  .chat-input-bar input{
    flex:1;border:1px solid var(--border);border-radius:24px;
    padding:12px 18px;font-size:14.5px;outline:none;background:#fff;
  }
  .chat-input-bar input:focus{border-color:var(--accent);}
  .send-btn{
    width:44px;height:44px;border-radius:50%;border:none;
    background:var(--navy);color:#fff;font-size:16px;cursor:pointer;flex-shrink:0;
  }
  .footnote{display:none;text-align:center;font-size:11px;color:var(--muted);padding:0 0 10px;}
  .footnote.active{display:block;}

  /* ---------- PANELS (settings / admin) ---------- */
  #view-settings, #view-admin-login, #view-admin-dashboard, #view-admin-history, #view-admin-upload{
    padding:18px 16px;overflow-y:auto;
  }
  .panel{background:var(--card);border:1px solid var(--border);border-radius:var(--radius);padding:20px;}
  .panel.narrow{max-width:380px;margin:0 auto;}
  .panel h3{font-family:Georgia, serif;margin:0 0 4px;color:var(--navy);font-size:19px;}
  .panel h4{margin:22px 0 10px;font-size:14px;color:var(--navy);}
  .muted{color:var(--muted);font-size:13.5px;margin:0 0 16px;}

  .settings-row{
    display:flex;align-items:center;justify-content:space-between;
    padding:14px 4px;border-bottom:1px solid var(--border);cursor:pointer;font-size:14.5px;
  }
  .settings-row:last-of-type{border-bottom:none;}
  .settings-row:hover{color:var(--accent);}
  .chev{color:var(--muted);}

  label{display:block;font-size:12.5px;color:var(--navy);font-weight:600;margin:14px 0 6px;}
  input[type=email], input[type=password], input[type=text], textarea, input[type=file]{
    width:100%;border:1px solid var(--border);border-radius:10px;padding:11px 13px;
    font-size:14px;font-family:inherit;outline:none;background:#fbfcfe;
  }
  input:focus, textarea:focus{border-color:var(--accent);}
  textarea{resize:vertical;}

  .primary-btn{
    margin-top:18px;width:100%;background:var(--navy);color:#fff;border:none;
    padding:13px;border-radius:10px;font-size:14.5px;font-weight:600;cursor:pointer;
  }
  .primary-btn:hover{background:var(--navy-light);}
  .secondary-btn{
    margin-top:18px;width:100%;background:transparent;color:var(--danger);
    border:1px solid var(--border);padding:12px;border-radius:10px;font-size:14px;cursor:pointer;
  }
  .error-text{color:var(--danger);font-size:13px;margin-top:10px;min-height:14px;}

  #historySearch{margin-bottom:14px;}
  .history-list{display:flex;flex-direction:column;gap:10px;}
  .history-item{
    border:1px solid var(--border);border-radius:12px;padding:12px;background:#fbfcfe;
  }
  .history-item .q{font-weight:600;font-size:13.5px;color:var(--navy);}
  .history-item .a{font-size:13px;color:#444;margin-top:4px;}
  .history-item .meta{font-size:11px;color:var(--muted);margin-top:6px;}
  .del-btn{
    margin-top:8px;background:none;border:1px solid var(--border);color:var(--danger);
    font-size:12px;padding:5px 10px;border-radius:7px;cursor:pointer;
  }
  .del-btn:hover{background:#fdecea;}
  .empty-state{color:var(--muted);font-size:13.5px;text-align:center;padding:24px 0;}

  @media (max-width:420px){
    .quick-grid{grid-template-columns:1fr;}
    .title-block h1{font-size:15.5px;}
  }
</style>
</head>
<body>
<div id="app">

  <header class="topbar">
    <div class="topbar-left">
      <button id="backBtn" class="icon-btn" style="display:none" aria-label="Back">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </button>
      <div class="logo">MEC</div>
      <div class="title-block">
        <h1 id="viewTitle">MEC Assistant</h1>
        <p id="viewSubtitle">Mahendra Engineering College</p>
      </div>
    </div>
    <div class="topbar-actions">
      <button id="newChatBtn" class="icon-btn" aria-label="New chat" title="New chat">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 3v6h-6"/></svg>
      </button>
      <button id="settingsBtn" class="icon-btn" aria-label="Settings" title="Settings">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
      </button>
    </div>
  </header>

  <!-- CHAT VIEW -->
  <main id="view-chat" class="view active">
    <div id="welcomeScreen" class="welcome">
      <div class="avatar-ring"></div>
      <h2>Welcome to MEC Assistant</h2>
      <p>Ask me anything about Mahendra Engineering College. I can help with syllabi, schedules, campus events, and general inquiries.</p>
      <div class="quick-grid">
        <button class="quick-card" data-q="What are the upcoming exam schedules?"><span class="emoji">📅</span><span>What are the upcoming exam schedules?</span></button>
        <button class="quick-card" data-q="What subjects are in the CSE syllabus?"><span class="emoji">📗</span><span>What subjects are in the CSE syllabus?</span></button>
        <button class="quick-card" data-q="What campus facilities are available?"><span class="emoji">🏛️</span><span>What campus facilities are available?</span></button>
        <button class="quick-card" data-q="What are the college rules and regulations?"><span class="emoji">📋</span><span>What are the college rules and regulations?</span></button>
      </div>
    </div>
    <div id="messages" class="messages"></div>
  </main>
  <form id="chatForm" class="chat-input-bar active">
    <input id="chatInput" type="text" placeholder="Ask about college events, syllabus..." autocomplete="off" />
    <button type="submit" class="send-btn" aria-label="Send">➤</button>
  </form>
  <p id="footnote" class="footnote active">MEC Assistant can make mistakes. Verify important information.</p>

  <!-- SETTINGS -->
  <section id="view-settings" class="view">
    <div class="panel">
      <h3>Settings</h3>
      <p class="muted">Manage your assistant</p>
      <div class="settings-row" id="goAdminLogin"><span>🔐&nbsp; Admin Panel</span><span class="chev">›</span></div>
      <div class="settings-row" id="clearChatRow"><span>🗑️&nbsp; Clear conversation</span><span class="chev">›</span></div>
    </div>
  </section>

  <!-- ADMIN LOGIN -->
  <section id="view-admin-login" class="view">
    <div class="panel narrow">
      <h3>Admin Login</h3>
      <p class="muted">Sign in with your college admin account.</p>
      <form id="adminLoginForm">
        <label>Email</label>
        <input type="email" id="adminEmail" required />
        <label>Password</label>
        <input type="password" id="adminPassword" required />
        <button type="submit" class="primary-btn">Log In</button>
        <p id="adminLoginError" class="error-text"></p>
      </form>
    </div>
  </section>

  <!-- ADMIN DASHBOARD -->
  <section id="view-admin-dashboard" class="view">
    <div class="panel">
      <h3>Admin Dashboard</h3>
      <p class="muted" id="adminWelcome">Signed in</p>
      <div class="settings-row" id="goHistory"><span>📊&nbsp; Chat History</span><span class="chev">›</span></div>
      <div class="settings-row" id="goUpload"><span>⬆️&nbsp; Upload Document</span><span class="chev">›</span></div>
      <button id="logoutBtn" class="secondary-btn">Log Out</button>
    </div>
  </section>

  <!-- ADMIN HISTORY -->
  <section id="view-admin-history" class="view">
    <div class="panel">
      <h3>Chat History</h3>
      <p class="muted">Search by student name or question</p>
      <input type="text" id="historySearch" placeholder="e.g. Kavin, exam schedule..." />
      <div id="historyList" class="history-list"></div>
    </div>
  </section>

  <!-- ADMIN UPLOAD -->
  <section id="view-admin-upload" class="view">
    <div class="panel">
      <h3>Upload Document</h3>
      <p class="muted">PDF, text file, or image. The content will be indexed for AI search.</p>
      <form id="uploadForm">
        <label>Title <span style="font-weight:400;color:var(--muted)">(used as filename only if pasting text below)</span></label>
        <input type="text" id="uploadTitle" placeholder="e.g. CSE Syllabus 2026" />
        <label>Category</label>
        <select id="uploadCategory">
          <option value="general">General</option>
          <option value="syllabus">Syllabus</option>
          <option value="exam">Exam Schedule</option>
          <option value="handbook">Handbook / Rules</option>
          <option value="event">Campus Event</option>
        </select>
        <label>File (PDF / Word / image / .txt)</label>
        <input type="file" id="uploadFile" accept=".pdf,.docx,.txt,image/*" />
        <label>Or paste text directly</label>
        <textarea id="uploadText" rows="4" placeholder="Paste handbook text, syllabus content, etc."></textarea>
        <button type="submit" class="primary-btn">Upload &amp; Index</button>
        <p id="uploadStatus" class="muted"></p>
      </form>
      <h4>Uploaded Documents</h4>
      <div id="documentsList" class="history-list"></div>
    </div>
  </section>

</div>

<script>
  // =========================================================
  // CONFIG — fetched from /api/config (which reads env vars on the
  // server). This means YOU NEVER NEED TO EDIT THIS HTML FILE —
  // just set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel's
  // Environment Variables. Both values are safe to expose; real
  // data access is protected by the service-role key on the server.
  // =========================================================
  let sb = null;

  async function initSupabase() {
    const res = await fetch('/api/config');
    const { supabaseUrl, supabaseAnonKey } = await res.json();
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY environment variables on the server.');
      return;
    }
    sb = window.supabase.createClient(supabaseUrl, supabaseAnonKey);
  }

  // session id for this browser, used to group a student's chat history
  let sessionId = localStorage.getItem('mec_session_id');
  if (!sessionId) {
    sessionId = (crypto.randomUUID ? crypto.randomUUID() : 'sess-' + Date.now());
    localStorage.setItem('mec_session_id', sessionId);
  }

  // =========================================================
  // VIEW NAVIGATION (with back button + mobile-friendly stack)
  // =========================================================
  const viewMeta = {
    chat:               { title: 'MEC Assistant', subtitle: 'Mahendra Engineering College' },
    settings:           { title: 'Settings',       subtitle: '' },
    'admin-login':      { title: 'Admin Login',    subtitle: 'Authorized staff only' },
    'admin-dashboard':  { title: 'Admin Dashboard',subtitle: '' },
    'admin-history':    { title: 'Chat History',   subtitle: '' },
    'admin-upload':     { title: 'Upload Document',subtitle: '' },
  };
  let viewStack = ['chat'];

  function renderView(name) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + name).classList.add('active');

    document.getElementById('chatForm').classList.toggle('active', name === 'chat');
    document.getElementById('footnote').classList.toggle('active', name === 'chat');

    const meta = viewMeta[name];
    document.getElementById('viewTitle').textContent = meta.title;
    document.getElementById('viewSubtitle').textContent = meta.subtitle;
    document.getElementById('viewSubtitle').style.display = meta.subtitle ? 'block' : 'none';

    document.getElementById('backBtn').style.display = viewStack.length > 1 ? 'flex' : 'none';
    document.getElementById('newChatBtn').style.display = name === 'chat' ? 'flex' : 'none';
    document.getElementById('settingsBtn').style.display = name === 'chat' ? 'flex' : 'none';
  }

  function goView(name) {
    viewStack.push(name);
    renderView(name);
    if (name === 'admin-history') loadHistory();
    if (name === 'admin-upload') loadDocuments();
  }

  function goBack() {
    if (viewStack.length > 1) viewStack.pop();
    renderView(viewStack[viewStack.length - 1]);
  }

  document.getElementById('backBtn').onclick = goBack;
  document.getElementById('settingsBtn').onclick = () => goView('settings');
  document.getElementById('newChatBtn').onclick = () => {
    document.getElementById('messages').innerHTML = '';
    document.getElementById('welcomeScreen').style.display = 'block';
  };
  document.getElementById('goAdminLogin').onclick = async () => {
    if (!sb) { alert('Still loading, please try again in a second.'); return; }
    const { data } = await sb.auth.getSession();
    if (data.session) {
      document.getElementById('adminWelcome').textContent = 'Signed in as ' + data.session.user.email;
      goView('admin-dashboard');
    } else {
      goView('admin-login');
    }
  };
  document.getElementById('clearChatRow').onclick = () => {
    document.getElementById('messages').innerHTML = '';
    document.getElementById('welcomeScreen').style.display = 'block';
    goBack();
  };
  document.getElementById('goHistory').onclick = () => goView('admin-history');
  document.getElementById('goUpload').onclick = () => goView('admin-upload');

  // =========================================================
  // CHAT
  // =========================================================
  const messagesEl = document.getElementById('messages');
  const welcomeEl = document.getElementById('welcomeScreen');

  function addMessage(text, who) {
    const div = document.createElement('div');
    div.className = 'msg ' + who;
    div.textContent = text;
    messagesEl.appendChild(div);
    div.scrollIntoView({ behavior: 'smooth', block: 'end' });
    return div;
  }

  async function sendMessage(text) {
    welcomeEl.style.display = 'none';
    addMessage(text, 'user');
    const typing = addMessage('MEC Assistant is typing…', 'typing');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: text, sessionId }),
      });
      const data = await res.json();
      typing.remove();
      addMessage(data.answer || data.error || 'Sorry, something went wrong.', 'bot');
    } catch (err) {
      typing.remove();
      addMessage('Network error. Please check your connection and try again.', 'bot');
    }
  }

  document.getElementById('chatForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendMessage(text);
  });

  document.querySelectorAll('.quick-card').forEach(btn => {
    btn.addEventListener('click', () => sendMessage(btn.dataset.q));
  });

  // =========================================================
  // ADMIN LOGIN
  // =========================================================
  document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('adminEmail').value.trim();
    const password = document.getElementById('adminPassword').value;
    const errorEl = document.getElementById('adminLoginError');
    errorEl.textContent = '';

    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      errorEl.textContent = error.message;
      return;
    }
    document.getElementById('adminWelcome').textContent = 'Signed in as ' + data.user.email;
    goView('admin-dashboard');
  });

  document.getElementById('logoutBtn').onclick = async () => {
    await sb.auth.signOut();
    viewStack = ['chat'];
    renderView('chat');
  };

  async function getAuthHeader() {
    const { data } = await sb.auth.getSession();
    if (!data.session) return null;
    return { Authorization: 'Bearer ' + data.session.access_token };
  }

  // =========================================================
  // ADMIN — CHAT HISTORY
  // =========================================================
  async function loadHistory(search = '') {
    const listEl = document.getElementById('historyList');
    listEl.innerHTML = '<p class="empty-state">Loading…</p>';
    const authHeader = await getAuthHeader();
    if (!authHeader) { listEl.innerHTML = '<p class="empty-state">Please log in again.</p>'; return; }

    try {
      const res = await fetch('/api/history?search=' + encodeURIComponent(search), { headers: authHeader });
      const data = await res.json();
      if (!data.history || data.history.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No conversations found.</p>';
        return;
      }
      listEl.innerHTML = data.history.map(h => `
        <div class="history-item">
          <div class="q">${escapeHtml(h.student_name || 'Student')}: ${escapeHtml(h.question)}</div>
          <div class="a">${escapeHtml(h.answer)}</div>
          <div class="meta">${new Date(h.created_at).toLocaleString()}</div>
        </div>
      `).join('');
    } catch (err) {
      listEl.innerHTML = '<p class="empty-state">Could not load history.</p>';
    }
  }

  let historyDebounce;
  document.getElementById('historySearch').addEventListener('input', (e) => {
    clearTimeout(historyDebounce);
    historyDebounce = setTimeout(() => loadHistory(e.target.value.trim()), 350);
  });

  // =========================================================
  // ADMIN — DOCUMENT UPLOAD
  // =========================================================

  document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const statusEl = document.getElementById('uploadStatus');
    const title = document.getElementById('uploadTitle').value.trim();
    const category = document.getElementById('uploadCategory').value;
    const file = document.getElementById('uploadFile').files[0];
    const plainText = document.getElementById('uploadText').value.trim();

    if (!file && !plainText) {
      statusEl.textContent = 'Choose a file or paste some text first.';
      return;
    }

    const authHeader = await getAuthHeader();
    if (!authHeader) { statusEl.textContent = 'Please log in again.'; return; }

    statusEl.textContent = 'Uploading…';
    try {
      const formData = new FormData();
      formData.append('category', category);

      if (file) {
        formData.append('file', file);
      } else {
        // Turn pasted text into a small .txt file so the backend can
        // process it through the exact same pipeline as a real upload.
        const safeTitle = (title || 'pasted-text').replace(/[^a-z0-9]+/gi, '-').toLowerCase();
        const blob = new Blob([plainText], { type: 'text/plain' });
        formData.append('file', blob, `${safeTitle}.txt`);
      }

      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: authHeader, // don't set Content-Type — the browser sets the multipart boundary
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');
      statusEl.textContent = data.message || 'Uploaded successfully.';
      document.getElementById('uploadForm').reset();
      loadDocuments();
    } catch (err) {
      statusEl.textContent = 'Error: ' + err.message;
    }
  });

  async function loadDocuments() {
    const listEl = document.getElementById('documentsList');
    listEl.innerHTML = '<p class="empty-state">Loading…</p>';
    const authHeader = await getAuthHeader();
    if (!authHeader) { listEl.innerHTML = '<p class="empty-state">Please log in again.</p>'; return; }

    try {
      const res = await fetch('/api/documents', { headers: authHeader });
      const data = await res.json();
      if (!data.documents || data.documents.length === 0) {
        listEl.innerHTML = '<p class="empty-state">No documents uploaded yet.</p>';
        return;
      }
      listEl.innerHTML = data.documents.map(d => `
        <div class="history-item">
          <div class="q">${escapeHtml(d.filename)}</div>
          <div class="meta">${escapeHtml(d.category || 'general')} · ${d.has_embeddings ? 'indexed for AI search' : 'stored only'} · ${new Date(d.created_at).toLocaleDateString()}</div>
          <button class="del-btn" data-id="${d.id}">Delete</button>
        </div>
      `).join('');
      listEl.querySelectorAll('.del-btn').forEach(btn => {
        btn.addEventListener('click', () => deleteDocument(btn.dataset.id));
      });
    } catch (err) {
      listEl.innerHTML = '<p class="empty-state">Could not load documents.</p>';
    }
  }

  async function deleteDocument(id) {
    if (!confirm('Delete this document and its AI index? This cannot be undone.')) return;
    const authHeader = await getAuthHeader();
    if (!authHeader) return;
    try {
      const res = await fetch('/api/documents?id=' + encodeURIComponent(id), {
        method: 'DELETE',
        headers: authHeader,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      loadDocuments();
    } catch (err) {
      alert('Error: ' + err.message);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
  }

  renderView('chat');
  initSupabase();
</script>
</body>
</html>
