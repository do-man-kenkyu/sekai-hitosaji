-- =========================================================
-- 「道満調味料研究所」アカウント（22件の投稿の持ち主）の
-- ログインメールアドレスを mk3939disney@gmail.com から
-- do.man.26.shibaura@gmail.com に変更
-- Supabase の SQL Editor に貼って一度だけ実行してください
-- =========================================================
UPDATE auth.users
SET email = 'do.man.26.shibaura@gmail.com'
WHERE id = 'f351802f-26eb-4c0c-b176-b5d6540d3bae';

UPDATE auth.identities
SET identity_data = jsonb_set(identity_data, '{email}', '"do.man.26.shibaura@gmail.com"')
WHERE user_id = 'f351802f-26eb-4c0c-b176-b5d6540d3bae';
