// backend/server.js
// Node.js + Express backend proxy for Email Spam Classifier
// Keeps your Anthropic API key secure (never exposed to browser)

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());
app.use(
  cors({
    origin: process.env.ALLOWED_ORIGIN || "*", // restrict in production
  })
);

// ===== Serve frontend (optional) =====
// Uncomment to serve the frontend from backend:
// const path = require("path");
// app.use(express.static(path.join(__dirname, "../frontend")));

// ===== Health check =====
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ===== Classify endpoint =====
app.post("/api/classify", async (req, res) => {
  const { subject, sender, body } = req.body;

  if (!subject && !body) {
    return res.status(400).json({ error: "subject ya body required hai" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured" });
  }

  const prompt = buildPrompt(subject, sender, body);

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1000,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Claude API error:", errData);
      return res
        .status(502)
        .json({ error: "Claude API error", details: errData?.error?.message });
    }

    const data = await response.json();
    const text = data.content.map((i) => i.text || "").join("");
    const clean = text.replace(/```json|```/g, "").trim();

    let result;
    try {
      result = JSON.parse(clean);
    } catch {
      console.error("JSON parse failed:", clean);
      return res.status(502).json({ error: "Claude se invalid response mila" });
    }

    return res.json(result);
  } catch (err) {
    console.error("Server error:", err);
    return res.status(500).json({ error: "Internal server error" });
  }
});

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

// ===== Start server =====
app.listen(PORT, () => {
  console.log(`\n🚀 Email Spam Classifier backend running!`);
  console.log(`   Local:   http://localhost:${PORT}`);
  console.log(`   Health:  http://localhost:${PORT}/health`);
  console.log(`   API:     POST http://localhost:${PORT}/api/classify\n`);
});
