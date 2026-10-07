// AIチャットの履歴を sessionStorage に保持するユーティリティ。
//
// 保存先を sessionStorage にしているのは意図的：
//   - Supabase（サーバー）には一切送らないので、DB 容量も転送量も増えない
//   - ブラウザのタブを閉じた時点で自動的に消える
//   - ログアウト時は clearChatHistory() で明示的に消す
//   - 端末を共有していても、別タブ・別ウィンドウに履歴が漏れない
// 保存するのは本文と関連調味料の id だけで、調味料オブジェクト自体は持たない。

import type { ChatMessage } from './types';

const STORAGE_KEY = 'chatHistory';

// 保持する最大メッセージ数。これを超えたら古いものから捨てる。
// 1メッセージ数百バイト程度なので、100件でも概ね数十KBに収まる。
const MAX_MESSAGES = 100;

// sessionStorage に入れる形（Date は JSON にできないので文字列にする）
interface StoredMessage extends Omit<ChatMessage, 'timestamp'> {
  timestamp: string;
}

export function loadChatHistory(): ChatMessage[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const stored = JSON.parse(raw) as StoredMessage[];
    if (!Array.isArray(stored)) return [];
    return stored.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
  } catch (e) {
    console.error('チャット履歴の読み込みに失敗', e);
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  try {
    const trimmed: StoredMessage[] = messages
      .slice(-MAX_MESSAGES)
      .map(m => ({ ...m, timestamp: m.timestamp.toISOString() }));
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  } catch (e) {
    // 容量超過などで失敗しても、画面上の履歴はそのまま使えるので握りつぶす
    console.error('チャット履歴の保存に失敗', e);
  }
}

export function clearChatHistory(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('チャット履歴の削除に失敗', e);
  }
}
