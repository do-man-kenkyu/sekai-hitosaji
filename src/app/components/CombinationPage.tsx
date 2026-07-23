import { useState, useMemo } from 'react';
import { X, Plus, Sparkles, ChefHat, RefreshCw, ChevronLeft } from 'lucide-react';
import { Language, t } from '../i18n/translations';

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
  keys: string[][];
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
  { keys: [['マヨネーズ', 'ケチャップ']], result: { name: 'オーロラソース', description: 'マヨネーズのコクとケチャップの甘酸っぱさが合わさった定番ソース。', uses: ['エビフライ', 'フライドポテト', 'ハンバーガー', 'サラダ'], tips: 'マヨ2：ケチャップ1が基本。レモン汁を少し加えるとさっぱり。', difficulty: '簡単' } },
  { keys: [['醤油', 'みりん'], ['醤油', 'みりん', '砂糖']], result: { name: '照り焼きソース', description: '甘辛い日本の万能ソース。煮詰めることで照りが出て料理を格上げします。', uses: ['照り焼きチキン', 'ぶりの照り焼き', '照り焼きハンバーグ', '焼き豆腐'], tips: '醤油：みりん：砂糖 = 2:2:1が基本。酒を加えるとより本格的に。', difficulty: '簡単' } },
  { keys: [['醤油', 'バター']], result: { name: '醤油バターソース', description: '醤油の旨みとバターのコクが絶妙にマッチ。和洋折衷の万能ソース。', uses: ['きのこパスタ', 'コーンバター醤油', 'ホタテのソテー', 'ご飯のお供'], tips: 'バターを溶かしてから醤油を加え、さっと和えるのがコツ。', difficulty: '簡単' } },
  { keys: [['味噌', 'バター']], result: { name: '味噌バター', description: '発酵の旨みとバターの豊かさが合わさったコク深いソース。', uses: ['味噌バターラーメン', 'コーン味噌バター', '野菜炒め', 'トースト'], tips: '味噌の塩分があるので塩は控えめに。にんにくを加えると風味アップ。', difficulty: '簡単' } },
  { keys: [['醤油', 'ごま油', '酢'], ['醤油', 'ごま油']], result: { name: '中華ドレッシング', description: 'ごま油の香りと醤油のコクが効いたさっぱりドレッシング。', uses: ['中華サラダ', 'きゅうりの和え物', '棒棒鶏', 'ゴーヤチャンプルー'], tips: '醤油:酢:ごま油 = 2:1:1。砂糖少々と生姜を加えると本格的に。', difficulty: '簡単' } },
  { keys: [['味噌', 'みりん', '砂糖'], ['味噌', '砂糖']], result: { name: '田楽味噌', description: '甘みのある濃厚な味噌だれ。焼いた食材に塗るだけで本格的な一品に。', uses: ['豆腐田楽', 'こんにゃく田楽', '茄子田楽', '焼きおにぎり'], tips: '火にかけながら練り混ぜるとツヤが出る。白ごまを加えると香りUP。', difficulty: '普通' } },
  { keys: [['ケチャップ', 'ウスターソース']], result: { name: '洋食ソース', description: 'ケチャップの甘みとウスターの酸味・スパイス感が合わさった洋食の定番ソース。', uses: ['オムライス', 'ハンバーグ', 'チキンライス', 'ナポリタン'], tips: 'ケチャップ2：ウスター1が基本。バターを加えるとコクが増します。', difficulty: '簡単' } },
  { keys: [['マヨネーズ', '醤油']], result: { name: '和風マヨネーズ', description: '洋のマヨと和の醤油の組み合わせ。サラダから海鮮まで幅広く使える。', uses: ['和風サラダ', '海鮮丼のたれ', 'きゅうり和え', 'たこ焼き'], tips: 'マヨ3：醤油1が基本。わさびを少し加えると大人の味に。', difficulty: '簡単' } },
  { keys: [['バルサミコ酢', 'オリーブオイル']], result: { name: 'バルサミコドレッシング', description: '甘酸っぱいバルサミコとフルーティーなオリーブオイルの本格ドレッシング。', uses: ['カプレーゼ', 'グリル野菜サラダ', 'ルッコラサラダ', 'カルパッチョ'], tips: 'バルサミコ1：オリーブオイル2〜3の比率で。塩・黒胡椒で味を整える。', difficulty: '簡単' } },
  { keys: [['酢', '砂糖', '醤油'], ['酢', '砂糖']], result: { name: '甘酢あん', description: '酸味と甘みのバランスが良い中華の定番ソース。', uses: ['酢豚', '南蛮漬け', '唐揚げの甘酢あん', '魚の甘酢あんかけ'], tips: '酢:砂糖:醤油 = 3:2:2。片栗粉でとろみをつけると本格的。', difficulty: '普通' } },
  { keys: [['コチュジャン', 'ごま油'], ['コチュジャン', '醤油', 'ごま油']], result: { name: 'ビビンバダレ', description: '甘辛いコチュジャンにごま油の香りが加わった韓国料理の定番ソース。', uses: ['ビビンバ', '野菜のナムル和え', '冷奴', '豚しゃぶサラダ'], tips: 'コチュジャン2：ごま油1：砂糖少々。にんにくを加えると本格的に。', difficulty: '簡単' } },
  { keys: [['豆板醤', 'ごま油'], ['豆板醤', '醤油']], result: { name: '担々ソース', description: '辛みと旨みが凝縮した中国・四川風のスパイシーソース。', uses: ['担々麺のたれ', '麻婆豆腐', '辛い炒め物', 'スパイシーな冷奴'], tips: '芝麻醤（ねりごま）を加えると本格的な担々麺のたれに。', difficulty: '普通' } },
  { keys: [['ナンプラー', '酢', '砂糖'], ['ナンプラー', '砂糖']], result: { name: 'タイ風ナンプラーソース', description: '魚醤の旨みと甘酸っぱさが融合したエスニックな万能ソース。', uses: ['パパイヤサラダ', 'ガパオライス', '生春巻きのたれ', 'タイ風炒め物'], tips: 'ナンプラー:酢:砂糖 = 2:1:1。唐辛子とライムを加えると本格的。', difficulty: '普通' } },
  { keys: [['ごま油', '塩'], ['ごま油', '塩', '醤油']], result: { name: 'ナムルのたれ', description: 'ごま油の香ばしさと塩のシンプルな旨みの韓国風和え調味料。', uses: ['ほうれん草ナムル', 'もやしナムル', '人参ナムル', 'ビビンバの具'], tips: 'にんにくのすりおろしと白ごまを加えると本格的に。', difficulty: '簡単' } },
  { keys: [['マヨネーズ', 'からし']], result: { name: 'からし入りマヨネーズ', description: 'マヨネーズにからしのピリッとした辛みが加わった大人向けソース。', uses: ['ウインナー', '揚げ物全般', 'ポテトサラダ', 'サンドイッチ'], tips: '辛さはからしの量で調整。明太子を加えると明太マヨに。', difficulty: '簡単' } },
  { keys: [['オリーブオイル', '塩']], result: { name: '塩オイルソース', description: 'シンプルだからこそ素材の味を活かせる、イタリアンの基本ソース。', uses: ['アーリオオーリオ', 'サラダ', 'カルパッチョ', 'ブルスケッタ'], tips: '質の良いオリーブオイルと塩を選ぶのがポイント。黒胡椒も定番。', difficulty: '簡単' } },
  { keys: [['ポン酢', 'ごま油']], result: { name: 'ごまポン酢', description: 'ポン酢のさっぱりさにごま油の香ばしさが加わったごちそうたれ。', uses: ['しゃぶしゃぶ', '冷しゃぶ', '蒸し鶏', '水餃子'], tips: '白すりごまを加えると風味がアップ。', difficulty: '簡単' } },
  { keys: [['白だし', 'みりん'], ['白だし', '醤油']], result: { name: '和風だしつゆ', description: '出汁の旨みが凝縮した、何にでも使える和食の万能つゆ。', uses: ['出汁巻き卵', '煮浸し', 'うどんつゆ', '茶碗蒸し'], tips: '水で割る比率で用途が変わる。薄めると汁物・濃いめだと煮物向け。', difficulty: '簡単' } },
  { keys: [['塩麹', 'ごま油'], ['塩麹', 'オリーブオイル']], result: { name: '塩麹ドレッシング', description: '発酵の旨みと油のコクが合わさった健康的な手作りドレッシング。', uses: ['グリーンサラダ', '蒸し野菜', 'カルパッチョ', '豆腐サラダ'], tips: '塩麹の塩分があるので塩は不要。レモン汁を加えるとさっぱり。', difficulty: '簡単' } },
];

function findCombination(a: string, b: string): CombinationResult | null {
  if (!a || !b || a === b) return null;
  const selected = [a, b].map(s => s.toLowerCase());
  for (const entry of COMBINATIONS) {
    for (const keySet of entry.keys) {
      const keySetLower = keySet.map(k => k.toLowerCase());
      if (keySetLower.every(k => selected.some(s => s.includes(k) || k.includes(s)))) return entry.result;
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

const difficultyStyle: Record<string, string> = {
  '簡単': 'bg-[#eef5e8] text-[#5a8040] border border-[#b8d8a0]',
  '普通': 'bg-[#fdf5ea] text-[#8a6020] border border-[#e8c98a]',
  '少し手間': 'bg-[#f8ede8] text-[#8a4020] border border-[#e8b898]',
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
    return getSuggestionsFor(condimentA || condimentB);
  }, [condimentA, condimentB, searched]);

  const handleCombine = () => {
    if (condimentA && condimentB && condimentA !== condimentB) setSearched(true);
  };

  const handleReset = () => { setCondimentA(''); setCondimentB(''); setSearched(false); };

  const optionsA = CONDIMENT_OPTIONS.filter(o => o !== condimentB);
  const optionsB = CONDIMENT_OPTIONS.filter(o => o !== condimentA);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-stretch sm:items-center justify-center z-50">
      <div className="bg-[#faf7f2] w-full sm:max-w-lg sm:rounded-2xl h-[100dvh] sm:h-auto max-h-[100dvh] sm:max-h-[88vh] flex flex-col sm:rounded-t-2xl shadow-2xl border-t border-[#e2d5c0]">

        {/* Header */}
        <div className="bg-[#3d1f00] px-4 py-3 flex items-center justify-between sm:rounded-t-2xl flex-shrink-0"
             style={{ paddingTop: 'calc(0.75rem + env(safe-area-inset-top))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#c17f3a] rounded-full flex items-center justify-center shadow">
              <Sparkles size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {t(language, 'combinatorTitle')}
              </h2>
              <p className="text-[10px] text-[#e8d5b0]">
                {t(language, 'combinatorSubtitle')}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Selector card */}
          <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#e2d5c0] bg-[#faf7f2]">
              <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">
                {t(language, 'selectCondiments')}
              </span>
            </div>
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#a07850] mb-1.5 uppercase tracking-wide">
                    {t(language, 'condimentA')}
                  </label>
                  <select
                    value={condimentA}
                    onChange={e => { setCondimentA(e.target.value); setSearched(false); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2d5c0] bg-[#faf7f2] text-[#3d1f00] text-sm focus:outline-none focus:ring-2 focus:ring-[#c17f3a]"
                  >
                    <option value="">{t(language, 'selectEllipsis')}</option>
                    {optionsA.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                <div className="flex-shrink-0 mt-5">
                  <div className="w-8 h-8 bg-[#c17f3a] rounded-full flex items-center justify-center shadow-sm">
                    <Plus size={16} className="text-white" />
                  </div>
                </div>

                <div className="flex-1">
                  <label className="block text-[10px] font-bold text-[#a07850] mb-1.5 uppercase tracking-wide">
                    {t(language, 'condimentB')}
                  </label>
                  <select
                    value={condimentB}
                    onChange={e => { setCondimentB(e.target.value); setSearched(false); }}
                    className="w-full px-3 py-2.5 rounded-xl border border-[#e2d5c0] bg-[#faf7f2] text-[#3d1f00] text-sm focus:outline-none focus:ring-2 focus:ring-[#c17f3a]"
                  >
                    <option value="">{t(language, 'selectEllipsis')}</option>
                    {optionsB.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <button
                onClick={handleCombine}
                disabled={!condimentA || !condimentB || condimentA === condimentB}
                className="w-full mt-4 py-3 bg-[#7c4a1e] text-white rounded-xl font-medium hover:bg-[#3d1f00] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
              >
                <Sparkles size={16} />
                {t(language, 'combineAction')}
              </button>
            </div>
          </div>

          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#e2d5c0] bg-[#faf7f2]">
                <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">
                  💡 {t(language, 'suggestedCombos', { name: condimentA || condimentB })}
                </span>
              </div>
              <div className="divide-y divide-[#f0e8de]">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      const partner = s.partner.split(' + ')[0];
                      if (condimentA && !condimentB) setCondimentB(partner);
                      else setCondimentA(partner);
                      setSearched(true);
                    }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fdf5ea] transition-colors text-left"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-[#c17f3a] font-bold flex-shrink-0">+</span>
                      <span className="text-sm font-medium text-[#3d1f00] flex-shrink-0">{s.partner}</span>
                      <span className="text-[#e2d5c0] flex-shrink-0">→</span>
                      <span className="text-sm text-[#7c4a1e] truncate">{s.result.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${difficultyStyle[s.result.difficulty]}`}>
                      {s.result.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Result */}
          {searched && result && (
            <div className="bg-white rounded-2xl border-2 border-[#c17f3a] overflow-hidden">
              <div className="bg-[#fdf5ea] px-4 py-3 border-b border-[#e8d5b0]">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <ChefHat size={16} className="text-[#c17f3a]" />
                    <span className="text-xs text-[#a07850]">{condimentA} × {condimentB}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${difficultyStyle[result.difficulty]}`}>
                    {result.difficulty}
                  </span>
                </div>
                <h3 className="text-xl font-bold text-[#3d1f00]">{result.name}</h3>
              </div>
              <div className="p-4 space-y-4">
                <p className="text-sm text-[#5c3d20] leading-relaxed">{result.description}</p>
                <div>
                  <p className="text-[10px] font-bold text-[#7c4a1e] uppercase tracking-wide mb-2">
                    {t(language, 'greatFor')}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.uses.map((use, i) => (
                      <span key={i} className="px-2.5 py-1 bg-[#fdf5ea] border border-[#e8d5b0] text-[#7c4a1e] text-xs rounded-lg font-medium">
                        {use}
                      </span>
                    ))}
                  </div>
                </div>
                {result.tips && (
                  <div className="bg-[#fdf5ea] border border-[#e8d5b0] rounded-xl p-3">
                    <p className="text-[10px] font-bold text-[#c17f3a] mb-1">💡 {t(language, 'tips')}</p>
                    <p className="text-xs text-[#5c3d20]">{result.tips}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No result */}
          {searched && !result && (
            <div className="bg-white rounded-2xl border border-[#e2d5c0] p-6 text-center">
              <p className="text-4xl mb-3">🤔</p>
              <p className="font-bold text-[#3d1f00] mb-1">
                {t(language, 'comboNotFound')}
              </p>
              <p className="text-sm text-[#a07850]">
                {t(language, 'comboTryAnyway')}
              </p>
            </div>
          )}

          {/* All combinations list */}
          {!searched && (
            <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
              <div className="px-4 py-2.5 border-b border-[#e2d5c0] bg-[#faf7f2]">
                <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">
                  📖 {t(language, 'registeredCombos')}
                </span>
              </div>
              <div className="divide-y divide-[#f0e8de]">
                {COMBINATIONS.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => { setCondimentA(c.keys[0][0]); setCondimentB(c.keys[0][1]); setSearched(true); }}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#fdf5ea] transition-colors text-left"
                  >
                    <div className="min-w-0">
                      <span className="text-xs text-[#a07850]">{c.keys[0].join(' × ')}</span>
                      <span className="mx-2 text-[#e2d5c0]">→</span>
                      <span className="text-sm font-medium text-[#3d1f00]">{c.result.name}</span>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full flex-shrink-0 ml-2 ${difficultyStyle[c.result.difficulty]}`}>
                      {c.result.difficulty}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Reset */}
        {searched && (
          <div className="flex-shrink-0 px-4 py-3 border-t border-[#e2d5c0] bg-[#faf7f2]">
            <button
              onClick={handleReset}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-[#e2d5c0] text-[#7c4a1e] rounded-xl hover:bg-[#fdf5ea] transition-colors text-sm font-medium"
            >
              <RefreshCw size={15} />
              {t(language, 'tryAnother')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
