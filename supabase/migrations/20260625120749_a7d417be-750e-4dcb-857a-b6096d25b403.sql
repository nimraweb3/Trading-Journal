
-- =========================================================
-- ENUMS
-- =========================================================
CREATE TYPE public.trade_direction AS ENUM ('buy', 'sell');
CREATE TYPE public.trade_result AS ENUM ('win', 'loss', 'breakeven');
CREATE TYPE public.trade_grade AS ENUM ('A+', 'A', 'B+', 'B', 'C', 'F');
CREATE TYPE public.trade_phase AS ENUM ('before', 'during', 'after');

-- =========================================================
-- updated_at trigger
-- =========================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================================
-- PROFILES
-- =========================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  avatar_url TEXT,
  starting_balance NUMERIC(14,2) NOT NULL DEFAULT 10000,
  currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read"   ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- SETTINGS
-- =========================================================
CREATE TABLE public.settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'dark',
  accent_color TEXT NOT NULL DEFAULT '#800020',
  preferences JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings all" ON public.settings FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER settings_updated_at BEFORE UPDATE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TRADES
-- =========================================================
CREATE TABLE public.trades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pair TEXT NOT NULL,
  market TEXT,
  direction public.trade_direction NOT NULL,
  trade_date DATE NOT NULL DEFAULT CURRENT_DATE,
  session TEXT,
  killzone TEXT,
  entry_price NUMERIC(18,6),
  stop_loss NUMERIC(18,6),
  take_profit NUMERIC(18,6),
  risk_percent NUMERIC(6,3),
  rr_planned NUMERIC(8,3),
  rr_achieved NUMERIC(8,3),
  lot_size NUMERIC(14,4),
  result public.trade_result,
  pnl NUMERIC(14,2) NOT NULL DEFAULT 0,
  grade public.trade_grade,
  model TEXT,
  notes TEXT,
  emotions_before TEXT,
  emotions_after TEXT,
  mistakes TEXT,
  lessons TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trades_user_date_idx ON public.trades(user_id, trade_date DESC);
CREATE INDEX trades_user_pair_idx ON public.trades(user_id, pair);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trades TO authenticated;
GRANT ALL ON public.trades TO service_role;
ALTER TABLE public.trades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trades all" ON public.trades FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trades_updated_at BEFORE UPDATE ON public.trades
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- TRADE IMAGES
-- =========================================================
CREATE TABLE public.trade_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trade_id UUID NOT NULL REFERENCES public.trades(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  phase public.trade_phase,
  position INT NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX trade_images_trade_idx ON public.trade_images(trade_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.trade_images TO authenticated;
GRANT ALL ON public.trade_images TO service_role;
ALTER TABLE public.trade_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own trade images all" ON public.trade_images FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- RULEBOOK
-- =========================================================
CREATE TABLE public.rulebook_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category TEXT NOT NULL DEFAULT 'General',
  rule TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX rules_user_idx ON public.rulebook_rules(user_id, category, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rulebook_rules TO authenticated;
GRANT ALL ON public.rulebook_rules TO service_role;
ALTER TABLE public.rulebook_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own rules all" ON public.rulebook_rules FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =========================================================
-- JOURNAL NOTES
-- =========================================================
CREATE TABLE public.journal_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX notes_user_idx ON public.journal_notes(user_id, created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.journal_notes TO authenticated;
GRANT ALL ON public.journal_notes TO service_role;
ALTER TABLE public.journal_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own notes all" ON public.journal_notes FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON public.journal_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- AUTO PROFILE + SETTINGS ON SIGNUP
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
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

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- STORAGE POLICIES for trade-images bucket
-- (bucket created via storage tool; objects table policies here)
-- Files must live under: <user_id>/<trade_id>/<filename>
-- =========================================================
CREATE POLICY "trade-images own read"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'trade-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "trade-images own insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'trade-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "trade-images own update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'trade-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "trade-images own delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'trade-images' AND (storage.foldername(name))[1] = auth.uid()::text);
