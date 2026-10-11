import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Language, t } from '../i18n/translations';

// 1記事あたりに画面へ描画する最大ページ数。
// これを超える分は「PDFを開く」リンクから読んでもらう（端末が重くなるのを防ぐ）。
const MAX_PAGES = 10;

// pdf.js は Promise.withResolvers を使うが、iOS 17.3 以前の Safari には存在しない。
// pdf.js を読み込む前に補っておく。
function ensureWithResolvers() {
  const P = Promise as unknown as { withResolvers?: unknown };
  if (typeof P.withResolvers === 'function') return;
  P.withResolvers = function <T>() {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
    return { promise, resolve, reject };
  };
}

interface Props {
  url: string;
  language: Language;
}

/**
 * PDFの中身をその場に描画する。
 *
 * iOS Safari は iframe に PDF を入れても1ページ目しか表示されずスクロールも
 * できないため、pdf.js で各ページを画像に変換して並べている。
 * pdf.js は動的 import にしてあるので、PDF付きの記事を見たときだけ読み込まれる。
 */
export function PdfInline({ url, language }: Props) {
  const [pageImages, setPageImages] = useState<string[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setStatus('loading');
      setPageImages([]);
      setTotalPages(0);

      try {
        ensureWithResolvers();
        const pdfjs = await import('pdfjs-dist');
        const workerUrl = (await import('pdfjs-dist/build/pdf.worker.mjs?url')).default;
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

        const doc = await pdfjs.getDocument({ url }).promise;
        if (cancelled) return;
        setTotalPages(doc.numPages);

        const limit = Math.min(doc.numPages, MAX_PAGES);
        const images: string[] = [];

        for (let pageNumber = 1; pageNumber <= limit; pageNumber++) {
          const page = await doc.getPage(pageNumber);
          const base = page.getViewport({ scale: 1 });
          // 横900px相当で描画する。スマホで指で拡大しても文字が潰れない程度。
          const scale = Math.min(2, 900 / base.width);
          const viewport = page.getViewport({ scale });

          const canvas = document.createElement('canvas');
          canvas.width = Math.ceil(viewport.width);
          canvas.height = Math.ceil(viewport.height);
          const canvasContext = canvas.getContext('2d');
          if (!canvasContext) throw new Error('canvas を使えません');

          await page.render({ canvas, canvasContext, viewport }).promise;
          if (cancelled) return;

          images.push(canvas.toDataURL('image/jpeg', 0.8));
          // 1ページずつ表示して、読み込みの待ち時間を感じにくくする
          setPageImages([...images]);
        }

        if (!cancelled) setStatus('ready');
      } catch (e) {
        console.error('PDFの表示に失敗しました', e);
        if (!cancelled) setStatus('error');
      }
    })();

    return () => { cancelled = true; };
  }, [url]);

  // 表示できなかった場合は何も出さない。呼び出し側に「PDFを開く」リンクが
  // 常にあるので、そちらから読んでもらう。
  if (status === 'error') {
    return (
      <p className="mt-2 text-xs text-[#a07850]">{t(language, 'pdfLoadError')}</p>
    );
  }

  return (
    <div className="mt-3">
      {pageImages.map((src, index) => (
        <img
          key={index}
          src={src}
          alt={`${index + 1}`}
          className="w-full rounded-lg border border-[#e2d5c0] mb-2 bg-white"
        />
      ))}

      {status === 'loading' && (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-[#a07850]">
          <Loader2 size={14} className="animate-spin" />
          {t(language, 'pdfLoading')}
        </div>
      )}

      {status === 'ready' && totalPages > MAX_PAGES && (
        <p className="text-xs text-[#a07850] text-center py-2">
          {t(language, 'pdfMorePages', { n: totalPages - MAX_PAGES })}
        </p>
      )}
    </div>
  );
}
