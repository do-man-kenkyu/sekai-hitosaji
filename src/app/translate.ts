// ユーザーが書いた文章（コメントなど）をその場で翻訳するための共通処理。
// Google 翻訳の非公式エンドポイントを使う。App.tsx の調味料データ翻訳と同じ仕組み。
//
// 同じ文を何度も投げないよう、ページを開いている間はモジュール内にキャッシュする。

const cache = new Map<string, string>();

export async function translateText(
  text: string,
  targetLang: string,
  sourceLang = 'ja'
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed || targetLang === sourceLang) return text;

  const cacheKey = `${sourceLang}>${targetLang}:${trimmed}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const url =
      `https://translate.googleapis.com/translate_a/single?client=gtx` +
      `&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(trimmed)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (data?.[0]?.[0]?.[0]) {
      const translated = (data[0] as [string][]).map(item => item[0]).join('');
      cache.set(cacheKey, translated);
      return translated;
    }
  } catch (e) {
    console.error('翻訳に失敗しました', e);
  }
  // 失敗したら原文をそのまま返す（画面が空になるより良い）
  return text;
}
