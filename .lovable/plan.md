# Ironbook → Professional Trading Journal Upgrade

This is a large scope. I'll deliver it in **4 phased releases** so each phase is reviewable, testable, and shippable on its own. You can approve the whole plan, or tell me to start with a specific phase.

---

## Phase 1 — Data Model & Multi-Account Foundation
The single biggest architectural change. Everything else depends on it.

**Database migration (new tables, RLS, GRANTs, indexes):**
- `accounts` — name, broker, account_type (personal/prop/demo/funded/challenge), account_size, starting_balance, current_balance (computed), daily_dd_limit, max_dd_limit, profit_target, status (active/passed/failed/funded), currency, notes
- `trading_models` — name, setup_grade (A+/A/B+/B/C), market, timeframes[], entry_rules, confirmation_rules, invalidation_rules, risk_rules, management_rules, notes, active
- `model_images` — screenshots for each model (Supabase Storage)
- `trade_tags` + `trade_tag_links` — tagging system
- `reviews` — weekly/monthly review entries (period_start, period_end, type, content, lessons, mistakes)
- `mistakes` — catalog of repeated mistakes (label, category, count auto-rolled-up)
- `checklists` + `checklist_items` — pre-trade / daily / post-trade
- **Alter `trades`**: add `account_id` (FK, required), `model_id` (FK, nullable), `tradingview_link`, `position_size`, `tags[]` link
- All tables: RLS scoped to `auth.uid()`, GRANTs to authenticated + service_role, `updated_at` triggers

**App changes:**
- Account switcher in the top bar (global active account) + "All accounts" view
- Migrate existing trades into a default "Main" account auto-created from current profile.starting_balance
- TradeFormDialog: required Account + optional Model selectors

## Phase 2 — Models & Accounts UI
- `/models` — list, create, edit, delete trading models with full rule sections, screenshots, and **per-model stats** (Win rate, Avg RR, Total PnL, trade count) computed from linked trades. Best/worst model leaderboard.
- `/accounts` — grid of account cards (balance, equity curve sparkline, DD vs limits, status badge, progress to profit target). Detail page per account with its own equity curve, win rate, PF, monthly returns, strategy breakdown, drawdown chart.
- Advanced filter bar across Journal/Analytics: Account, Broker, Model, Market, Date range, Tag, Result.

## Phase 3 — Advanced Analytics, Reviews & Productivity
- **Dashboard upgrades**: drawdown curve, monthly returns bar chart, calendar heatmap, streak tracker (current/best win/loss streaks), consistency score, best day/worst day, most-traded market, risk metrics card.
- **Reviews module** (`/reviews`): weekly & monthly review editor with auto-populated stats for the period, plus free-form lessons/mistakes.
- **Mistakes Database** (`/mistakes`): aggregated repeated mistakes, rule violations, emotional patterns — derived from trade.mistakes + rule_violations join.
- **Checklists** (`/checklists`): customizable pre-trade, daily, post-trade checklists.
- **Calculators**: Risk calculator + Position size calculator (modal, available everywhere).
- **Export**: CSV export of trades (per filter), JSON backup/restore of full account.

## Phase 4 — Security Hardening, Polish & GitHub Readiness
- **Security audit & fixes**:
  - Zod validation on every form (client) + server-side validation in server functions for any privileged paths
  - Image uploads: MIME sniff, size cap, extension allowlist, per-user path enforcement in Storage RLS
  - Confirm `dangerouslySetInnerHTML` is not used anywhere
  - Add audit-log table for destructive actions
  - Run `supabase--linter` and `security--run_security_scan`, fix all findings
  - Cookie note: Supabase session lives in `localStorage` (managed) — I'll document this and confirm no custom cookies are needed; if you want cookie-based session for SSR, that's a separate larger change
- **Polish**: Light mode toggle, PWA manifest + service worker, mobile nav refinement, empty states, loading skeletons, error boundaries on every route
- **GitHub release prep**:
  - `README.md` (features, screenshots, stack, quickstart)
  - `.env.example` (only public vars; document `VITE_SUPABASE_URL` / `VITE_SUPABASE_PUBLISHABLE_KEY`)
  - `SECURITY.md` + `DEPLOYMENT.md` + `CONTRIBUTING.md`
  - Verify `.gitignore` excludes `.env`, confirm no secrets in repo
  - Migration files already live under `supabase/migrations/` — document the apply order
  - Optional seed script for demo data

---

## What I'm explicitly NOT including (call out if you want them)
- **AI-Powered Trade Review** — easy to add via Lovable AI Gateway in a Phase 5; left out to keep phases focused
- **Economic News Journal** — requires picking a news API; ask me when ready
- **PDF export** — CSV in Phase 3; PDF needs a separate library decision
- **Trade Replay Timeline** — nice-to-have, can follow Phase 3
- Migrating Supabase session to httpOnly cookies (would require custom SSR auth; current `localStorage` approach is the supported pattern for this stack)

---

## Reference site
I checked the screenshot of the Replit dashboard you linked — clean cards, equity curve up top, account/strategy filters, calendar heatmap. The "Ironbook" aesthetic we already have (dark + maroon + glassmorphism + serif display) is a stronger visual direction than that reference, so I'll keep our design language and adopt only the **information density and layout patterns** from your reference (multi-account switcher, per-account stats grid, calendar heatmap, model leaderboard).

---

## How I suggest we proceed
Reply with one of:
1. **"Go phase 1"** — I start with the data model migration + multi-account foundation (recommended; everything builds on this).
2. **"Do it all"** — I execute all 4 phases sequentially in one long run (slower turnaround, larger diff to review).
3. **Custom** — pick the phases/features you want first.
