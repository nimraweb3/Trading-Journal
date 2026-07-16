<div align="center">

# 📈 TradeBook

**The open-source trading journal built for serious ICT / SMC traders.**

Log trades, tag mistakes, review with AI, and actually find your edge — with a premium dark UI, multi-account tracking, and the analytics prop-firm traders pay $30/month for.

[Live demo](https://nim-trade-journal.lovable.app) · [Report a bug](../../issues) · [Request a feature](../../issues)

![Stack](https://img.shields.io/badge/stack-React_19_·_TanStack_Start_·_Supabase-800020?style=flat-square)
![License](https://img.shields.io/badge/license-MIT-800020?style=flat-square)
![PWA](https://img.shields.io/badge/PWA-ready-800020?style=flat-square)

</div>

---

## ✨ Why TradeBook

Most journaling apps are either shallow spreadsheets or $30/mo SaaS. TradeBook is a full-featured, self-hostable alternative with fields real ICT/SMC traders care about — sessions, killzones, models, grades, R multiples — and the deep analytics you need to actually improve.

## 🚀 Features

### Journaling
- **Rich trade entries** — pair, direction, session, killzone, model/strategy, grade (A+ → C), R:R planned & achieved, risk %, position size, P&L
- **Trade thesis (rationale)** — capture *why* you took the trade before recording the outcome
- **Multi-image screenshots** with per-image download, full-size preview, and TradingView links
- **Mistake presets** (overtrading, FOMO, revenge, moved SL…) + custom tags
- **"Random trade" tag** for trades taken outside your plan
- **Custom pair library** — add any symbol on the fly, saved locally

### Strategy library
- Document every model: entry rules, confirmation, invalidation, risk & management, timeframes
- **Pre-trade checklist** attached to each strategy
- Per-strategy performance breakdown

### Multi-account
- Personal / Prop / Demo / Funded / Challenge accounts, each with its own starting balance & currency
- Global account switcher — every page (dashboard, journal, analytics, calendar) filters by active account

### Dashboard
- Equity curve, drawdown curve, monthly returns bar chart
- **84-day activity heatmap** (GitHub-style)
- Streak tiles: current, best win streak, worst loss streak, consistency %
- Zella-style insights: best/worst day, most-traded pair, best/worst pair, day-of-week P&L

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

## 🛠 Tech stack

| Layer | Tool |
|---|---|
| Framework | **TanStack Start v1** (React 19, SSR, Vite 7) |
| Styling | **Tailwind v4** + custom OKLCH design tokens + glassmorphism |
| Backend | **Supabase** (Postgres + Auth + Storage) via Lovable Cloud |
| Data | TanStack Query |
| Charts | Recharts |
| AI | Lovable AI Gateway (Gemini) |
| Icons | Lucide |

## 🏁 Getting started

### 1. Clone & install
```bash
git clone https://github.com/YOUR_USERNAME/tradebook.git
cd tradebook
bun install     # or npm install
```

### 2. Environment
```bash
cp .env.example .env
```
Fill in your Supabase project keys. **`.env` is git-ignored** — never commit it.

| Variable | Scope | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | client + server | Public project URL |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client + server | Public anon/publishable key |
| `VITE_SUPABASE_PROJECT_ID` | client + server | Project ref |
| `SUPABASE_SERVICE_ROLE_KEY` | server-only | **Never expose to the client** |
| `LOVABLE_API_KEY` | server-only | For AI weekly review (optional) |

### 3. Database
Migrations live in `supabase/migrations/`. Every user-facing table has RLS enabled with `auth.uid()`-scoped policies and explicit `GRANT` statements.

### 4. Run
```bash
bun run dev
```
Open <http://localhost:8080>.

## ⌨️ Shortcuts

| Key | Action |
|---|---|
| `⌘K` / `Ctrl+K` | Command palette |
| `N` | New trade |
| `G` then `D` | Go to Dashboard |
| `G` then `J` | Go to Journal |
| `G` then `A` | Go to Analytics |
| `?` | Show all shortcuts |

## 🚀 Deploy

- **One click** via [Lovable](https://lovable.dev) — Publish button, done.
- **Self-host** — see [`DEPLOYMENT.md`](./DEPLOYMENT.md). Runs anywhere that runs a Node/edge SSR app (Cloudflare Workers, Vercel, Netlify, Fly, your own box).

## 🤝 Contributing

PRs welcome. Please:
1. Open an issue first for anything non-trivial.
2. Keep the design system — no hardcoded colors, use tokens from `src/styles.css`.
3. Add RLS + GRANTs for any new table.
4. `bun run build` must pass.

## 🔒 Security

See [`SECURITY.md`](./SECURITY.md) for the disclosure process and threat model.

## 📄 License

[MIT](./LICENSE) — free to use, fork, self-host, and modify. Attribution appreciated but not required.

---

<div align="center">

Built with ❤️ for traders who want to stop losing to themselves.
**If TradeBook helps you, star the repo ⭐ and tell a trader friend.**

</div>
