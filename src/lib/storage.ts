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

export async function deleteCondimentImage(imageUrl: string) {
  const url = new URL(imageUrl);
  const pathParts = url.pathname.split(`/object/public/${BUCKET}/`);
  if (pathParts.length < 2) return;
  const filePath = pathParts[1];
  await supabase.storage.from(BUCKET).remove([filePath]);
}
