# 📈 TradeBook

**A personal trading journal, vibe-coded with [Lovable](https://lovable.dev).**

I built this for myself to log my own ICT/SMC trades, tag my mistakes, and actually see my patterns instead of guessing. Sharing it here in case it's useful to other traders who want something similar, or want to fork it and make it their own.

[Live Demo](https://trading-journal-vzwv.vercel.app/)

![Stack](https://img.shields.io/badge/stack-React_19_%2B_TanStack_Start_%2B_Supabase-800020?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-800020?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-ready-800020?style=flat-square)

---

## Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [Connecting Supabase](#-connecting-supabase)
- [Adding Google Authentication](#-adding-google-authentication)
- [Running Locally](#-running-locally)
- [Keyboard Shortcuts](#️-shortcuts)
- [Deployment](#-deploy)
- [Security](#-security)
- [License](#-license)

---

## ✨ About

Most journaling apps are either shallow spreadsheets or $30/mo SaaS. I wanted something built around how I actually trade sessions, killzones, models, grades, R multiples  with the analytics I'd otherwise have to pay for. So I vibe-coded this with Lovable for personal use, and it's grown into a full trading journal with AI review, multi-account tracking, and deep analytics.

## 🚀 Features

### Journaling
- **Rich trade entries** — pair, direction, session, killzone, model/strategy, grade (A+ → C), R:R planned & achieved, risk %, position size, P&L
- **Trade thesis (rationale)** — capture *why* you took the trade before recording the outcome
- **Multi-image screenshots** with per-image download, full-size preview, and TradingView links
- **Mistake presets** (overtrading, FOMO, revenge, moved SL…) + custom tags
- **"Random trade" tag** for trades taken outside your plan
- **Custom pair library** — add any symbol on the fly, saved locally

### Strategy Library
- Document every model: entry rules, confirmation, invalidation, risk & management, timeframes
- **Pre-trade checklist** attached to each strategy
- Per-strategy performance breakdown

### Multi-Account
- Personal / Prop / Demo / Funded / Challenge accounts, each with its own starting balance & currency
- Global account switcher -every page (dashboard, journal, analytics, calendar) filters by active account

### Dashboard
- Equity curve, drawdown curve, monthly returns bar chart
- **84-day activity heatmap** (GitHub-style)
- Streak tiles: current, best win streak, worst loss streak, consistency %
- Insights: best/worst day, most-traded pair, best/worst pair, day-of-week P&L

### Analytics
- **AI Weekly Review** (Lovable AI Gateway → Gemini) — brutally honest coach summary with headline verdict, what went wrong, what went right, patterns, and focus for next week
- **Risk analytics**: expectancy, avg R, profit factor, payoff ratio, Sharpe, Sortino, R-multiple distribution, cumulative R, rolling 20-trade win rate
- Breakdowns by pair, session, day-of-week, model, and grade

### Productivity
- ⌘K **command palette** — jump to any page, open calculators, log a trade
- Global **keyboard shortcuts** with help overlay
- **Calculators**: risk, position size, R:R
- **Light / Dark / System** theme
- **CSV export** of trades with filters applied
- **PWA-ready** (installable, offline shell)

### Security
- Row-Level Security on every table (`auth.uid()` scoped)
- Private storage bucket with per-user prefix isolation
- Email + Google OAuth
- No service-role secrets in the client

## 🛠 Tech Stack

| Layer     | Tool                                                          |
| --------- | -------------------------------------------------------------- |
| Framework | **TanStack Start v1** (React 19, SSR, Vite 7)                  |
| Styling   | **Tailwind v4** + custom OKLCH design tokens + glassmorphism    |
| Backend   | **Supabase** (Postgres + Auth + Storage) via Lovable Cloud       |
| Data      | TanStack Query                                                  |
| Charts    | Recharts                                                         |
| AI        | Lovable AI Gateway (Gemini)                                     |
| Icons     | Lucide                                                           |

---

## 🏁 Getting Started

### 1. Clone & install

```bash
git clone https://github.com/nimraweb3/Trading-Journal.git
cd Trading-Journal
bun install     # or npm install
```

### 2. Environment variables

```bash
cp .env.example .env
```

Fill in your Supabase keys (see [Connecting Supabase](#-connecting-supabase) below).

| Variable                        | Scope           | Notes                            |
| -------------------------------- | ---------------- | ---------------------------------- |
| `VITE_SUPABASE_URL`              | client + server  | Public project URL                |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | client + server  | Public anon/publishable key       |
| `VITE_SUPABASE_PROJECT_ID`       | client + server  | Project ref                       |
| `SUPABASE_SERVICE_ROLE_KEY`      | server-only      | **Never expose to the client**    |
| `LOVABLE_API_KEY`                | server-only      | For AI weekly review (optional)   |

> ⚠️ `.env` is git-ignored — never commit it.

---

## 🔌 Connecting Supabase

TradeBook uses Supabase for Postgres, Auth, and Storage. To connect your own project:

1. **Create a project**
   Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New Project**. Pick a name, a strong database password, and a region close to you.

2. **Grab your API keys**
   In your project, go to **Project Settings → API**. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon / publishable key** → `VITE_SUPABASE_PUBLISHABLE_KEY`
   - **Project ID** (in the URL or Settings → General) → `VITE_SUPABASE_PROJECT_ID`
   - **service_role key** (Settings → API, "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — keep this server-side only, e.g. as a secret in your hosting provider, never in the client bundle.

3. **Run the database migrations**
   Migrations live in `supabase/migrations/`. If you have the Supabase CLI installed:

   ```bash
   npm install -g supabase
   supabase login
   supabase link --project-ref YOUR_PROJECT_ID
   supabase db push
   ```

   This creates all tables with **Row-Level Security enabled** and `auth.uid()`-scoped policies already applied — you don't need to write RLS policies yourself.

4. **Create the storage bucket**
   If it isn't created automatically by the migrations, go to **Storage** in the Supabase dashboard and create a private bucket (check `supabase/migrations/` for the expected bucket name — trade screenshots are stored with per-user prefix isolation, so keep it **private**, not public).

5. **Paste the keys into `.env`** and restart your dev server.

---

## 🔐 Adding Google Authentication

TradeBook ships with an Email + Google OAuth-ready auth flow. To activate Google sign-in:

### Step 1 — Create Google OAuth credentials

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) → create a new project (or select an existing one).
2. Navigate to **APIs & Services → OAuth consent screen**.
   - Choose **External** (unless you're restricting to a Google Workspace org).
   - Fill in app name, support email, and developer contact email.
   - Add the scopes: `email`, `profile`, `openid` (these are usually pre-selected).
3. Navigate to **APIs & Services → Credentials → Create Credentials → OAuth client ID**.
   - Application type: **Web application**.
   - Under **Authorized redirect URIs**, add your Supabase callback URL:
     ```
     https://<YOUR_PROJECT_ID>.supabase.co/auth/v1/callback
     ```
   - Save, then copy the generated **Client ID** and **Client Secret**.

### Step 2 — Enable Google provider in Supabase

1. In your Supabase dashboard, go to **Authentication → Providers → Google**.
2. Toggle it **on**.
3. Paste in the **Client ID** and **Client Secret** from Google Cloud.
4. Save.

### Step 3 — Set your Site URL and Redirect URLs

Still in **Authentication → URL Configuration**:
- **Site URL**: your production URL (e.g. `https://nim-trade-journal.lovable.app`)
- **Redirect URLs**: add both your local dev URL and production URL, e.g.:
  ```
  http://localhost:8080/**
  https://nim-trade-journal.lovable.app/**
  ```

### Step 4 — Confirm it in code

TradeBook's auth logic already calls Supabase's OAuth sign-in method for Google (look for `supabase.auth.signInWithOAuth({ provider: 'google' })` in the auth-related files under `src/`). Once the provider is enabled in Supabase and the redirect URLs are set, the existing "Continue with Google" button will work — no extra frontend code should be needed.

### Step 5 — Test it

Run the app locally (see below), click **Continue with Google**, and confirm you're redirected back to the app fully signed in. Check **Authentication → Users** in Supabase to confirm the new user was created.

---

## 💻 Running Locally

1. Make sure you've completed [Getting Started](#-getting-started) (cloned the repo, installed dependencies, filled `.env`) and [Connecting Supabase](#-connecting-supabase).

2. Start the dev server:

   ```bash
   bun run dev
   # or
   npm run dev
   ```

3. Open your browser at:

   ```
   http://localhost:8080
   ```

4. Sign up with email, or use **Continue with Google** if you've completed the OAuth setup above.

5. To build for production locally:

   ```bash
   bun run build
   bun run preview
   ```

**Troubleshooting tips:**
- If the app loads but data won't save, double-check your Supabase keys in `.env` and that migrations were pushed (`supabase db push`).
- If Google sign-in redirects but doesn't log you in, re-check the redirect URI matches **exactly** (including `http://localhost:8080`, no trailing slash mismatches) in both Google Cloud Console and Supabase.
- If port 8080 is already in use, check `vite.config.ts` to change the dev server port.

---

## ⌨️ Shortcuts

| Key             | Action              |
| ---------------- | -------------------- |
| `⌘K` / `Ctrl+K`   | Command palette      |
| `N`               | New trade            |
| `G` then `D`      | Go to Dashboard       |
| `G` then `J`      | Go to Journal          |
| `G` then `A`      | Go to Analytics        |
| `?`               | Show all shortcuts     |

## 🚀 Deploy

- **Self-host** — see [`DEPLOYMENT.md`](https://github.com/nimraweb3/Trading-Journal/blob/main/DEPLOYMENT.md). Runs anywhere that runs a Node/edge SSR app (Cloudflare Workers, Vercel, Netlify, Fly, your own box).

## 🔒 Security

See [`SECURITY.md`](https://github.com/nimraweb3/Trading-Journal/blob/main/SECURITY.md) for the disclosure process and threat model.

## 📄 License

[MIT](https://github.com/nimraweb3/Trading-Journal/blob/main/LICENSE) — free to use, fork, self-host, and modify. Attribution appreciated but not required.

---

Built with ❤️ for my own trading — sharing it in case it helps someone else too.~
