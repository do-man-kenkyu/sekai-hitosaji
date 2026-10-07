// 一定時間操作が無かったら自動ログアウトするための仕組み。
//
// 最終操作時刻を localStorage に持つことで、タブを閉じている間に時間切れになった
// 場合も、次に開いた時点でログアウトできる（タイマーだけだと復帰時に判定できない）。

import { useEffect, useRef } from 'react';

const STORAGE_KEY = 'lastActivityAt';

// 無操作でログアウトするまでの時間（1時間）
export const IDLE_LIMIT_MS = 60 * 60 * 1000;

// 時間切れを調べる間隔。1分ごとなので、実際のログアウトは最大1分ほど遅れる。
const CHECK_INTERVAL_MS = 60 * 1000;

// 「操作した」とみなすイベント
const ACTIVITY_EVENTS = ['pointerdown', 'keydown', 'scroll', 'touchstart'] as const;

// scroll は連続して大量に発生するため、この間隔より短い書き込みは間引く。
// 判定が最大10秒ずれるだけなので、1時間の猶予に対しては誤差。
const WRITE_THROTTLE_MS = 10 * 1000;
let lastWriteAt = 0;

// 最終操作時刻を今に更新する。ログイン直後にも呼ぶ。
export function markActivity(): void {
  const now = Date.now();
  if (now - lastWriteAt < WRITE_THROTTLE_MS) return;
  lastWriteAt = now;
  try {
    localStorage.setItem(STORAGE_KEY, String(now));
  } catch {
    // プライベートモード等で書けなくても、画面上の動作には影響させない
  }
}

export function clearActivity(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 同上
  }
}

function readLastActivity(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = Number(raw);
    return Number.isFinite(value) && value > 0 ? value : null;
  } catch {
    return null;
  }
}

/**
 * enabled が true の間だけ無操作を監視し、時間切れで onIdle を呼ぶ。
 * onIdle は毎回最新のものを参照するので、依存配列に入れる必要はない。
 */
export function useIdleLogout(enabled: boolean, onIdle: () => void): void {
  const onIdleRef = useRef(onIdle);
  onIdleRef.current = onIdle;

  useEffect(() => {
    if (!enabled) return;

    // 記録が無い場合（初回など）は、ここを起点にする
    if (readLastActivity() === null) markActivity();

    const check = () => {
      const last = readLastActivity();
      if (last !== null && Date.now() - last >= IDLE_LIMIT_MS) {
        onIdleRef.current();
      }
    };

    // タブを閉じている間に時間切れになっていた場合、開いた時点でログアウトさせる
    check();

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') check();
    };

    ACTIVITY_EVENTS.forEach(event =>
      window.addEventListener(event, markActivity, { passive: true })
    );
    document.addEventListener('visibilitychange', handleVisibility);
    const timer = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      ACTIVITY_EVENTS.forEach(event => window.removeEventListener(event, markActivity));
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(timer);
    };
  }, [enabled]);
}
