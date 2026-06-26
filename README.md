# Ironbook — Trading Journal

Premium dark-mode trading journal built for ICT/SMC traders. Multi-account, multi-strategy, charts, reviews, mistakes database, calculators, PWA-ready.

## Stack
- TanStack Start v1 (React 19, SSR, Vite 7)
- Tailwind v4 + custom OKLCH design system
- Lovable Cloud (managed Supabase) — Auth, Postgres, Storage
- TanStack Query, Recharts, Lucide

## Features
- Multi-account (Personal, Prop, Demo, Funded, Challenge) with global filter
- Trading Models / Strategy library with per-model performance
- Trade Journal: ICT fields, screenshots, TradingView links, risk %, RR
- Dashboard: equity curve, drawdown curve, monthly returns, activity heatmap, streaks
- Calendar P&L view, Analytics breakdowns by pair/session/day/grade
- Weekly/Monthly reviews, Mistakes database, Checklists
- Calculators (Risk, Position Size, RR)
- CSV export, PWA manifest

## Local development
```bash
bun install
bun run dev
```

Copy `.env.example` to `.env` and fill in the Supabase keys from your project.

## Environment
| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | client + server | Public |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | client + server | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Never commit |

`.env` is git-ignored. See `.env.example`.

## Database
Migrations live in `supabase/migrations/`. RLS is enabled on every user table with `auth.uid()`-scoped policies. Storage bucket `trade-images` is private with per-user prefix isolation.

## Deploy
Click **Publish** in Lovable, or self-host per https://docs.lovable.dev/tips-tricks/self-hosting

## Security
See `SECURITY.md`.
