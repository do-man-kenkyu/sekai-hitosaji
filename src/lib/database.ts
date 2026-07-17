import { supabase } from './supabase';
import type { Condiment, TasteProfile } from '../app/types';

// ===== 調味料 =====

function rowToCondiment(row: any): Condiment {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description,
    origin: row.origin,
    recommendedDishes: row.recommended_dishes ?? [],
    repeatRating: row.repeat_rating,
    purchaseLocation: row.purchase_location,
    tasteProfile: row.taste_profile as TasteProfile,
    imageUrl: row.image_url,
    postedBy: {
      userId: row.user_id,
      nickname: row.profiles?.nickname ?? '不明',
      tasteBadges: row.profiles?.taste_badges ?? [],
    },
    createdAt: row.created_at,
  };
}

export async function fetchCondiments(): Promise<Condiment[]> {
  const { data, error } = await supabase
    .from('condiments')
    .select('*, profiles(nickname, taste_badges)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map(rowToCondiment);
}

export async function insertCondiment(
  condiment: Omit<Condiment, 'id' | 'createdAt' | 'postedBy'>,
  userId: string
): Promise<Condiment> {
  const { data, error } = await supabase
    .from('condiments')
    .insert({
      name: condiment.name,
      category: condiment.category,
      description: condiment.description,
      origin: condiment.origin,
      recommended_dishes: condiment.recommendedDishes,
      repeat_rating: condiment.repeatRating,
      purchase_location: condiment.purchaseLocation,
      taste_profile: condiment.tasteProfile as any,
      image_url: condiment.imageUrl,
      user_id: userId,
    })
    .select('*, profiles(nickname, taste_badges)')
    .single();
  if (error) throw error;
  return rowToCondiment(data);
}

export async function updateCondiment(
  id: string,
  condiment: Omit<Condiment, 'id' | 'createdAt' | 'postedBy'>
): Promise<Condiment> {
  const { data, error } = await supabase
    .from('condiments')
    .update({
      name: condiment.name,
      category: condiment.category,
      description: condiment.description,
      origin: condiment.origin,
      recommended_dishes: condiment.recommendedDishes,
      repeat_rating: condiment.repeatRating,
      purchase_location: condiment.purchaseLocation,
      taste_profile: condiment.tasteProfile as any,
      image_url: condiment.imageUrl,
    })
    .eq('id', id)
    .select('*, profiles(nickname, taste_badges)')
    .single();
  if (error) throw error;
  return rowToCondiment(data);
}

export async function deleteCondiment(id: string) {
  const { error } = await supabase.from('condiments').delete().eq('id', id);
  if (error) throw error;
}

// ===== いいね =====

export async function fetchLikedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('likes')
    .select('condiment_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.condiment_id);
}

export async function toggleLike(userId: string, condimentId: string, liked: boolean) {
  if (liked) {
    const { error } = await supabase.from('likes').delete()
      .eq('user_id', userId).eq('condiment_id', condimentId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('likes').insert({ user_id: userId, condiment_id: condimentId });
    if (error) throw error;
  }
}

export async function fetchLikeCount(condimentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('likes')
    .select('*', { count: 'exact', head: true })
    .eq('condiment_id', condimentId);
  if (error) throw error;
  return count ?? 0;
}

// ===== ブックマーク =====

export async function fetchBookmarkedIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('bookmarks')
    .select('condiment_id')
    .eq('user_id', userId);
  if (error) throw error;
  return (data ?? []).map((r) => r.condiment_id);
}

export async function toggleBookmark(userId: string, condimentId: string, bookmarked: boolean) {
  if (bookmarked) {
    const { error } = await supabase.from('bookmarks').delete()
      .eq('user_id', userId).eq('condiment_id', condimentId);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('bookmarks').insert({ user_id: userId, condiment_id: condimentId });
    if (error) throw error;
  }
}

export async function fetchAllLikeCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('likes')
    .select('condiment_id');
  if (error) throw error;
  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    counts[row.condiment_id] = (counts[row.condiment_id] ?? 0) + 1;
  }
  return counts;
}
