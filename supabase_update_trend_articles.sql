-- =========================================================
-- お知らせ記事のテーブル更新（2点まとめ）
-- Supabase の SQL Editor で一度だけ実行してください
--
--   ① 本文を任意項目にする（タイトルとPDFだけの記事を保存できるように）
--   ② リンクの説明文を書ける欄を追加する
--
-- supabase_make_article_body_optional.sql を実行済みでも、
-- そのまま実行して問題ありません（同じ結果になります）。
-- =========================================================

-- ① 本文を空のまま保存できるようにする
ALTER TABLE public.trend_articles
  ALTER COLUMN body DROP NOT NULL;

ALTER TABLE public.trend_articles
  DROP CONSTRAINT IF EXISTS trend_articles_body_check;

ALTER TABLE public.trend_articles
  ADD CONSTRAINT trend_articles_body_check
  CHECK (body IS NULL OR char_length(body) <= 5000);

-- ② リンクの説明文（「このリンクは何か」を書く欄）
ALTER TABLE public.trend_articles
  ADD COLUMN IF NOT EXISTS link_label TEXT;
