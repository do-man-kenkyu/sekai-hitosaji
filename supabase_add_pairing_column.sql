-- =========================================================
-- condiments テーブルに「相性のよい調味料」列を追加
-- Supabase の SQL Editor に貼って一度だけ実行してください
-- =========================================================
ALTER TABLE public.condiments
  ADD COLUMN IF NOT EXISTS pairing_condiments TEXT[] DEFAULT '{}';
