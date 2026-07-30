# AI Interview Coach — Monorepo

An AI-powered interview preparation platform built with Next.js + Express + MongoDB + NVIDIA NIM API.

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account (free tier) **or** local MongoDB
- NVIDIA NIM API key (optional — app works with mock AI without it)

### 1. Clone & Install
```bash
npm install
cd apps/api && npm install
cd ../web && npm install
```

### 2. Configure Environment
```bash
# Copy and fill in your values
cp apps/api/.env.example apps/api/.env
```

Edit `apps/api/.env`:
- `MONGODB_URI` — your MongoDB Atlas connection string
- `NVIDIA_API_KEY` — your key from https://build.nvidia.com (optional)
- `JWT_SECRET` — any strong random string

### 3. Run Development
```bash
# From root — runs both API and Web
npm run dev

# Or individually:
npm run dev:api   # API on http://localhost:5000
npm run dev:web   # Web on http://localhost:3000
```

## Project Structure
```
AI-Interview Coach/
├── apps/
│   ├── web/         ← Next.js 14 frontend
│   └── api/         ← Express + MongoDB backend
└── packages/
    └── shared/      ← Shared TypeScript types
```

## Features (MVP)
- ✅ Auth (JWT signup/login)
- ✅ Resume Upload & AI Analysis (ATS, grammar, skill gaps)
- ✅ Job Description Matching
- ✅ 6 Interview Modes (HR, Technical, Behavioral, Managerial, System Design, Group Discussion)
- ✅ 18+ Roles & Company Category picker
- ✅ AI Mock Interview (text + voice)
- ✅ Per-answer 6-dimension AI Feedback
- ✅ Interview Replay (your answer + ideal answer + why better)
- ✅ Dashboard with skill radar, trend chart, readiness %
- ✅ PDF Report Export
- ✅ XP & Streak gamification
