-- =========================================================
-- トレンド欄に運営がお知らせ記事を載せるためのテーブル
-- Supabase の SQL Editor で一度だけ実行してください
--
-- 管理者メールは src/app/admin.ts の ADMIN_EMAILS と揃えてください。
-- 管理者を増やすときは、このファイルの 'do.man.26.shibaura@gmail.com' を
-- IN ('a@example.com','b@example.com') の形に書き換えてポリシーを作り直します。
-- =========================================================

CREATE TABLE IF NOT EXISTS public.trend_articles (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title      TEXT NOT NULL CHECK (char_length(title) BETWEEN 1 AND 120),
  body       TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  image_url  TEXT,
  link_url   TEXT,
  -- false なら下書き。管理者だけが見られる。
  published  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS trend_articles_created_idx
  ON public.trend_articles (created_at DESC);

ALTER TABLE public.trend_articles ENABLE ROW LEVEL SECURITY;

-- 公開中の記事は誰でも読める。下書きは管理者のみ。
DROP POLICY IF EXISTS "trend_articles_select" ON public.trend_articles;
CREATE POLICY "trend_articles_select" ON public.trend_articles
  FOR SELECT USING (
    published OR (auth.jwt() ->> 'email') = 'do.man.26.shibaura@gmail.com'
  );

-- 書き込み・編集・削除は管理者のみ
DROP POLICY IF EXISTS "trend_articles_insert_admin" ON public.trend_articles;
CREATE POLICY "trend_articles_insert_admin" ON public.trend_articles
  FOR INSERT WITH CHECK ((auth.jwt() ->> 'email') = 'do.man.26.shibaura@gmail.com');

DROP POLICY IF EXISTS "trend_articles_update_admin" ON public.trend_articles;
CREATE POLICY "trend_articles_update_admin" ON public.trend_articles
  FOR UPDATE USING ((auth.jwt() ->> 'email') = 'do.man.26.shibaura@gmail.com');

DROP POLICY IF EXISTS "trend_articles_delete_admin" ON public.trend_articles;
CREATE POLICY "trend_articles_delete_admin" ON public.trend_articles
  FOR DELETE USING ((auth.jwt() ->> 'email') = 'do.man.26.shibaura@gmail.com');
