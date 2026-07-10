import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User as UserIcon, Sparkles, ExternalLink, AlertCircle } from 'lucide-react';
import { Condiment } from '../types';
import { Language } from '../i18n/translations';

interface ChatPageProps {
  onClose: () => void;
  language: Language;
  condiments: Condiment[];
  onViewCondiment?: (condiment: Condiment) => void;
}

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  relatedCondiments?: Condiment[];
  error?: boolean;
}

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_BASE = 'https://generativelanguage.googleapis.com';

// 試すモデルの優先順位。無料枠が残りやすい軽量・旧世代モデルを先に試す。
// 1つが枠切れ（quota/429）でも、順に次のモデルへ自動フォールバックする。
const MODEL_CANDIDATES = [
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash',
  'gemini-1.5-flash-latest',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.5-flash',
  'gemini-1.5-pro',
];

// 一度成功したモデルURLを覚えておく
let workingModelUrl: string | null = null;

// このキーで実際に呼べるモデルURLの候補リストを作る（新しい順に試す用）
async function getCandidateUrls(): Promise<string[]> {
  const urls: string[] = [];
  for (const apiVer of ['v1beta', 'v1']) {
    try {
      const res = await fetch(`${GEMINI_BASE}/${apiVer}/models?key=${GEMINI_API_KEY}`);
      if (!res.ok) continue;
      const data = await res.json();
      const available: string[] = (data.models ?? [])
        .map((m: { name: string }) => m.name.replace('models/', ''))
        .filter((n: string) => n.includes('gemini'));
      // 優先候補のうち、利用可能なものを順に追加
      for (const pref of MODEL_CANDIDATES) {
        if (available.includes(pref)) {
          urls.push(`${GEMINI_BASE}/${apiVer}/models/${pref}:generateContent?key=${GEMINI_API_KEY}`);
        }
      }
      // 優先候補に無くても、残りの利用可能モデルも末尾に追加
      for (const m of available) {
        const u = `${GEMINI_BASE}/${apiVer}/models/${m}:generateContent?key=${GEMINI_API_KEY}`;
        if (!urls.includes(u)) urls.push(u);
      }
      if (urls.length > 0) return urls;
    } catch {
      // 次のAPIバージョンを試す
    }
  }
  throw new Error('利用可能なGeminiモデルが見つかりませんでした。APIキーを確認してください。');
}

const TASTE_LABELS: Record<string, string> = {
  sweetness: '甘味', sourness: '酸味', bitterness: '苦味',
  umami: '旨味', saltiness: '塩味', richness: '濃厚さ', aroma: '香り',
};

const suggestedQuestions = {
  ja: [
    'みどりのラー油に合う料理は？',
    '卵かけご飯におすすめの醤油は？',
    '旨味が強い調味料を教えて',
    '辛い調味料をおすすめして',
    '発酵調味料の使い方を教えて',
    'サイトの調味料一覧を見せて',
  ],
  en: [
    'What dishes go with green chili oil?',
    'Recommend a soy sauce for TKG',
    'Recommend a spicy condiment',
    'What condiments have strong umami?',
  ],
};

function buildSystemPrompt(condiments: Condiment[], language: Language): string {
  const condimentList = condiments.map(c => {
    const topTastes = Object.entries(c.tasteProfile)
      .filter(([, v]) => v >= 3)
      .sort(([, a], [, b]) => b - a)
      .map(([k, v]) => `${TASTE_LABELS[k]}:${v}/5`)
      .join('、');
    return `・${c.name}（${c.category}／${c.origin}）— ${c.description.slice(0, 80)}… おすすめ料理: ${c.recommendedDishes.join('、')} 味: ${topTastes}`;
  }).join('\n');

  if (language === 'ja') {
    return `あなたは「世界のひとさじ」という調味料コミュニティサイトの専門AIアシスタントです。
ユーザーからの調味料に関する質問に、親しみやすく丁寧に日本語で答えてください。

【サイト掲載調味料一覧】
${condimentList}

【回答ルール】
- サイト掲載の調味料が質問に関連する場合は優先的に紹介してください
- 回答は200字以内を目安に簡潔に
- 絵文字を適度に使って親しみやすく
- 掲載外の調味料についても幅広く答えてOK
- 掲載調味料を紹介するときは名前を正確に書いてください（カードを自動表示します）`;
  }
  return `You are the AI assistant for "A Spoonful of the World", a condiment community site.
Answer questions about condiments in a friendly, helpful tone in English.

[Site condiments]
${condimentList}

[Rules]
- Prioritize site condiments when relevant
- Keep responses concise (under 150 words)
- Use emoji occasionally
- You may answer about condiments not on the site too
- When mentioning a site condiment, use its exact name (cards will auto-display)`;
}

async function tryModel(url: string, prompt: string, systemPrompt: string): Promise<{ ok: boolean; text?: string; quota?: boolean; message?: string }> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\nユーザーの質問: ${prompt}` }] }],
      generationConfig: { maxOutputTokens: 512, temperature: 0.7 },
    }),
  });
  if (res.ok) {
    const data = await res.json();
    return { ok: true, text: data.candidates?.[0]?.content?.parts?.[0]?.text ?? '回答を取得できませんでした。' };
  }
  const err = await res.json().catch(() => ({}));
  const message = err?.error?.message || `HTTP ${res.status}`;
  // 429 / RESOURCE_EXHAUSTED は枠切れ → 次のモデルへ
  const quota = res.status === 429 || /quota|exhausted|limit/i.test(message);
  return { ok: false, quota, message };
}

async function callGemini(prompt: string, systemPrompt: string): Promise<string> {
  // 前回成功したモデルがあればまずそれを試す
  if (workingModelUrl) {
    const r = await tryModel(workingModelUrl, prompt, systemPrompt);
    if (r.ok) return r.text!;
    workingModelUrl = null; // ダメなら再探索
  }

  const candidates = await getCandidateUrls();
  let lastMessage = '';
  for (const url of candidates) {
    const modelName = url.split('/models/')[1]?.split(':')[0] ?? '?';
    const r = await tryModel(url, prompt, systemPrompt);
    if (r.ok) {
      workingModelUrl = url;
      console.log(`[Gemini] using model: ${modelName}`);
      return r.text!;
    }
    lastMessage = r.message || '';
    console.warn(`[Gemini] ${modelName} 失敗（${r.quota ? '枠切れ' : 'エラー'}）: ${lastMessage}`);
    // 枠切れ以外の致命的エラー（無効キー等）なら即中断
    if (!r.quota && /API key|invalid|permission|PERMISSION/i.test(lastMessage)) {
      throw new Error(lastMessage);
    }
    // それ以外（枠切れ含む）は次のモデルへ
  }
  throw new Error(`すべてのモデルで失敗しました。最後のエラー: ${lastMessage}`);
}

function findRelatedCondiments(responseText: string, condiments: Condiment[]): Condiment[] {
  return condiments.filter(c => responseText.includes(c.name)).slice(0, 3);
}

export function ChatPage({ onClose, language, condiments, onViewCondiment }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([{
    id: '0',
    text: language === 'ja'
      ? 'こんにちは！「世界のひとさじ」専門AIアシスタントです🌏\n\nサイト掲載の調味料について詳しくお答えし、関連ページへご案内します。調味料全般についても何でも聞いてください！'
      : 'Hi! I\'m the AI assistant for "A Spoonful of the World" 🌏\n\nAsk me anything about condiments on the site or condiments in general!',
    sender: 'bot',
    timestamp: new Date(),
  }]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const systemPrompt = buildSystemPrompt(condiments, language);
  const apiKeyMissing = !GEMINI_API_KEY || GEMINI_API_KEY.length < 10;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsTyping(true);

    try {
      const responseText = await callGemini(messageText, systemPrompt);
      const relatedCondiments = findRelatedCondiments(responseText, condiments);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: responseText,
        sender: 'bot',
        timestamp: new Date(),
        relatedCondiments,
      }]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        text: language === 'ja'
          ? `エラーが発生しました: ${msg}\n\nAPIキーを確認してください。`
          : `Error: ${msg}\n\nPlease check your API key.`,
        sender: 'bot',
        timestamp: new Date(),
        error: true,
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center z-50">
      <div className="bg-[#faf7f2] w-full max-w-md h-[92vh] flex flex-col rounded-t-2xl shadow-2xl border-t border-[#e2d5c0]">

        {/* Header */}
        <div className="bg-[#3d1f00] px-4 py-3 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c17f3a] rounded-full flex items-center justify-center shadow">
              <Bot size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {language === 'ja' ? '調味料AIアシスタント' : 'Condiment AI Assistant'}
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#c17f3a] rounded-full animate-pulse" />
                <p className="text-[10px] text-[#e8d5b0]">Powered by Gemini</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* API key warning */}
        {apiKeyMissing && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
            <AlertCircle size={14} className="text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-700">
              {language === 'ja'
                ? '.env に VITE_GEMINI_API_KEY を設定してください'
                : 'Set VITE_GEMINI_API_KEY in .env to enable AI'}
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#faf7f2]">
          {messages.map((message) => (
            <div key={message.id} className={`flex gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${
                message.sender === 'user' ? 'bg-[#7c4a1e]' : 'bg-[#3d1f00]'
              }`}>
                {message.sender === 'user'
                  ? <UserIcon size={14} className="text-white" />
                  : <Bot size={14} className="text-[#c17f3a]" />}
              </div>
              <div className={`flex-1 max-w-[88%] ${message.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div className={`px-3.5 py-2.5 rounded-2xl shadow-sm ${
                  message.sender === 'user'
                    ? 'bg-[#7c4a1e] text-white rounded-tr-sm'
                    : message.error
                      ? 'bg-red-50 border border-red-200 rounded-tl-sm'
                      : 'bg-white border border-[#e2d5c0] rounded-tl-sm'
                }`}>
                  <p className={`text-sm whitespace-pre-wrap leading-relaxed ${
                    message.sender === 'bot' && !message.error ? 'text-[#3d1f00]' : ''
                  } ${message.error ? 'text-red-700' : ''}`}>
                    {message.text}
                  </p>

                  {/* Related condiment cards */}
                  {message.relatedCondiments && message.relatedCondiments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-bold text-[#c17f3a] mb-1.5">
                        📚 {language === 'ja' ? 'サイトの調味料ページへ' : 'View on site'}
                      </p>
                      {message.relatedCondiments.map(condiment => (
                        <div
                          key={condiment.id}
                          onClick={() => { onViewCondiment?.(condiment); onClose(); }}
                          className="bg-[#fdf5ea] border border-[#e8d5b0] rounded-xl p-2.5 cursor-pointer hover:bg-[#f5ede0] hover:border-[#c17f3a] transition-all group"
                        >
                          <div className="flex gap-2.5">
                            {condiment.imageUrl && (
                              <img src={condiment.imageUrl} alt={condiment.name} className="w-14 h-14 object-contain rounded-lg flex-shrink-0 bg-white p-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-1">
                                <h4 className="font-bold text-[#3d1f00] text-sm">{condiment.name}</h4>
                                <ExternalLink size={12} className="text-[#c17f3a] flex-shrink-0 opacity-60 group-hover:opacity-100" />
                              </div>
                              <span className="inline-block px-1.5 py-0.5 bg-white border border-[#e2d5c0] text-[#7c4a1e] text-[10px] rounded mt-0.5">
                                {condiment.category}
                              </span>
                              <p className="text-[11px] text-[#5c3d20] mt-1 line-clamp-2 leading-snug">{condiment.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] text-[#c17f3a] font-bold">★ {condiment.repeatRating}/5</span>
                                <span className="text-[10px] text-[#a07850]">{condiment.origin}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-[10px] mt-1 text-[#a07850]">
                  {message.timestamp.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-[#3d1f00] flex items-center justify-center shadow-sm">
                <Bot size={14} className="text-[#c17f3a]" />
              </div>
              <div className="bg-white border border-[#e2d5c0] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1.5 items-center h-4">
                  {[0, 150, 300].map(delay => (
                    <span key={delay} className="w-2 h-2 bg-[#c17f3a] rounded-full animate-bounce" style={{ animationDelay: `${delay}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggested questions */}
        <div className="border-t border-[#e2d5c0] bg-[#faf7f2] flex-shrink-0">
          <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            <Sparkles size={13} className="text-[#c17f3a] flex-shrink-0 mt-1" />
            {suggestedQuestions[language === 'ja' ? 'ja' : 'en'].map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                disabled={isTyping}
                className="flex-shrink-0 px-2.5 py-1 bg-[#f5ede0] hover:bg-[#fdf5ea] text-[#7c4a1e] hover:text-[#3d1f00] text-xs rounded-full transition-colors border border-[#e2d5c0] hover:border-[#c17f3a] disabled:opacity-40"
              >
                {q}
              </button>
            ))}
          </div>
          <div className="flex gap-2 px-3 pb-4 pt-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping}
              placeholder={language === 'ja' ? '調味料について質問してください...' : 'Ask about condiments...'}
              className="flex-1 px-3.5 py-2.5 border border-[#e2d5c0] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c17f3a] bg-white text-[#3d1f00] text-sm placeholder-[#a07850] disabled:opacity-60"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim() || isTyping}
              className="px-3.5 py-2.5 bg-[#7c4a1e] text-white rounded-xl hover:bg-[#3d1f00] transition-colors flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
