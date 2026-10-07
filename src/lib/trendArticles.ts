// トレンド欄に表示する「運営からのお知らせ」記事の読み書き。
// テーブルは supabase_add_trend_articles.sql で作成する。

import { supabase } from './supabase';

export interface TrendArticle {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  published: boolean;
  createdAt: string;
}

export interface TrendArticleInput {
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  published: boolean;
}

// PostgreSQL の「テーブルが存在しない」エラーコード。
// SQL をまだ実行していない状態を、通常のエラーと区別するために使う。
const UNDEFINED_TABLE = '42P01';

export function isTableMissing(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: string }).code === UNDEFINED_TABLE;
}

function rowToArticle(row: any): TrendArticle {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    imageUrl: row.image_url ?? null,
    linkUrl: row.link_url ?? null,
    published: row.published,
    createdAt: row.created_at,
  };
}

function inputToRow(input: TrendArticleInput) {
  return {
    title: input.title.trim(),
    body: input.body.trim(),
    // 空文字は NULL として保存する（画像なし・リンクなしを区別するため）
    image_url: input.imageUrl?.trim() || null,
    link_url: input.linkUrl?.trim() || null,
    published: input.published,
  };
}

/**
 * 記事を新しい順に取得する。
 * RLS により、一般の閲覧者には公開中のものだけが返る。
 * テーブルが未作成の場合は空配列を返す（サイト側を壊さないため）。
 */
export async function fetchTrendArticles(): Promise<TrendArticle[]> {
  const { data, error } = await supabase
    .from('trend_articles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    if (isTableMissing(error)) {
      console.warn('trend_articles テーブルが未作成です。supabase_add_trend_articles.sql を実行してください。');
      return [];
    }
    throw error;
  }
  return (data ?? []).map(rowToArticle);
}

export async function insertTrendArticle(input: TrendArticleInput): Promise<TrendArticle> {
  const { data, error } = await supabase
    .from('trend_articles')
    .insert(inputToRow(input))
    .select('*')
    .single();
  if (error) throw error;
  return rowToArticle(data);
}

export async function updateTrendArticle(id: string, input: TrendArticleInput): Promise<TrendArticle> {
  const { data, error } = await supabase
    .from('trend_articles')
    .update({ ...inputToRow(input), updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single();
  if (error) throw error;
  return rowToArticle(data);
}

export async function deleteTrendArticle(id: string): Promise<void> {
  const { error } = await supabase.from('trend_articles').delete().eq('id', id);
  if (error) throw error;
}
