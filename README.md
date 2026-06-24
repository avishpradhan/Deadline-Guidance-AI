# Deadline Guardian AI 🛡️

> Your AI Productivity Coach — powered by Google Gemini

Deadline Guardian AI is an intelligent productivity coaching platform that helps you set goals, generates personalized study/work plans using Google Gemini, tracks your daily progress, and holds you accountable with AI-driven coaching messages.

## 🏗️ Architecture

```
client/          → React + Vite + Tailwind CSS v4 (Frontend)
server/          → Node.js + Express + MongoDB (Backend)
                    ↕
                 Google Gemini API (5 AI Agents)
```

### AI Agents
1. **Goal Analysis Agent** — Assesses feasibility and risk
2. **Task Decomposition Agent** — Creates phased day-by-day plans
3. **Accountability Agent** — Daily coaching feedback
4. **Risk Prediction Agent** — Deadline risk classification
5. **Recovery Agent** — Compressed replanning for behind-schedule goals

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)
- Google Gemini API key from [AI Studio](https://aistudio.google.com/app/apikey)

### 1. Backend Setup
```bash
cd server
cp .env.example .env
# Edit .env with your MONGODB_URI, JWT_SECRET, and GEMINI_API_KEY
npm install
npm run dev
```

### 2. Frontend Setup
```bash
cd client
npm install
npm run dev
```

### 3. Seed Demo Data (optional)
```bash
cd server
npm run seed
# Login with: demo@guardian.ai / demo1234
```

### 4. Open the App
Visit `http://localhost:5173`

## 📱 Features

- **Smart Goal Creation** — 3-step form feeding Gemini for plan generation
- **AI Plan Generation** — Animated loading with phased task breakdown
- **Daily Check-ins** — Task completion tracking with AI accountability
- **Risk Alerts** — Real-time deadline risk prediction
- **Recovery Plans** — AI-generated replanning when behind schedule
- **Completion Celebrations** — Confetti and coach's final note

## 🎨 Design System

- **Background:** Deep navy `#0A0F1E`
- **Accent:** Electric indigo `#6366F1`
- **Risk:** Amber `#F59E0B`
- **Success:** Emerald `#10B981`
- **Typography:** Inter (body) + Syne (display)
- **Signature:** Coaching Pulse — animated ring around AI avatar

## 🗂️ API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create account |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Current user |
| GET | `/api/goals` | List goals |
| POST | `/api/goals` | Create goal |
| GET | `/api/goals/:id` | Goal detail |
| POST | `/api/goals/:id/complete` | Complete goal |
| POST | `/api/ai/analyze` | AI plan generation |
| POST | `/api/ai/checkin-analyze` | Accountability feedback |
| POST | `/api/ai/replan` | Recovery plan |
| POST | `/api/ai/risk` | Risk prediction |
| GET | `/api/dashboard` | Aggregated dashboard |
| POST | `/api/progress/checkin` | Daily check-in |

---

*Built for hackathon — Deadline Guardian AI v1.0*
