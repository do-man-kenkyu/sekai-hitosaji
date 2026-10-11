-- =========================================================
-- お知らせ記事の「本文」を任意項目にする
-- Supabase の SQL Editor で一度だけ実行してください
--
-- タイトルとPDFだけの記事（本文なし）を保存できるようにするための変更です。
-- 作成時は body を NOT NULL かつ1文字以上に制限していたため、本文が空だと
-- 保存できませんでした。
-- =========================================================

-- 本文を空のまま保存できるようにする
ALTER TABLE public.trend_articles
  ALTER COLUMN body DROP NOT NULL;

-- 「1文字以上5000文字以内」の制限を「空でもよい・5000文字以内」に緩める
ALTER TABLE public.trend_articles
  DROP CONSTRAINT IF EXISTS trend_articles_body_check;

ALTER TABLE public.trend_articles
  ADD CONSTRAINT trend_articles_body_check
  CHECK (body IS NULL OR char_length(body) <= 5000);
