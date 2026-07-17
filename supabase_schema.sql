-- =========================================================
-- 世界のひとさじ - Supabase スキーマ
-- Supabase ダッシュボード > SQL Editor で実行してください
-- =========================================================

-- ① プロフィールテーブル (auth.users と 1:1 対応)
CREATE TABLE IF NOT EXISTS public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nickname    TEXT NOT NULL,
  age         INTEGER,
  gender      TEXT CHECK (gender IN ('男性','女性','その他','回答しない')),
  prefecture  TEXT,
  city        TEXT,
  taste_badges TEXT[] DEFAULT '{}',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ② 調味料テーブル
CREATE TABLE IF NOT EXISTS public.condiments (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name               TEXT NOT NULL,
  category           TEXT NOT NULL,
  description        TEXT NOT NULL,
  origin             TEXT NOT NULL,
  recommended_dishes TEXT[] DEFAULT '{}',
  pairing_condiments TEXT[] DEFAULT '{}',
  repeat_rating      INTEGER NOT NULL CHECK (repeat_rating BETWEEN 1 AND 5),
  purchase_location  TEXT NOT NULL,
  taste_profile      JSONB NOT NULL DEFAULT '{}',
  image_url          TEXT NOT NULL DEFAULT '',
  user_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at         TIMESTAMPTZ DEFAULT NOW()
);

-- ③ いいねテーブル
CREATE TABLE IF NOT EXISTS public.likes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  condiment_id UUID REFERENCES public.condiments(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, condiment_id)
);

-- ④ ブックマークテーブル
CREATE TABLE IF NOT EXISTS public.bookmarks (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  condiment_id UUID REFERENCES public.condiments(id) ON DELETE CASCADE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, condiment_id)
);

-- ⑤ コメントテーブル (parent_id で返信を表現)
CREATE TABLE IF NOT EXISTS public.comments (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  condiment_id UUID REFERENCES public.condiments(id) ON DELETE CASCADE NOT NULL,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  parent_id    UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  content      TEXT NOT NULL CHECK (char_length(content) BETWEEN 1 AND 500),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ⑥ 通知テーブル
CREATE TABLE IF NOT EXISTS public.notifications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('like','comment','reply')),
  actor_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  condiment_id UUID REFERENCES public.condiments(id) ON DELETE SET NULL,
  comment_id   UUID REFERENCES public.comments(id) ON DELETE SET NULL,
  read         BOOLEAN DEFAULT FALSE,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- Row Level Security (RLS)
-- =========================================================

ALTER TABLE public.profiles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.condiments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;

-- profiles: 誰でも読める / 本人のみ書ける
CREATE POLICY "profiles_select_all"  ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- condiments: 誰でも読める / ログイン済みで投稿 / 本人のみ削除
CREATE POLICY "condiments_select_all"    ON public.condiments FOR SELECT USING (true);
CREATE POLICY "condiments_insert_auth"   ON public.condiments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "condiments_delete_owner"  ON public.condiments FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "condiments_update_owner"  ON public.condiments FOR UPDATE USING (auth.uid() = user_id);

-- likes: 誰でも読める / 本人のみ追加・削除
CREATE POLICY "likes_select_all"   ON public.likes FOR SELECT USING (true);
CREATE POLICY "likes_insert_self"  ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "likes_delete_self"  ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- bookmarks: 本人のみ読み書き
CREATE POLICY "bookmarks_select_self" ON public.bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "bookmarks_insert_self" ON public.bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "bookmarks_delete_self" ON public.bookmarks FOR DELETE USING (auth.uid() = user_id);

-- comments: 誰でも読める / ログイン済みで投稿 / 本人のみ削除
CREATE POLICY "comments_select_all"   ON public.comments FOR SELECT USING (true);
CREATE POLICY "comments_insert_auth"  ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_delete_owner" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- notifications: 本人のみ読み書き
CREATE POLICY "notifications_select_self" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_self" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_insert_auth" ON public.notifications FOR INSERT WITH CHECK (true);

-- =========================================================
-- トリガー: auth.users 登録時に profiles を自動作成
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nickname', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- トリガー: いいね時に通知を自動作成
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  condiment_owner UUID;
BEGIN
  SELECT user_id INTO condiment_owner FROM public.condiments WHERE id = NEW.condiment_id;
  IF condiment_owner IS NOT NULL AND condiment_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, condiment_id)
    VALUES (condiment_owner, 'like', NEW.user_id, NEW.condiment_id);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_like ON public.likes;
CREATE TRIGGER on_new_like
  AFTER INSERT ON public.likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

-- =========================================================
-- トリガー: コメント時に通知を自動作成
-- =========================================================
CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  condiment_owner UUID;
  parent_author   UUID;
BEGIN
  SELECT user_id INTO condiment_owner FROM public.condiments WHERE id = NEW.condiment_id;
  IF condiment_owner IS NOT NULL AND condiment_owner <> NEW.user_id THEN
    INSERT INTO public.notifications (user_id, type, actor_id, condiment_id, comment_id)
    VALUES (condiment_owner, 'comment', NEW.user_id, NEW.condiment_id, NEW.id);
  END IF;

  IF NEW.parent_id IS NOT NULL THEN
    SELECT user_id INTO parent_author FROM public.comments WHERE id = NEW.parent_id;
    IF parent_author IS NOT NULL AND parent_author <> NEW.user_id THEN
      INSERT INTO public.notifications (user_id, type, actor_id, condiment_id, comment_id)
      VALUES (parent_author, 'reply', NEW.user_id, NEW.condiment_id, NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_new_comment ON public.comments;
CREATE TRIGGER on_new_comment
  AFTER INSERT ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

-- =========================================================
-- Storage バケット (画像アップロード用)
-- =========================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('condiment-images', 'condiment-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "images_select_all" ON storage.objects
  FOR SELECT USING (bucket_id = 'condiment-images');

CREATE POLICY "images_insert_auth" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'condiment-images' AND auth.role() = 'authenticated');

CREATE POLICY "images_delete_owner" ON storage.objects
  FOR DELETE USING (bucket_id = 'condiment-images' AND auth.uid()::text = (storage.foldername(name))[1]);
