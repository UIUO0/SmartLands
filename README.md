# 🌍 Smart Lands

![Python](https://img.shields.io/badge/Python-3.9+-blue.svg)
![FastAPI](https://img.shields.io/badge/FastAPI-async-teal.svg)
![Next.js](https://img.shields.io/badge/Next.js-16-black.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue.svg)

**Smart Lands** is a full-stack real-estate marketplace for buying and selling land. It gives buyers and sellers a secure channel to negotiate, and uses AI for a personal assistant and for automated content moderation.

**Smart Lands** منصة عقارية متكاملة لبيع وشراء الأراضي، توفّر قناة آمنة للتواصل بين البائع والمشتري، وتستخدم الذكاء الاصطناعي في المساعد الشخصي وفي الرقابة الآلية على المحادثات.

---

## ✨ Features

- **Land listings** – full CRUD, multiple images (Cloudinary), city/location filtering.
- **Purchase workflow** – buyers send requests, owners accept or reject; a land moves through `Available → Reserved → Sold` automatically.
- **Buyer/seller chat** – a private conversation opens when a request is accepted, with Agree / Disagree actions to close the deal.
- **Digital agreements** – a preliminary agreement is generated for each deal.
- **AI assistant** – a Saudi-dialect assistant (Google Gemini) that answers using the user's own permitted data (lands, deals, chats).
- **AI moderation** – user reports are analysed against the chat transcript by Llama 3 on Groq (`valid` / `invalid`), with automatic warning emails.
- **Authentication** – email + password (bcrypt, JWT in HTTP-only cookies), Google OAuth, email verification and password reset.

## 🏗️ Architecture

```
┌────────────────────┐   HTTPS / cookies   ┌──────────────────────┐
│ Next.js 16 (React) │ ──────────────────► │ FastAPI (async)      │
│ App Router, Tailwind│   /api route proxy  │ SQLAlchemy 2 + MySQL │
└────────────────────┘                     └─────┬────────┬───────┘
                                                 │        │
                       Cloudinary (images) ◄─────┘        ├──► Google Gemini (assistant)
                       SendGrid / SMTP (email) ◄──────────┼──► Groq / Llama 3 (moderation)
                                                          └──► Google OAuth
```

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | FastAPI, SQLAlchemy (async), MySQL (`asyncmy`), Pydantic, PyJWT, Passlib |
| AI | Google Gemini (`gemini-2.5-flash`), Groq (`llama-3.1-8b-instant`) |
| Frontend | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4, `@react-oauth/google` |
| Services | Cloudinary, SendGrid, Google OAuth |
| Deployment | Railway (API, `Procfile`), Vercel (web) |

## 📁 Project Structure

```
SmartLands/
├── backend/
│   ├── app/
│   │   ├── core/        # security, JWT, password hashing
│   │   ├── db/          # async engine & session
│   │   ├── models/      # SQLAlchemy models
│   │   ├── routers/     # auth, users, lands, chats, agreements, reports, ai_agent
│   │   ├── schemas/     # Pydantic schemas
│   │   ├── utils/       # email, error helpers
│   │   └── main.py      # app factory, CORS, lifespan checks
│   ├── init_db.py       # creates tables
│   └── .env.example
└── frontend/
    ├── src/app/         # pages + /api route handlers
    ├── src/components/
    └── src/lib/
```

## ⚙️ Getting Started

Requirements: **Python 3.9+**, **Node.js 18+**, **MySQL**.

### 1. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env            # then fill in your own values
python init_db.py               # create tables
uvicorn app.main:app --reload   # http://localhost:8000
```

Interactive API docs are served at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
cp .env.example .env.local
npm install
npm run dev                     # http://localhost:3000
```

### Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ | MySQL connection string (async driver) |
| `JWT_SECRET` | ✅ | Secret used to sign tokens |
| `GOOGLE_API_KEY` | AI | Gemini assistant |
| `GROQ_API_KEY` | AI | Report moderation |
| `GOOGLE_CLIENT_ID` | OAuth | Google sign-in |
| `CLOUDINARY_*` | Images | Image uploads |
| `SENDGRID_API_KEY` | Email | Verification & warning emails |
| `ALLOWED_ORIGINS` | – | Comma-separated CORS origins |

> Secrets are read from the environment only. Never commit `.env`; use `.env.example` as a template.

## 👥 Team

- Saad Abdulaziz Al-Shehri
- Faisal Abdullah Al-Shehri
- Abbas Abdulaziz Al-Thunayan
- Mohammed Sameer Al-Ajlan
- Nawaf Rabea Shahbal
