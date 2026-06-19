import { supabase } from './supabase';
import type { User } from '../app/types';

export interface SignUpData {
  email: string;
  password: string;
  nickname: string;
  age?: number;
  gender?: string;
  prefecture?: string;
  city?: string;
  taste_badges?: string[];
}

export async function signUp(data: SignUpData) {
  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
    options: {
      data: { nickname: data.nickname },
    },
  });
  if (error) throw error;
  if (!authData.user) throw new Error('ユーザー作成に失敗しました');

  const { error: profileError } = await supabase.from('profiles').upsert({
    id: authData.user.id,
    nickname: data.nickname,
    age: data.age ?? null,
    gender: data.gender ?? null,
    prefecture: data.prefecture ?? null,
    city: data.city ?? null,
    taste_badges: data.taste_badges ?? [],
  });
  if (profileError) throw profileError;

  return authData.user;
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;

  return {
    id: data.id,
    nickname: data.nickname,
    email: '',
    age: data.age ?? 0,
    prefecture: data.prefecture ?? '',
    city: data.city ?? '',
    gender: (data.gender as User['gender']) ?? '回答しない',
    tasteBadges: (data.taste_badges ?? []) as User['tasteBadges'],
  };
}

export async function updateProfile(userId: string, updates: Partial<SignUpData>) {
  const { error } = await supabase.from('profiles').update({
    nickname: updates.nickname,
    age: updates.age,
    gender: updates.gender,
    prefecture: updates.prefecture,
    city: updates.city,
    taste_badges: updates.taste_badges,
  }).eq('id', userId);
  if (error) throw error;
}
