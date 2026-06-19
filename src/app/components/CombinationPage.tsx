import { useState, useMemo } from 'react';
import { X, Plus, Sparkles, ChefHat, RefreshCw } from 'lucide-react';
import { Language } from '../i18n/translations';

interface CombinationPageProps {
  onClose: () => void;
  language: Language;
}

interface CombinationResult {
  name: string;
  description: string;
  uses: string[];
  tips?: string;
  difficulty: '簡単' | '普通' | '少し手間';
}

interface CombinationEntry {
  keys: string[][];  // 複数のキーワードペア（OR条件）
  result: CombinationResult;
}

const CONDIMENT_OPTIONS = [
  'マヨネーズ', 'ケチャップ', '醤油', 'みりん', '酢', '砂糖', '塩', '味噌',
  'ごま油', 'オリーブオイル', 'バター', 'バルサミコ酢', 'ウスターソース',
  '豆板醤', 'コチュジャン', 'ナンプラー', '一味唐辛子', '七味唐辛子',
  '白だし', 'めんつゆ', '塩麹', 'オイスターソース', '黒酢', 'りんご酢',
  'ラー油', 'からし', 'わさび', 'ポン酢',
];

const COMBINATIONS: CombinationEntry[] = [
  {
    keys: [['マヨネーズ', 'ケチャップ']],
    result: {
      name: 'オーロラソース',
      description: 'マヨネーズのコクとケチャップの甘酸っぱさが合わさった定番ソース。',
      uses: ['エビフライ', 'フライドポテト', 'ハンバーガー', 'サラダ', '海老カクテル'],
      tips: '比率はマヨ2：ケチャップ1が基本。レモン汁を少し加えるとさっぱりします。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['醤油', 'みりん'], ['醤油', 'みりん', '砂糖']],
    result: {
      name: '照り焼きソース',
      description: '甘辛い日本の万能ソース。煮詰めることで照りが出て料理を格上げします。',
      uses: ['照り焼きチキン', 'ぶりの照り焼き', '照り焼きハンバーグ', '焼き豆腐'],
      tips: '醤油：みりん：砂糖 = 2:2:1が基本。酒を加えるとより本格的に。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['醤油', 'バター']],
    result: {
      name: '醤油バターソース',
      description: '醤油の旨みとバターのコクが絶妙にマッチ。和洋折衷の万能ソース。',
      uses: ['きのこパスタ', 'コーンバター醤油', 'ホタテのソテー', 'ご飯のお供'],
      tips: 'バターを溶かしてから醤油を加え、さっと和えるのがコツ。焦がさないよう注意。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['味噌', 'バター']],
    result: {
      name: '味噌バター',
      description: '発酵の旨みとバターの豊かさが合わさったコク深いソース。',
      uses: ['味噌バターラーメン', 'コーン味噌バター', '野菜炒め', 'トースト'],
      tips: '味噌の塩分があるので塩は控えめに。にんにくを加えると風味アップ。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['醤油', 'ごま油', '酢'], ['醤油', 'ごま油']],
    result: {
      name: '中華ドレッシング',
      description: 'ごま油の香りと醤油のコクが効いたさっぱりドレッシング。',
      uses: ['中華サラダ', 'きゅうりの和え物', '棒棒鶏', 'ゴーヤチャンプルー'],
      tips: '醤油:酢:ごま油 = 2:1:1。砂糖少々と生姜を加えると本格的に。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['味噌', 'みりん', '砂糖'], ['味噌', '砂糖']],
    result: {
      name: '田楽味噌',
      description: '甘みのある濃厚な味噌だれ。焼いた食材に塗るだけで本格的な一品に。',
      uses: ['豆腐田楽', 'こんにゃく田楽', '茄子田楽', '焼きおにぎり'],
      tips: '火にかけながら練り混ぜるとツヤが出る。白ごまを加えると香りUP。',
      difficulty: '普通',
    },
  },
  {
    keys: [['ケチャップ', 'ウスターソース']],
    result: {
      name: '洋食ソース（デミグラス風）',
      description: 'ケチャップの甘みとウスターの酸味・スパイス感が合わさった洋食の定番ソース。',
      uses: ['オムライス', 'ハンバーグ', 'チキンライス', 'ナポリタン'],
      tips: 'ケチャップ2：ウスター1が基本。バターを加えるとコクが増します。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['マヨネーズ', '醤油']],
    result: {
      name: '和風マヨネーズ',
      description: '洋のマヨと和の醤油の組み合わせ。サラダから海鮮まで幅広く使える。',
      uses: ['和風サラダ', '海鮮丼のたれ', 'きゅうり和え', 'たこ焼きのトッピング'],
      tips: 'マヨ3：醤油1が基本。わさびを少し加えると大人の味に。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['バルサミコ酢', 'オリーブオイル']],
    result: {
      name: 'バルサミコドレッシング',
      description: '甘酸っぱいバルサミコとフルーティーなオリーブオイルの本格ドレッシング。',
      uses: ['カプレーゼ', 'グリル野菜サラダ', 'ルッコラサラダ', 'カルパッチョ'],
      tips: 'バルサミコ1：オリーブオイル2〜3の比率で。塩・黒胡椒で味を整える。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['酢', '砂糖', '醤油'], ['酢', '砂糖']],
    result: {
      name: '甘酢あん',
      description: '酸味と甘みのバランスが良い中華の定番ソース。とろみをつけると本格的。',
      uses: ['酢豚', '南蛮漬け', '唐揚げの甘酢あん', '魚の甘酢あんかけ'],
      tips: '酢:砂糖:醤油 = 3:2:2。片栗粉でとろみをつけると本格的。',
      difficulty: '普通',
    },
  },
  {
    keys: [['コチュジャン', 'ごま油'], ['コチュジャン', '醤油', 'ごま油']],
    result: {
      name: 'ビビンバダレ',
      description: '甘辛いコチュジャンにごま油の香りが加わった韓国料理の定番ソース。',
      uses: ['ビビンバ', '野菜のナムル和え', '冷奴', '豚しゃぶサラダ'],
      tips: 'コチュジャン2：ごま油1：砂糖少々。にんにくを加えると本格的に。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['豆板醤', 'ごま油'], ['豆板醤', '醤油']],
    result: {
      name: '担々ソース',
      description: '辛みと旨みが凝縮した中国・四川風のスパイシーソース。',
      uses: ['担々麺のたれ', '麻婆豆腐', '辛い炒め物', 'スパイシーな冷奴'],
      tips: '芝麻醤（ねりごま）を加えると本格的な担々麺のたれに。',
      difficulty: '普通',
    },
  },
  {
    keys: [['ナンプラー', '酢', '砂糖'], ['ナンプラー', '砂糖']],
    result: {
      name: 'タイ風ナンプラーソース',
      description: '魚醤の旨みと甘酸っぱさが融合したエスニックな万能ソース。',
      uses: ['パパイヤサラダ', 'ガパオライス', '生春巻きのたれ', 'タイ風炒め物'],
      tips: 'ナンプラー:酢:砂糖 = 2:1:1。唐辛子とライムを加えると本格的。',
      difficulty: '普通',
    },
  },
  {
    keys: [['ごま油', '塩'], ['ごま油', '塩', '醤油']],
    result: {
      name: 'ナムルのたれ',
      description: 'ごま油の香ばしさと塩のシンプルな旨みの韓国風和え調味料。',
      uses: ['ほうれん草ナムル', 'もやしナムル', '人参ナムル', 'ビビンバの具'],
      tips: 'にんにくのすりおろしと白ごまを加えると本格的に。茹でた野菜に和えるだけ。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['マヨネーズ', 'からし']],
    result: {
      name: 'からし入りマヨネーズ',
      description: 'マヨネーズにからしのピリッとした辛みが加わった大人向けソース。',
      uses: ['ウインナー', '揚げ物全般', 'ポテトサラダ', 'サンドイッチ'],
      tips: '辛さはからしの量で調整。明太子を加えると明太マヨに。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['オリーブオイル', '塩']],
    result: {
      name: '塩オイルソース',
      description: 'シンプルだからこそ素材の味を活かせる、イタリアンの基本ソース。',
      uses: ['アーリオオーリオ', 'サラダ', 'カルパッチョ', 'ブルスケッタ'],
      tips: '質の良いオリーブオイルと塩を選ぶのがポイント。黒胡椒も定番。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['ポン酢', 'ごま油']],
    result: {
      name: 'ごまポン酢',
      description: 'ポン酢のさっぱりさにごま油の香ばしさが加わったごちそうたれ。',
      uses: ['しゃぶしゃぶ', '冷しゃぶ', '蒸し鶏', '水餃子'],
      tips: '白すりごまを加えると風味がアップ。豆腐にかけても美味しい。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['醤油', '酢', 'ごま油', '砂糖']],
    result: {
      name: '棒棒鶏ソース',
      description: '甘辛酸っぱいごまだれ風ソース。蒸し鶏との相性が抜群。',
      uses: ['棒棒鶏', 'ゴマだれうどん', '冷しゃぶ', '冷製パスタ'],
      tips: 'ねりごまがあれば加えると本格的。砂糖でまろやかさを調整して。',
      difficulty: '普通',
    },
  },
  {
    keys: [['白だし', 'みりん'], ['白だし', '醤油']],
    result: {
      name: '和風だしつゆ',
      description: '出汁の旨みが凝縮した、何にでも使える和食の万能つゆ。',
      uses: ['出汁巻き卵', '煮浸し', 'うどんつゆ', '茶碗蒸し'],
      tips: '水で割る比率で用途が変わる。薄めると汁物・濃いめだと煮物向け。',
      difficulty: '簡単',
    },
  },
  {
    keys: [['塩麹', 'ごま油'], ['塩麹', 'オリーブオイル']],
    result: {
      name: '塩麹ドレッシング',
      description: '発酵の旨みと油のコクが合わさった健康的な手作りドレッシング。',
      uses: ['グリーンサラダ', '蒸し野菜', 'カルパッチョ', '豆腐サラダ'],
      tips: '塩麹の塩分があるので塩は不要。レモン汁を加えるとさっぱり。',
      difficulty: '簡単',
    },
  },
];

function findCombination(a: string, b: string): CombinationResult | null {
  if (!a || !b || a === b) return null;
  const selected = [a, b].map(s => s.toLowerCase());

  for (const entry of COMBINATIONS) {
    for (const keySet of entry.keys) {
      const keySetLower = keySet.map(k => k.toLowerCase());
      const matched = keySetLower.every(k => selected.some(s => s.includes(k) || k.includes(s)));
      if (matched) return entry.result;
    }
  }
  return null;
}

function getSuggestionsFor(a: string): { partner: string; result: CombinationResult }[] {
  if (!a) return [];
  const aLower = a.toLowerCase();
  const suggestions: { partner: string; result: CombinationResult }[] = [];
  const seen = new Set<string>();

  for (const entry of COMBINATIONS) {
    for (const keySet of entry.keys) {
      const aMatched = keySet.some(k => aLower.includes(k.toLowerCase()) || k.toLowerCase().includes(aLower));
      if (!aMatched) continue;
      const partners = keySet.filter(k => !aLower.includes(k.toLowerCase()) && !k.toLowerCase().includes(aLower));
      const partnerLabel = partners.join(' + ');
      if (partnerLabel && !seen.has(partnerLabel)) {
        seen.add(partnerLabel);
        suggestions.push({ partner: partnerLabel, result: entry.result });
      }
    }
  }
  return suggestions;
}

const difficultyColor: Record<string, string> = {
  '簡単': 'bg-green-100 text-green-700',
  '普通': 'bg-yellow-100 text-yellow-700',
  '少し手間': 'bg-orange-100 text-orange-700',
};

export function CombinationPage({ onClose, language }: CombinationPageProps) {
  const [condimentA, setCondimentA] = useState('');
  const [condimentB, setCondimentB] = useState('');
  const [searched, setSearched] = useState(false);

  const result = useMemo(() => {
    if (!searched) return null;
    return findCombination(condimentA, condimentB);
  }, [condimentA, condimentB, searched]);

  const suggestions = useMemo(() => {
    if (searched) return [];
    const base = condimentA || condimentB;
    return getSuggestionsFor(base);
  }, [condimentA, condimentB, searched]);

  const handleCombine = () => {
    if (condimentA && condimentB && condimentA !== condimentB) {
      setSearched(true);
    }
  };

  const handleReset = () => {
    setCondimentA('');
    setCondimentB('');
    setSearched(false);
  };

  const optionsA = CONDIMENT_OPTIONS.filter(o => o !== condimentB);
  const optionsB = CONDIMENT_OPTIONS.filter(o => o !== condimentA);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md h-[92vh] flex flex-col rounded-t-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-400 to-pink-500 px-4 py-3 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow">
              <Sparkles size={20} className="text-orange-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {language === 'ja' ? '調味料コンビネーション' : 'Condiment Combinator'}
              </h2>
              <p className="text-xs text-orange-100">
                {language === 'ja' ? '2つを組み合わせて新しいソースを作ろう' : 'Combine two to create something new'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-orange-100 p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Selector */}
          <div className="bg-orange-50 rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3">
              {/* A */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {language === 'ja' ? '調味料①' : 'Condiment A'}
                </label>
                <select
                  value={condimentA}
                  onChange={e => { setCondimentA(e.target.value); setSearched(false); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-orange-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">{language === 'ja' ? '選択してください' : 'Select...'}</option>
                  {optionsA.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              {/* Plus */}
              <div className="flex-shrink-0 mt-5">
                <div className="w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center shadow">
                  <Plus size={18} className="text-white" />
                </div>
              </div>

              {/* B */}
              <div className="flex-1">
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  {language === 'ja' ? '調味料②' : 'Condiment B'}
                </label>
                <select
                  value={condimentB}
                  onChange={e => { setCondimentB(e.target.value); setSearched(false); }}
                  className="w-full px-3 py-2.5 rounded-xl border border-orange-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                >
                  <option value="">{language === 'ja' ? '選択してください' : 'Select...'}</option>
                  {optionsB.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleCombine}
              disabled={!condimentA || !condimentB || condimentA === condimentB}
              className="w-full mt-4 py-3 bg-gradient-to-r from-orange-400 to-pink-500 text-white rounded-xl font-medium hover:from-orange-500 hover:to-pink-600 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              {language === 'ja' ? '✨ 組み合わせる' : '✨ Combine'}
            </button>
          </div>

          {/* 片方選択時の候補 */}
          {suggestions.length > 0 && (
            <div className="mb-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                💡 {language === 'ja'
                  ? `「${condimentA || condimentB}」と合う組み合わせ`
                  : `Combinations with "${condimentA || condimentB}"`}
              </p>
              <div className="space-y-2">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const partner = s.partner.split(' + ')[0];
                      if (condimentA && !condimentB) {
                        setCondimentB(partner);
                      } else {
                        setCondimentA(partner);
                      }
                      setSearched(true);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-orange-100 rounded-xl hover:border-orange-300 hover:bg-orange-50 transition-all text-left shadow-sm"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-orange-400 font-bold flex-shrink-0">+</span>
                      <span className="text-sm font-medium text-gray-800 flex-shrink-0">{s.partner}</span>
                      <span className="text-gray-300 flex-shrink-0 mx-1">→</span>
                      <span className="text-sm text-gray-600 truncate">{s.result.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${difficultyColor[s.result.difficulty]}`}>
                      {s.result.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {searched && result && (
            <div className="bg-white border-2 border-orange-200 rounded-2xl overflow-hidden animate-pulse-once">
              <div className="bg-gradient-to-r from-orange-50 to-pink-50 px-4 py-3 border-b border-orange-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ChefHat size={20} className="text-orange-500" />
                    <span className="text-xs text-orange-600 font-medium">
                      {condimentA} × {condimentB}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${difficultyColor[result.difficulty]}`}>
                    {result.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 mt-1">{result.name}</h3>
              </div>

              <div className="p-4 space-y-4">
                <p className="text-gray-700 text-sm">{result.description}</p>

                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    {language === 'ja' ? '🍽 こんな料理に使えます' : '🍽 Great for'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.uses.map((use, i) => (
                      <span key={i} className="px-2.5 py-1 bg-orange-50 border border-orange-200 text-orange-800 text-xs rounded-full">
                        {use}
                      </span>
                    ))}
                  </div>
                </div>

                {result.tips && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <p className="text-xs font-semibold text-yellow-700 mb-1">💡 {language === 'ja' ? 'コツ・ポイント' : 'Tips'}</p>
                    <p className="text-xs text-yellow-800">{result.tips}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No result */}
          {searched && !result && (
            <div className="bg-gray-50 rounded-2xl p-6 text-center">
              <p className="text-4xl mb-3">🤔</p>
              <p className="font-medium text-gray-700 mb-1">
                {language === 'ja' ? 'この組み合わせはまだ未登録です' : 'This combination is not in our database yet'}
              </p>
              <p className="text-sm text-gray-500">
                {language === 'ja'
                  ? `${condimentA} × ${condimentB} の組み合わせは未登録ですが、試してみると意外な発見があるかも！`
                  : `${condimentA} × ${condimentB} isn't registered, but it might be worth trying!`}
              </p>
            </div>
          )}

          {/* All combinations list */}
          {!searched && (
            <div>
              <p className="text-sm font-semibold text-gray-700 mb-3">
                {language === 'ja' ? '📖 登録済みの組み合わせ例' : '📖 Registered Combinations'}
              </p>
              <div className="space-y-2">
                {COMBINATIONS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const keys = c.keys[0];
                      if (keys.length >= 2) {
                        setCondimentA(keys[0]);
                        setCondimentB(keys[1]);
                        setSearched(true);
                      }
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 bg-white border border-gray-100 rounded-xl hover:border-orange-200 hover:bg-orange-50 transition-all text-left shadow-sm"
                  >
                    <div>
                      <span className="text-sm text-gray-600">{c.keys[0].join(' × ')}</span>
                      <span className="mx-2 text-gray-300">→</span>
                      <span className="text-sm font-medium text-gray-900">{c.result.name}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${difficultyColor[c.result.difficulty]}`}>
                      {c.result.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset button */}
        {searched && (
          <div className="flex-shrink-0 p-4 border-t bg-white">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm font-medium"
            >
              <RefreshCw size={16} />
              {language === 'ja' ? '別の組み合わせを試す' : 'Try another combination'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
