# Deployment

## Lovable (one-click)
Click **Publish** in the Lovable editor. Backend (database, storage, auth) is
provisioned automatically by Lovable Cloud.

Custom domains: Project Settings → Domains.

## Self-host
1. `bun install`
2. Provision a Supabase project; run every SQL file in `supabase/migrations/` in order.
3. Create the private `trade-images` storage bucket; apply the bucket policies in the migrations.
4. Enable Google OAuth in Supabase Auth (optional).
5. Set the environment variables from `.env.example`.
6. Build & deploy:
   ```bash
   bun run build
   bun run start
   ```
   The output targets a serverless / edge runtime (Cloudflare Workers compatible).

## Post-deploy checklist
- [ ] All RLS policies enabled
- [ ] Storage bucket private
- [ ] Service role key not present in client bundle
- [ ] HTTPS enforced
- [ ] Google OAuth redirect URLs match the deployed origin
