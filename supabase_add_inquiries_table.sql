-- =========================================================
-- お問い合わせテーブルを追加
-- Supabase の SQL Editor に貼って一度だけ実行してください
-- =========================================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  subject    TEXT NOT NULL,
  message    TEXT NOT NULL CHECK (char_length(message) BETWEEN 1 AND 2000),
  user_id    UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 誰でも（未ログインでも）問い合わせを送信できる
CREATE POLICY "inquiries_insert_all" ON public.inquiries
  FOR INSERT WITH CHECK (true);

-- 管理者のメールアドレスのみ閲覧可能（src/app/admin.ts の ADMIN_EMAILS と揃えてください）
CREATE POLICY "inquiries_select_admin" ON public.inquiries
  FOR SELECT USING (
    (auth.jwt() ->> 'email') IN ('do.man.26.shibaura@gmail.com')
  );
