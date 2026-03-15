// ===== State =====
let history = [];
let stats = { total: 0, spam: 0, legit: 0 };

// ===== Config =====
// Option 1: Direct Claude API (add your key in .env or here for local dev)
// Option 2: Use backend/server.js proxy (recommended for production)
const USE_BACKEND = true; // set false to call Claude API directly from browser
const BACKEND_URL = "http://localhost:3000/api/classify";
const CLAUDE_API_URL = "https://api.anthropic.com/v1/messages";
const CLAUDE_MODEL = "claude-sonnet-4-20250514";
// WARNING: Never expose your API key in frontend code for production!
const CLAUDE_API_KEY = ""; // only for local testing

// ===== Main analyze function =====
async function analyzeEmail() {
  const subject = document.getElementById("subject").value.trim();
  const sender = document.getElementById("sender").value.trim();
  const body = document.getElementById("body").value.trim();

  if (!body && !subject) {
    document.getElementById("body").focus();
    showError("Kuch toh likhein — subject ya body zaroor chahiye.");
    return;
  }

  const btn = document.getElementById("analyze-btn");
  btn.disabled = true;
  btn.innerHTML = '<div class="spinner"></div> Analyzing...';
  hideError();

  try {
    let result;
    if (USE_BACKEND) {
      result = await callBackend({ subject, sender, body });
    } else {
      result = await callClaudeDirect({ subject, sender, body });
    }

    displayResult(result, subject || body.substring(0, 40) + "...");
    addToHistory(result, subject || body.substring(0, 35) + "...");
    updateStats(result.verdict);
  } catch (err) {
    console.error("Analysis error:", err);
    showError("Error: " + (err.message || "API se response nahi mila. Dobara try karein."));
  }

  btn.disabled = false;
  btn.innerHTML = `
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    Analyze Email`;
}

// ===== Call backend proxy =====
async function callBackend({ subject, sender, body }) {
  const response = await fetch(BACKEND_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ subject, sender, body }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error || `Server error: ${response.status}`);
  }

  return response.json();
}

// ===== Call Claude API directly (local dev only) =====
async function callClaudeDirect({ subject, sender, body }) {
  const prompt = buildPrompt(subject, sender, body);

  const response = await fetch(CLAUDE_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": CLAUDE_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Claude API error: ${response.status}`);
  }

  const data = await response.json();
  const text = data.content.map((i) => i.text || "").join("");
  return parseResponse(text);
}

// ===== Build prompt =====
function buildPrompt(subject, sender, body) {
  return `You are a precise email spam classifier. Analyze this email and respond ONLY with valid JSON (no markdown, no backticks, no extra text).

Email:
Subject: ${subject || "(none)"}
From: ${sender || "(unknown)"}
Body: ${body || "(empty)"}

Respond with this exact JSON structure:
{
  "verdict": "SPAM" or "LEGITIMATE",
  "spam_probability": <integer 0-100>,
  "legit_probability": <integer 0-100>,
  "risk_score": <number 0-10 with one decimal>,
  "signals": [
    {"type": "red|amber|green", "text": "<short signal, max 8 words>"},
    {"type": "red|amber|green", "text": "..."},
    {"type": "red|amber|green", "text": "..."},
    {"type": "red|amber|green", "text": "..."}
  ],
  "explanation": "<2-3 sentences explaining the classification in plain English>"
}`;
}

// ===== Parse Claude response =====
function parseResponse(text) {
  const clean = text.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

// ===== Display result =====
function displayResult(r, label) {
  const card = document.getElementById("result-card");
  card.style.display = "block";

  const isSpam = r.verdict === "SPAM";

  // Verdict badge
  const badge = document.getElementById("verdict-badge");
  badge.textContent = isSpam ? "Spam Detected" : "Legitimate Email";
  badge.className = "verdict-badge " + (isSpam ? "verdict-spam" : "verdict-legit");

  // Risk score
  const riskEl = document.getElementById("risk-score");
  riskEl.textContent = r.risk_score + "/10";
  riskEl.style.color =
    r.risk_score >= 7
      ? "var(--danger-text)"
      : r.risk_score >= 4
      ? "var(--warning-text)"
      : "var(--success-text)";

  // Probability bars
  const sp = Math.round(r.spam_probability);
  const lp = Math.round(r.legit_probability);
  document.getElementById("spam-bar").style.width = sp + "%";
  document.getElementById("legit-bar").style.width = lp + "%";
  document.getElementById("spam-pct").textContent = sp + "%";
  document.getElementById("legit-pct").textContent = lp + "%";

  // Signals
  const grid = document.getElementById("signals-grid");
  grid.innerHTML = "";
  (r.signals || []).forEach((s) => {
    const dotClass =
      s.type === "red" ? "dot-red" : s.type === "amber" ? "dot-amber" : "dot-green";
    const el = document.createElement("div");
    el.className = "signal-item";
    el.innerHTML = `<div class="signal-dot ${dotClass}"></div><span class="signal-text">${s.text}</span>`;
    grid.appendChild(el);
  });

  // Explanation
  document.getElementById("explanation").textContent = r.explanation || "";

  card.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ===== History =====
function addToHistory(r, label) {
  const isSpam = r.verdict === "SPAM";
  const now = new Date();
  const time =
    now.getHours().toString().padStart(2, "0") +
    ":" +
    now.getMinutes().toString().padStart(2, "0");
  history.unshift({ label, isSpam, time, risk: r.risk_score });
  if (history.length > 8) history.pop();
  renderHistory();
}

function renderHistory() {
  const list = document.getElementById("history-list");
  if (history.length === 0) {
    list.innerHTML = '<div class="empty-state">Abhi tak koi email analyze nahi hua</div>';
    return;
  }
  list.innerHTML = history
    .map(
      (h) => `
    <div class="history-item">
      <span class="hist-badge ${h.isSpam ? "verdict-spam" : "verdict-legit"}">${h.isSpam ? "Spam" : "Legit"}</span>
      <span class="hist-subject">${escapeHtml(h.label)}</span>
      <span class="hist-time">${h.time} · ${h.risk}/10</span>
    </div>`
    )
    .join("");
}

// ===== Stats =====
function updateStats(verdict) {
  stats.total++;
  if (verdict === "SPAM") stats.spam++;
  else stats.legit++;
  document.getElementById("total-count").textContent = stats.total;
  document.getElementById("spam-count").textContent = stats.spam;
  document.getElementById("legit-count").textContent = stats.legit;
}

// ===== Helpers =====
function showError(msg) {
  let el = document.getElementById("error-msg");
  if (!el) {
    el = document.createElement("div");
    el.id = "error-msg";
    el.style.cssText =
      "color:var(--danger-text);background:var(--danger-bg);padding:10px 14px;border-radius:8px;font-size:13px;margin-top:10px;";
    document.querySelector(".btn-analyze").after(el);
  }
  el.textContent = msg;
}

function hideError() {
  const el = document.getElementById("error-msg");
  if (el) el.remove();
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ===== Allow Enter key on inputs =====
document.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && e.ctrlKey) analyzeEmail();
});
