# Security Notes

## Authentication
- Email/password + Google OAuth via the Lovable broker.
- Sessions persisted by Supabase JS in `localStorage`; the `_authenticated` layout gates protected routes client-side.

## Database (RLS)
Every user-owned table has RLS enabled with policies scoped to `auth.uid()`:
- `profiles`, `settings`, `accounts`, `trades`, `trade_images`, `trading_models`, `model_images`,
  `trade_tags`, `trade_tag_links`, `reviews`, `mistakes`, `trade_mistakes`,
  `checklists`, `checklist_items`, `rulebook_rules`, `journal_notes`.
- `trade-images` storage bucket is private; objects enforce
  `auth.uid()::text = (storage.foldername(name))[1]`.

## Secrets
- `SUPABASE_SERVICE_ROLE_KEY` is server-only. It is never imported in route or
  component code; admin operations load `@/integrations/supabase/client.server`
  lazily inside server-function handlers.
- `.env` is git-ignored. `.env.example` documents the required variables.

## Input handling
- All forms validate required fields client-side; numeric fields are typed.
- File uploads check MIME (image/*) and size; objects are stored under
  `${userId}/${tradeId}/…` to enforce the storage RLS prefix.
- Supabase JS uses parameterized queries — SQL injection is not reachable
  from the client.

## XSS
- No `dangerouslySetInnerHTML` in user-rendered content.
- All user text rendered as React children (escaped).

## Reporting
Report vulnerabilities privately to the project owner.
