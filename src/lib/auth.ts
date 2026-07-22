import { supabase } from './supabase';
import type { User } from '../app/types';
import { calculateAge } from '../app/utils/age';

export interface SignUpData {
  email: string;
  password: string;
  nickname: string;
  fullName?: string;
  birthdate?: string;
  gender?: string;
  prefecture?: string;
  city?: string;
  taste_badges?: string[];
}

export async function signUp(data: SignUpData) {
  // GitHub Pages はサブパス（/sekai-hitosaji/）配信のため、確認メールのリンク先を
  // 現在のオリジン＋baseパスに明示しないと Supabase の Site URL（既定値）に飛ばされ 404 になる
  const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;

  // メール確認が有効な場合、確認完了までは未ログイン状態でRLSにより profiles への
  // 直接書き込みができない。そのためプロフィール項目もユーザーメタデータとして渡し、
  // auth.users 作成時のトリガー（handle_new_user）側で profiles に反映する。
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: {
        nickname: data.nickname,
        full_name: data.fullName,
        birthdate: data.birthdate,
        gender: data.gender,
        prefecture: data.prefecture,
        city: data.city,
        taste_badges: data.taste_badges ?? [],
      },
      emailRedirectTo,
    },
  });
  if (error) throw error;
  if (!authData.user) throw new Error('ユーザー作成に失敗しました');

  // メール確認が有効な場合、既存メールで登録してもSupabaseはセキュリティ上エラーを返さず、
  // identities が空のダミーユーザーを返す。これを「登録済み」として扱い重複登録を防ぐ。
  if (authData.user.identities && authData.user.identities.length === 0) {
    throw new Error('User already registered');
  }

  // session が無い場合はメール確認待ち（確認リンクをクリックするまでログインされない）
  return { user: authData.user, needsEmailConfirmation: !authData.session };
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

// 確認メールを再送する
export async function resendConfirmationEmail(email: string) {
  const emailRedirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`;
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: { emailRedirectTo },
  });
  if (error) throw error;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<User | null> {
  // まず profile_private を含めて取得
  let { data, error } = await supabase
    .from('profiles')
    .select('*, profile_private(birthdate, gender, prefecture, city)')
    .eq('id', userId)
    .single();

  // profile_private 未整備などで join に失敗した場合は、公開情報のみで再取得する
  // （ログイン自体が失敗して「未ログイン扱い」になるのを防ぐ）
  if (error) {
    console.warn('プロフィール（非公開情報付き）の取得に失敗、公開情報のみで再取得します:', error.message);
    const fallback = await supabase.from('profiles').select('*').eq('id', userId).single();
    data = fallback.data as any;
    error = fallback.error;
  }
  if (error || !data) return null;

  const row = data as any;
  const priv = Array.isArray(row.profile_private) ? row.profile_private[0] : row.profile_private;

  return {
    id: row.id,
    nickname: row.nickname,
    email: '',
    birthdate: priv?.birthdate ?? undefined,
    age: calculateAge(priv?.birthdate),
    prefecture: priv?.prefecture ?? '',
    city: priv?.city ?? '',
    gender: (priv?.gender as User['gender']) ?? '回答しない',
    tasteBadges: (row.taste_badges ?? []) as User['tasteBadges'],
  };
}

// 氏名・生年月日は登録後編集不可のため、ここでは更新しない
export async function updateProfile(userId: string, updates: Partial<SignUpData>) {
  const { error: profileError } = await supabase.from('profiles').update({
    nickname: updates.nickname,
    taste_badges: updates.taste_badges,
  }).eq('id', userId);
  if (profileError) throw profileError;

  const { error: privateError } = await supabase.from('profile_private').update({
    gender: updates.gender,
    prefecture: updates.prefecture,
    city: updates.city,
  }).eq('id', userId);
  if (privateError) throw privateError;
}
