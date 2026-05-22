import type { Bindings } from "../types";

export async function adminHandler(
  request: Request,
  env: Bindings
): Promise<Response> {
  const { verifySession, createSessionCookie, verifyPassword } = await import("../lib/github");
  const url = new URL(request.url);
  const callsign = env.CALLSIGN;

  if (url.pathname === "/admin/login" && request.method === "POST") {
    const body = (await request.json()) as { email: string; password: string };
    const ok = await verifyPassword(env, body.email || "", body.password || "");
    if (!ok) {
      return new Response(renderLogin(callsign, "邮箱或密码错误"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
        status: 401,
      });
    }
    const cookie = await createSessionCookie(env, body.email);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/admin",
        "Set-Cookie": `${cookie}; Path=/admin; HttpOnly; SameSite=Lax`,
      },
    });
  }

  const login = await verifySession(request, env);
  if (!login) {
    return new Response(renderLogin(callsign), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  return new Response(renderAdmin(callsign), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export async function logoutHandler(): Promise<Response> {
  return new Response(null, {
    status: 302,
    headers: { Location: "/admin", "Set-Cookie": "session=; Path=/admin; Max-Age=0" },
  });
}

function renderLogin(callsign: string, error?: string): string {
  const errHTML = error ? `<p style="color:var(--danger);font-size:0.82rem;margin-bottom:1rem;">${esc(error)}</p>` : "";
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>登录 · ${esc(callsign)} 管理</title>
  <style>
    :root {
      --bg:#ffffff; --card-bg:rgba(255,255,255,0.92); --card-border:rgba(0,0,0,0.07);
      --card-shadow:0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);
      --text:#1f2328; --text-heading:#0d1117; --muted:#656d76; --accent:#0969da;
      --accent-soft:rgba(9,105,218,0.14); --radius:12px; --glow:rgba(9,105,218,0.03);
      --input-bg:rgba(0,0,0,0.04); --input-border:rgba(0,0,0,0.1); --danger:#cf222e;
    }
    html[data-theme="dark"] {
      --bg:#0d1117; --card-bg:rgba(22,27,34,0.85); --card-border:rgba(255,255,255,0.06);
      --card-shadow:0 1px 3px rgba(0,0,0,0.3),0 8px 24px rgba(0,0,0,0.2);
      --text:#e6edf3; --text-heading:#f0f6fc; --muted:#8b949e; --accent:#58a6ff;
      --accent-soft:rgba(88,166,255,0.20); --glow:rgba(88,166,255,0.04);
      --input-bg:rgba(255,255,255,0.05); --input-border:rgba(255,255,255,0.1); --danger:#f85149;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    html { font-size:16px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
      background:var(--bg); color:var(--text); min-height:100vh;
      display:flex; align-items:center; justify-content:center;
      transition: background-color 0.4s, color 0.4s; position:relative;
    }
    body::before {
      content:''; position:fixed; inset:0; pointer-events:none;
      background: radial-gradient(ellipse at 50% 35%, var(--glow) 0%, transparent 70%);
      opacity:0.15; transition: background 0.4s;
    }
    .card {
      background:var(--card-bg); border:1px solid var(--card-border);
      border-radius:var(--radius); padding:2.5rem 2rem; box-shadow:var(--card-shadow);
      text-align:center; max-width:380px; width:100%; position:relative; z-index:1;
      backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
    }
    h1 { font-size:1.25rem; color:var(--text-heading); margin-bottom:0.5rem; }
    p { color:var(--muted); font-size:0.85rem; margin-bottom:1.5rem; }
    .field { margin-bottom:1rem; text-align:left; }
    .field label { display:block; font-size:0.75rem; color:var(--muted); margin-bottom:0.3rem; font-weight:500; }
    .field input {
      width:100%; height:2.5rem; padding:0 0.75rem; font-size:0.9rem; font-family:inherit;
      background:var(--input-bg); border:1px solid var(--input-border); border-radius:8px;
      color:var(--text); outline:none; transition: border-color 0.25s, box-shadow 0.25s;
    }
    .field input:focus { border-color:var(--accent); box-shadow:0 0 0 2px var(--accent-soft); }
    .btn {
      width:100%; height:2.5rem; font-size:0.9rem; font-weight:500; font-family:inherit;
      background:var(--accent); color:#fff; border:none; border-radius:8px; cursor:pointer;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity:0.88; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${esc(callsign)} 日志管理</h1>
    <p>管理员登录</p>
    ${errHTML}
    <form id="loginForm" onsubmit="login(event)">
      <div class="field"><label>邮箱</label><input type="email" id="email" required></div>
      <div class="field"><label>密码</label><input type="password" id="password" required></div>
      <button type="submit" class="btn">登录</button>
    </form>
  </div>
  <script>
    async function login(e) {
      e.preventDefault();
      var resp = await fetch('/admin/login', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({email:document.getElementById('email').value,password:document.getElementById('password').value})
      });
      if (resp.ok) { window.location.href='/admin'; }
      else { var t = await resp.text(); document.body.innerHTML = t; }
    }
    (function() {
      var saved = localStorage.getItem('theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
        document.documentElement.setAttribute('data-theme','dark');
      }
    })();
  </script>
</body>
</html>`;
}

function renderAdmin(callsign: string): string {
  return `<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${esc(callsign)} · 日志管理</title>
  <script>
    (function() {
      var saved = localStorage.getItem('theme');
      if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme:dark)').matches)) {
        document.documentElement.setAttribute('data-theme','dark');
      }
    })();
  </script>
  <style>
    :root {
      --bg:#ffffff; --card-bg:rgba(255,255,255,0.92); --card-border:rgba(0,0,0,0.07);
      --card-shadow:0 1px 3px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.06);
      --text:#1f2328; --text-heading:#0d1117; --muted:#656d76;
      --accent:#0969da; --accent-soft:rgba(9,105,218,0.14); --accent-border:rgba(9,105,218,0.28);
      --divider:rgba(0,0,0,0.06); --input-bg:rgba(0,0,0,0.04); --input-border:rgba(0,0,0,0.1);
      --btn-bg:rgba(0,0,0,0.04); --btn-bg-hover:rgba(0,0,0,0.08);
      --danger:#cf222e; --danger-soft:rgba(207,34,46,0.12); --success:#2da44e;
      --radius:12px; --glow:rgba(9,105,218,0.03);
    }
    html[data-theme="dark"] {
      --bg:#0d1117; --card-bg:rgba(22,27,34,0.85); --card-border:rgba(255,255,255,0.06);
      --card-shadow:0 1px 3px rgba(0,0,0,0.3),0 8px 24px rgba(0,0,0,0.2);
      --text:#e6edf3; --text-heading:#f0f6fc; --muted:#8b949e;
      --accent:#58a6ff; --accent-soft:rgba(88,166,255,0.20); --accent-border:rgba(88,166,255,0.32);
      --divider:rgba(255,255,255,0.06); --input-bg:rgba(255,255,255,0.05); --input-border:rgba(255,255,255,0.1);
      --btn-bg:rgba(255,255,255,0.06); --btn-bg-hover:rgba(255,255,255,0.1);
      --danger:#f85149; --danger-soft:rgba(248,81,73,0.18); --success:#3fb950;
      --glow:rgba(88,166,255,0.04);
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    html { scroll-behavior:smooth; font-size:16px; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Noto Sans SC', sans-serif;
      background:var(--bg); color:var(--text); min-height:100vh; line-height:1.6;
      -webkit-font-smoothing:antialiased;
      transition: background-color 0.4s, color 0.4s; position:relative;
    }
    body::before {
      content:''; position:fixed; inset:0; pointer-events:none;
      background: radial-gradient(ellipse at 50% 35%, var(--glow) 0%, transparent 70%);
      opacity:0.15; transition: background 0.4s;
    }
    a { color:var(--accent); text-decoration:none; }
    a:hover { text-decoration:underline; }
    .header {
      position:sticky; top:0; z-index:40;
      background:var(--card-bg); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
      border-bottom:1px solid var(--card-border);
      transition: background-color 0.4s, border-color 0.4s;
    }
    .header-inner {
      max-width:960px; margin:0 auto; padding:0 1.5rem;
      height:3.5rem; display:flex; align-items:center; justify-content:space-between;
    }
    .logo { font-size:1.05rem; font-weight:700; letter-spacing:0.1em; color:var(--text-heading); }
    .nav { display:flex; align-items:center; gap:1.2rem; }
    .nav a { color:var(--muted); font-size:0.85rem; font-weight:500; text-decoration:none; transition:color 0.2s; }
    .nav a.active, .nav a:hover { color:var(--accent); text-decoration:none; }
    .theme-btn {
      width:34px; height:34px; border-radius:50%;
      border:1px solid var(--card-border); background:var(--card-bg);
      cursor:pointer; display:flex; align-items:center; justify-content:center;
      color:var(--muted); outline:none; transition: background-color 0.4s, transform 0.2s, color 0.3s;
    }
    .theme-btn:hover { transform:scale(1.08); color:var(--accent); }
    .theme-btn svg { width:15px; height:15px; pointer-events:none; }
    html:not([data-theme="dark"]) .icon-sun,
    html[data-theme="dark"] .icon-moon { display:none; }
    .logout-btn {
      height:2rem; padding:0 0.8rem; font-size:0.78rem;
      background:var(--btn-bg); color:var(--text);
      border:1px solid var(--card-border); border-radius:8px; cursor:pointer;
      font-family:inherit; transition: background-color 0.25s;
    }
    .logout-btn:hover { background:var(--btn-bg-hover); }
    .main { max-width:960px; margin:0 auto; padding:1.75rem 1.5rem 4rem; position:relative; z-index:1; }
    .page-title { font-size:1.35rem; font-weight:700; color:var(--text-heading); }
    .page-subtitle { color:var(--muted); font-size:0.8rem; margin-top:0.15rem; margin-bottom:1.5rem; }
    .card {
      background:var(--card-bg); border:1px solid var(--card-border);
      border-radius:var(--radius); padding:1.25rem; margin-bottom:1rem;
      box-shadow:var(--card-shadow);
      backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);
      transition: background-color 0.4s, border-color 0.4s, box-shadow 0.4s;
    }
    .card-title {
      font-size:0.95rem; font-weight:600; color:var(--text-heading);
      margin-bottom:1rem; padding-bottom:0.6rem; border-bottom:1px solid var(--divider);
    }
    .form-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(160px,1fr)); gap:0.75rem; }
    .form-field { display:flex; flex-direction:column; gap:0.2rem; min-width:0; }
    .form-field label { font-size:0.72rem; color:var(--muted); font-weight:500; letter-spacing:0.04em; }
    .form-field input, .form-field select {
      height:2.35rem; padding:0 0.65rem; font-size:0.82rem; width:100%;
      background:var(--input-bg); border:1px solid var(--input-border); border-radius:8px;
      color:var(--text); font-family:inherit;
      transition: border-color 0.25s, box-shadow 0.25s; outline:none;
    }
    .btn { height:2.35rem; padding:0 1.1rem; font-size:0.82rem; font-weight:500; border:none; border-radius:8px; cursor:pointer; font-family:inherit; transition: background-color 0.25s, opacity 0.2s; display:inline-flex; align-items:center; gap:0.4rem; }
    .btn-primary { background:var(--accent); color:#fff; }
    .btn-primary:hover { opacity:0.88; }
    .btn-success { background:var(--success); color:#fff; }
    .btn-success:hover { opacity:0.88; }
    .btn-danger { background:var(--danger); color:#fff; }
    .btn-danger:hover { opacity:0.88; }
    .btn-sm { height:1.9rem; padding:0 0.65rem; font-size:0.75rem; }
    .upload-zone { border:2px dashed var(--input-border); border-radius:var(--radius); padding:2rem; text-align:center; cursor:pointer; transition: border-color 0.25s, background-color 0.25s; }
    .upload-zone:hover { border-color:var(--accent-border); background:var(--accent-soft); }
    .upload-zone p { color:var(--muted); font-size:0.85rem; }
    .upload-zone p strong { color:var(--accent); }
    .toast { position:fixed; bottom:1.5rem; right:1.5rem; z-index:999; padding:0.75rem 1.25rem; border-radius:8px; font-size:0.85rem; font-weight:500; box-shadow:var(--card-shadow); animation:toast-in 0.3s ease; }
    .toast-ok { background:rgba(45,164,78,0.14); color:var(--success); border:1px solid var(--success); }
    .toast-err { background:var(--danger-soft); color:var(--danger); border:1px solid var(--danger); }
    @keyframes toast-in { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    .table-wrap { overflow-x:auto; margin-top:0.75rem; }
    table { width:100%; border-collapse:collapse; font-size:0.8rem; }
    th { text-align:left; padding:0.5rem 0.6rem; font-size:0.68rem; font-weight:500; color:var(--muted); text-transform:uppercase; letter-spacing:0.05em; border-bottom:1px solid var(--divider); }
    td { padding:0.45rem 0.6rem; border-bottom:1px solid var(--divider); }
    tr:hover td { background:var(--btn-bg); }
    .callsign-cell { font-weight:600; color:var(--text-heading); }
    .checkbox { width:1rem; height:1rem; accent-color:var(--accent); cursor:pointer; }
    @media (max-width:640px) { .form-grid { grid-template-columns:repeat(2,1fr); } }
  </style>
</head>
<body>
  <header class="header">
    <div class="header-inner">
      <a href="/admin" class="logo">${esc(callsign)}</a>
      <nav class="nav">
        <a href="/">日志</a>
        <a href="/admin" class="active">管理</a>
        <button class="theme-btn" id="theme-btn" aria-label="切换主题">
          <svg class="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg class="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
        <button class="logout-btn" onclick="window.location.href='/admin/logout'">退出</button>
      </nav>
    </div>
  </header>
  <main class="main">
    <h1 class="page-title">日志管理</h1>
    <p class="page-subtitle">上传 ADIF · 手动添加 · 删除 · 设置</p>
    <div class="card">
      <div class="card-title">📤 上传 ADIF</div>
      <div class="upload-zone" id="uploadZone" onclick="document.getElementById('fileInput').click()">
        <p>拖拽 <strong>.adif</strong> 文件或<strong>点击选择</strong></p>
        <p style="font-size:0.72rem;margin-top:0.25rem;">自动去重 · 同 CALL+DATE+TIME+FREQ+MODE 不重复</p>
      </div>
      <input type="file" id="fileInput" accept=".adif,.adi" style="display:none" onchange="handleFile(this)">
      <div id="uploadResult" style="margin-top:0.75rem;font-size:0.82rem;color:var(--muted);display:none;"></div>
    </div>
    <div class="card">
      <div class="card-title">✏️ 手动添加 QSO</div>
      <div class="form-grid">
        <div class="form-field"><label>呼号 *</label><input type="text" id="addCall" style="text-transform:uppercase;"></div>
        <div class="form-field"><label>日期 *</label><input type="date" id="addDate" value="2026-05-21"></div>
        <div class="form-field"><label>UTC 时间 *</label><input type="time" id="addTime" value="12:00"></div>
        <div class="form-field"><label>频率 (MHz) *</label><input type="text" id="addFreq" placeholder="14.270"></div>
        <div class="form-field"><label>模式 *</label><select id="addMode"><option>SSB</option><option selected>FT8</option><option>CW</option><option>FT4</option></select></div>
        <div class="form-field"><label>RST 收</label><input type="text" id="addRstR" value="59"></div>
        <div class="form-field"><label>RST 发</label><input type="text" id="addRstS" value="59"></div>
        <div class="form-field"><label>对方 Grid</label><input type="text" id="addGrid"></div>
        <div class="form-field"><label>备注</label><input type="text" id="addNote"></div>
      </div>
      <button class="btn btn-primary" style="margin-top:1rem;" onclick="addQSO()">添加记录</button>
    </div>
    <div class="card">
      <div class="card-title">⚙️ 首页设置</div>
      <div class="form-grid">
        <div class="form-field"><label>最近活动</label><input type="text" id="lastAct" placeholder="WAPC 2026"></div>
      </div>
      <button class="btn btn-primary" style="margin-top:0.75rem;" onclick="saveLastAct()">保存</button>
    </div>
    <div class="card">
      <div class="card-title">🏆 最佳 DX</div>
      <p style="font-size:0.8rem;color:var(--muted);margin-bottom:0.75rem;">手动设置统计卡片显示的最佳 DX。</p>
      <div class="form-grid">
        <div class="form-field"><label>呼号 *</label><input type="text" id="bestCall" style="text-transform:uppercase;"></div>
        <div class="form-field"><label>描述</label><input type="text" id="bestDesc"></div>
        <div class="form-field"><label>距离(km) *</label><input type="number" id="bestDist"></div>
      </div>
      <button class="btn btn-success" style="margin-top:0.75rem;" onclick="saveBest()">保存</button>
    </div>
    <div class="card">
      <div class="card-title" style="display:flex;align-items:center;justify-content:space-between;">
        <span>📋 QSO 列表</span>
        <button class="btn btn-sm btn-danger" onclick="batchDelete()">批量删除</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr><th style="width:32px;"><input type="checkbox" class="checkbox" id="selectAll" onclick="toggleAll()"></th><th>呼号</th><th>日期</th><th>UTC</th><th>频率</th><th>模式</th><th>操作</th></tr>
          </thead>
          <tbody id="qsoTable"><tr><td colspan="7" style="text-align:center;color:var(--muted);">加载中…</td></tr></tbody>
        </table>
      </div>
    </div>
  </main>
  <script>
    function toast(m,e) {
      var t=document.createElement('div'); t.className='toast toast-'+(e?'err':'ok'); t.textContent=m;
      document.body.appendChild(t); setTimeout(function(){t.remove()},2500);
    }
    var uploadZone = document.getElementById('uploadZone');
    uploadZone.addEventListener('dragover',function(e){e.preventDefault();});
    uploadZone.addEventListener('drop',function(e){e.preventDefault();handleFile(e.dataTransfer.files[0]);});
    async function handleFile(f) {
      var file = f.files ? f.files[0] : f; if (!file) return;
      var text = await file.text();
      var resp = await fetch('/admin/api/upload', { method:'POST', body:text });
      var data = await resp.json();
      document.getElementById('uploadResult').style.display='block';
      document.getElementById('uploadResult').textContent = '新增 '+data.inserted+' 条 · 跳过 '+data.skipped+' 条重复';
      toast('上传完成 · 新增 '+data.inserted+' 条'); loadList();
    }
    async function addQSO() {
      var call = document.getElementById('addCall').value.trim().toUpperCase();
      var date = document.getElementById('addDate').value;
      var time = document.getElementById('addTime').value;
      var freq = document.getElementById('addFreq').value.trim();
      if (!call || !date || !time || !freq) { toast('呼号、日期、时间、频率为必填项', true); return; }
      var body = {
        call, date, time, freq,
        mode: document.getElementById('addMode').value,
        rst_rx: document.getElementById('addRstR').value.trim() || '59',
        rst_tx: document.getElementById('addRstS').value.trim() || '59',
        grid: document.getElementById('addGrid').value.trim(),
        note: document.getElementById('addNote').value.trim()
      };
      var resp = await fetch('/admin/api/add', { method:'POST', body:JSON.stringify(body) });
      var data = await resp.json();
      if (data.ok) { toast('已添加 '+call); loadList(); }
      else toast(data.error || '添加失败', true);
    }
    async function saveLastAct() {
      var text = document.getElementById('lastAct').value.trim();
      var resp = await fetch('/admin/api/lastact', { method:'POST', body:JSON.stringify({text:text}) });
      var data = await resp.json();
      toast(data.ok ? '已保存' : (data.error||'保存失败'), !data.ok);
    }
    async function saveBest() {
      var call = document.getElementById('bestCall').value.trim().toUpperCase();
      var dist = parseInt(document.getElementById('bestDist').value);
      if (!call || !dist) { toast('呼号和距离必填', true); return; }
      var body = { call:call, description:document.getElementById('bestDesc').value.trim(), distance_km:dist };
      var resp = await fetch('/admin/api/bestdx', { method:'POST', body:JSON.stringify(body) });
      var data = await resp.json();
      toast(data.ok ? '最佳 DX 已更新' : (data.error||'保存失败'), !data.ok);
    }
    async function deleteOne(id) {
      if (!confirm('删除此条 QSO？不可撤销。')) return;
      await fetch('/admin/api/delete', { method:'POST', body:JSON.stringify({ids:[id]}) });
      toast('已删除'); loadList();
    }
    async function batchDelete() {
      var checks = document.querySelectorAll('.select-row:checked');
      if (!checks.length) { toast('请勾选记录', true); return; }
      if (!confirm('删除选中的 '+checks.length+' 条？不可撤销。')) return;
      var ids = Array.from(checks).map(function(c){ return parseInt(c.value); });
      await fetch('/admin/api/delete', { method:'POST', body:JSON.stringify({ids:ids}) });
      toast('已批量删除 '+ids.length+' 条'); loadList();
    }
    function toggleAll() {
      var checked = document.getElementById('selectAll').checked;
      document.querySelectorAll('.select-row').forEach(function(c){ c.checked = checked; });
    }
    async function loadList() {
      var resp = await fetch('/admin/api/list');
      var data = await resp.json();
      document.getElementById('qsoTable').innerHTML = data.qsos.map(function(q){
        return '<tr><td><input type="checkbox" class="checkbox select-row" value="'+q.id+'"></td>'+
               '<td class="callsign-cell">'+esc(q.call)+'</td>'+
               '<td>'+esc(q.date)+'</td><td>'+esc(q.time)+'</td><td>'+esc(q.freq)+'</td><td>'+esc(q.mode)+'</td>'+
               '<td><button class="btn btn-sm btn-danger" onclick="deleteOne('+q.id+')">删除</button></td></tr>';
      }).join('');
    }
    function esc(s){ return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

    (function() {
      var html=document.documentElement, btn=document.getElementById('theme-btn');
      if(!btn) return;
      function set(d){ if(d){html.setAttribute('data-theme','dark');localStorage.setItem('theme','dark');}else{html.removeAttribute('data-theme');localStorage.setItem('theme','light');} }
      btn.addEventListener('click',function(e){
        var r=btn.getBoundingClientRect();
        html.style.setProperty('--vt-x',(r.left+r.width/2)+'px');
        html.style.setProperty('--vt-y',(r.top+r.height/2)+'px');
        var isDark=html.getAttribute('data-theme')==='dark';
        if(document.startViewTransition){document.startViewTransition(function(){set(!isDark);});}else{set(!isDark);}
      });
    })();

    loadList();
  </script>
</body>
</html>`;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}ing {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
