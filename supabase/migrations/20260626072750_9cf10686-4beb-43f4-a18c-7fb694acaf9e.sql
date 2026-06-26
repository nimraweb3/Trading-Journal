
-- =========================================================================
-- ACCOUNTS
-- =========================================================================
CREATE TYPE public.account_type AS ENUM ('personal','prop','demo','funded','challenge');
CREATE TYPE public.account_status AS ENUM ('active','passed','failed','funded','breached','archived');

CREATE TABLE public.accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  broker text,
  prop_firm text,
  account_type public.account_type NOT NULL DEFAULT 'personal',
  account_size numeric NOT NULL DEFAULT 10000,
  starting_balance numeric NOT NULL DEFAULT 10000,
  currency text NOT NULL DEFAULT 'USD',
  daily_dd_limit numeric,
  max_dd_limit numeric,
  profit_target numeric,
  status public.account_status NOT NULL DEFAULT 'active',
  notes text,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.accounts TO authenticated;
GRANT ALL ON public.accounts TO service_role;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own accounts all" ON public.accounts FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX accounts_user_id_idx ON public.accounts(user_id);

CREATE TRIGGER set_accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- TRADING MODELS (strategies)
-- =========================================================================
CREATE TABLE public.trading_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  setup_grade text,
  market text,
  timeframes text[] NOT NULL DEFAULT '{}',
  entry_rules text,
  confirmation_rules text,
  invalidation_rules text,
  risk_rules text,
  management_rules text,
  notes text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trading_models TO authenticated;
GRANT ALL ON public.trading_models TO service_role;
ALTER TABLE public.trading_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own models all" ON public.trading_models FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX trading_models_user_id_idx ON public.trading_models(user_id);
CREATE TRIGGER set_trading_models_updated_at BEFORE UPDATE ON public.trading_models
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.model_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  model_id uuid NOT NULL REFERENCES public.trading_models(id) ON DELETE CASCADE,
  storage_path text NOT NULL,
  caption text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_images TO authenticated;
GRANT ALL ON public.model_images TO service_role;
ALTER TABLE public.model_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own model images all" ON public.model_images FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX model_images_model_idx ON public.model_images(model_id);

-- =========================================================================
-- TAGS
-- =========================================================================
CREATE TABLE public.trade_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  color text NOT NULL DEFAULT '#800020',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, label)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_tags TO authenticated;
GRANT ALL ON public.trade_tags TO service_role;
ALTER TABLE public.trade_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tags all" ON public.trade_tags FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.trade_tag_links (
  trade_id uuid NOT NULL,
  tag_id uuid NOT NULL REFERENCES public.trade_tags(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, tag_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_tag_links TO authenticated;
GRANT ALL ON public.trade_tag_links TO service_role;
ALTER TABLE public.trade_tag_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tag links all" ON public.trade_tag_links FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX trade_tag_links_trade_idx ON public.trade_tag_links(trade_id);

-- =========================================================================
-- REVIEWS
-- =========================================================================
CREATE TYPE public.review_type AS ENUM ('weekly','monthly','custom');
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
  review_type public.review_type NOT NULL DEFAULT 'weekly',
  period_start date NOT NULL,
  period_end date NOT NULL,
  title text,
  what_worked text,
  what_didnt text,
  lessons text,
  next_focus text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reviews all" ON public.reviews FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================================
-- MISTAKES
-- =========================================================================
CREATE TABLE public.mistakes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL,
  category text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, label)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mistakes TO authenticated;
GRANT ALL ON public.mistakes TO service_role;
ALTER TABLE public.mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own mistakes all" ON public.mistakes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.trade_mistakes (
  trade_id uuid NOT NULL,
  mistake_id uuid NOT NULL REFERENCES public.mistakes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  PRIMARY KEY (trade_id, mistake_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_mistakes TO authenticated;
GRANT ALL ON public.trade_mistakes TO service_role;
ALTER TABLE public.trade_mistakes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trade mistakes all" ON public.trade_mistakes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================================
-- CHECKLISTS
-- =========================================================================
CREATE TYPE public.checklist_type AS ENUM ('pretrade','daily','posttrade','weekly');
CREATE TABLE public.checklists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  checklist_type public.checklist_type NOT NULL DEFAULT 'pretrade',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklists TO authenticated;
GRANT ALL ON public.checklists TO service_role;
ALTER TABLE public.checklists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checklists all" ON public.checklists FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER set_checklists_updated_at BEFORE UPDATE ON public.checklists
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.checklist_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checklist_id uuid NOT NULL REFERENCES public.checklists(id) ON DELETE CASCADE,
  label text NOT NULL,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.checklist_items TO authenticated;
GRANT ALL ON public.checklist_items TO service_role;
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own checklist items all" ON public.checklist_items FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX checklist_items_list_idx ON public.checklist_items(checklist_id);

-- =========================================================================
-- TRADES: link to accounts + models, extra fields
-- =========================================================================
ALTER TABLE public.trades
  ADD COLUMN IF NOT EXISTS account_id uuid REFERENCES public.accounts(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.trading_models(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS tradingview_link text,
  ADD COLUMN IF NOT EXISTS position_size numeric;

CREATE INDEX IF NOT EXISTS trades_account_id_idx ON public.trades(account_id);
CREATE INDEX IF NOT EXISTS trades_model_id_idx ON public.trades(model_id);
CREATE INDEX IF NOT EXISTS trades_user_date_idx ON public.trades(user_id, trade_date DESC);

-- =========================================================================
-- BACKFILL: a default "Main" account per user; assign existing trades to it
-- =========================================================================
INSERT INTO public.accounts (user_id, name, account_type, account_size, starting_balance, currency, status, is_default)
SELECT p.id, 'Main', 'personal', p.starting_balance, p.starting_balance, p.currency, 'active', true
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.accounts a WHERE a.user_id = p.id);

UPDATE public.trades t
SET account_id = a.id
FROM public.accounts a
WHERE t.account_id IS NULL
  AND a.user_id = t.user_id
  AND a.is_default = true;

-- =========================================================================
-- AUTO-CREATE default account on signup (extend handle_new_user)
-- =========================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO public.settings (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.accounts (user_id, name, account_type, is_default)
  VALUES (NEW.id, 'Main', 'personal', true)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

-- =========================================================================
-- STORAGE policies for trade-images bucket (per-user prefix enforcement)
-- =========================================================================
DROP POLICY IF EXISTS "trade-images user read"   ON storage.objects;
DROP POLICY IF EXISTS "trade-images user insert" ON storage.objects;
DROP POLICY IF EXISTS "trade-images user update" ON storage.objects;
DROP POLICY IF EXISTS "trade-images user delete" ON storage.objects;

CREATE POLICY "trade-images user read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "trade-images user insert" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "trade-images user update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "trade-images user delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'trade-images' AND auth.uid()::text = (storage.foldername(name))[1]);
