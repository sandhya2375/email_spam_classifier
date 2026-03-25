# 📧 Email Spam Classifier

Ye ek powered real-time email spam detection app hai. Subject, sender, aur email body ko analyze karke batata hai ki email spam hai ya legitimate.

![Email Spam Classifier](https://img.shields.io/badge/Powered%20by-Claude%20AI-orange?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)
![Node](https://img.shields.io/badge/node-%3E%3D18-green?style=flat-square)

---

## ✨ Features

- **Real-time classification** — Claude Sonnet 4 se instant spam detection
- **Confidence scores** — Spam/Legit probability bars
- **Risk score** — 0–10 scale pe risk rating
- **Detection signals** — 4 color-coded signals (red/amber/green)
- **Plain language explanation** — Kyun spam/legit classify kiya gaya
- **Session history** — Last 8 analyzed emails ka track
- **Dark mode** — Auto system theme detection
- **Responsive** — Mobile friendly UI

---

## 📁 Project Structure

```
email-spam-classifier/
├── frontend/
│   ├── index.html          # Main HTML file
│   └── src/
│       ├── style.css       # Styles (dark mode + responsive)
│       └── app.js          # Frontend JS logic
├── backend/
│   ├── server.js           # Express API proxy
│   ├── package.json        # Backend dependencies
│   └── .env.example        # Environment variables template
├── .gitignore
└── README.md
```

---

## 🚀 Quick Start

### Option A — Sirf Frontend (Local Testing)

1. `frontend/src/app.js` mein ye changes karein:
   ```js
   const USE_BACKEND = false;
   const CLAUDE_API_KEY = "your_api_key_here"; // ⚠️ Sirf local testing ke liye
   ```

2. `frontend/index.html` browser mein open karein — bas!

> ⚠️ **Warning:** API key ko frontend code mein production ke liye kabhi mat rakhein.

---

### Option B — Full Stack (Recommended)

#### 1. Backend setup

```bash
cd backend
npm install
cp .env.example .env
```

`.env` file mein apni API key daalo:
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxx
```

Backend start karein:
```bash
npm start
# Ya development mode mein:
npm run dev
```

Backend `http://localhost:3000` pe chalega.

#### 2. Frontend setup

`frontend/src/app.js` mein check karein:
```js
const USE_BACKEND = true;          // backend proxy use karega
const BACKEND_URL = "http://localhost:3000/api/classify";
```

`frontend/index.html` browser mein open karein.

---

## 🔌 API Reference

### POST `/api/classify`

Email classify karne ke liye.

**Request body:**
```json
{
  "subject": "You have won $1,000,000!",
  "sender": "prize@suspicious.xyz",
  "body": "Dear winner, click here to claim your reward..."
}
```

**Response:**
```json
{
  "verdict": "SPAM",
  "spam_probability": 97,
  "legit_probability": 3,
  "risk_score": 9.2,
  "signals": [
    { "type": "red",   "text": "Prize/money claim language used" },
    { "type": "red",   "text": "Suspicious sender domain" },
    { "type": "amber", "text": "Urgency language detected" },
    { "type": "green", "text": "No malicious links found" }
  ],
  "explanation": "This email exhibits classic spam patterns including unrealistic prize claims and an untrustworthy sender domain. The body uses high-pressure urgency tactics common in phishing attempts."
}
```

### GET `/health`

Server health check.

---

## 🌐 Deployment

### Frontend — GitHub Pages

1. Agar `USE_BACKEND = false` hai toh sirf frontend folder GitHub Pages pe deploy kar sakte ho.
2. GitHub repo mein jao → Settings → Pages → Source: `main` branch `/frontend` folder.

### Backend — Railway / Render / Fly.io

```bash
# Railway
railway login
railway init
railway up

# Render
# render.yaml create karein ya dashboard se deploy karein
```

Environment variable `ANTHROPIC_API_KEY` deployment platform pe set karein.

---

## 🔑 API Key Kahan Se Milegi?

1. [console.anthropic.com](https://console.anthropic.com) pe account banao
2. API Keys section mein jaao
3. Naya key create karo
4. Backend `.env` file mein daalo

---

## 🛠️ Tech Stack

| Layer    | Technology                    |
|----------|-------------------------------|
| Frontend | Vanilla HTML + CSS + JS       |
| Backend  | Node.js + Express             |
| AI Model | Claude Sonnet 4 (Anthropic)   |
| Fonts    | Syne + DM Mono (Google Fonts) |

---

## 📝 License

MIT — free to use, modify, aur distribute karein.
