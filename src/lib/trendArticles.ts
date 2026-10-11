// トレンド欄に表示する「運営からのお知らせ」記事の読み書き。
// テーブルは supabase_add_trend_articles.sql で作成する。

import { supabase } from './supabase';

export interface TrendArticle {
  id: string;
  title: string;
  body: string;
  imageUrl: string | null;
  linkUrl: string | null;
  pdfUrl: string | null;
  published: boolean;
  createdAt: string;
}

export interface TrendArticleInput {
  title: string;
  body: string;
  imageUrl?: string | null;
  linkUrl?: string | null;
  pdfUrl?: string | null;
  published: boolean;
}

// 「テーブルが存在しない」ことを示すエラーコード。
// SQL をまだ実行していない状態を、通常のエラーと区別するために使う。
//   42P01   … PostgreSQL が直接返すコード
//   PGRST205 … Supabase（PostgREST）がスキーマキャッシュに見つけられなかった場合。
//              supabase-js 経由では通常こちらが返る。
const TABLE_MISSING_CODES = ['42P01', 'PGRST205'];

export function isTableMissing(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: string }).code;
  return code !== undefined && TABLE_MISSING_CODES.includes(code);
}

// PGRST204 … 列がスキーマキャッシュに無い。pdf_url を追加する SQL が
//            未実行の状態を見分けるために使う。
export function isColumnMissing(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  return (error as { code?: string }).code === 'PGRST204';
}

// 23502 … NOT NULL 違反、23514 … CHECK 違反。
// 本文を任意にする SQL が未実行のまま本文を空で保存しようとした場合に出る。
export function isBodyRequiredInDb(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) return false;
  const code = (error as { code?: string }).code;
  return code === '23502' || code === '23514';
}

function rowToArticle(row: any): TrendArticle {
  return {
    id: row.id,
    title: row.title,
    // 本文は任意。未入力の記事は DB 上 NULL になる。
    body: row.body ?? '',
    imageUrl: row.image_url ?? null,
    linkUrl: row.link_url ?? null,
    pdfUrl: row.pdf_url ?? null,
    published: row.published,
    createdAt: row.created_at,
  };
}

function inputToRow(input: TrendArticleInput) {
  return {
    title: input.title.trim(),
    body: input.body.trim() || null,
    // 空文字は NULL として保存する（画像なし・リンクなしを区別するため）
    image_url: input.imageUrl?.trim() || null,
    link_url: input.linkUrl?.trim() || null,
    pdf_url: input.pdfUrl?.trim() || null,
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
