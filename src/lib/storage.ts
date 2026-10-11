import { supabase } from './supabase';

const BUCKET = 'condiment-images';

export async function uploadCondimentImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split('.').pop();
  const fileName = `${userId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

// 添付できるファイルの上限サイズ
export const MAX_PDF_BYTES = 10 * 1024 * 1024;   // 10MB
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;  // 5MB

/**
 * 運営のお知らせ記事に添付するファイルをアップロードし、公開URLを返す。
 *
 * 保存先は既存の condiment-images バケット。新しいバケットを作るとポリシーの
 * 追加実行が必要になるため、条件（公開読み取り・ログイン済みのみ書き込み）が
 * 同じ既存バケットを再利用している。
 * 削除ポリシーが「先頭フォルダ＝ユーザーID」を要求するので、必ず <userId>/ 配下に置く。
 */
async function uploadArticleFile(file: File, extension: string): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('ログインが必要です');

  const fileName = `${user.id}/articles/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from(BUCKET).upload(fileName, file, {
    cacheControl: '3600',
    upsert: false,
    contentType: file.type,
  });
  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}

export async function uploadArticlePdf(file: File): Promise<string> {
  if (file.type !== 'application/pdf') {
    throw new Error('PDFファイルを選んでください');
  }
  if (file.size > MAX_PDF_BYTES) {
    throw new Error('PDFは10MBまでです');
  }
  return uploadArticleFile(file, 'pdf');
}

export async function uploadArticleImage(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('画像ファイルを選んでください');
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error('画像は5MBまでです');
  }
  const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  return uploadArticleFile(file, extension);
}

export async function deleteCondimentImage(imageUrl: string) {
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split(`/object/public/${BUCKET}/`);
  if (pathParts.length < 2) return;
  const filePath = pathParts[1];
  await supabase.storage.from(BUCKET).remove([filePath]);
}
