import { useState, useRef, useEffect } from 'react';
import { X, Send, Bot, User as UserIcon, Sparkles } from 'lucide-react';
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
}

interface CondimentKnowledge {
  overview: string;
  features: string[];
  dishes: { name: string; ingredients: string }[];
  similar: string[];
  substitutes?: string[];
  compatibleIngredients?: string[];
}

const condimentKnowledge: Record<string, CondimentKnowledge> = {
  '醤油': {
    overview: '大豆・小麦・塩を原料に発酵させた日本の代表的な調味料。うま味・塩味・甘みが複雑に絡み合った深い風味が特徴です。',
    features: ['大豆由来の豊かな旨味とコク', '発酵による複雑な香りと風味', '色・香り・味をすべて補う万能調味料', '本醸造・混合醸造・混合など種類が豊富'],
    dishes: [
      { name: '刺身', ingredients: '醤油・わさび・新鮮な魚介' },
      { name: '卵かけご飯', ingredients: '醤油・卵・温かいご飯' },
      { name: '煮物', ingredients: '醤油・みりん・砂糖・だし' },
      { name: '照り焼き', ingredients: '醤油・みりん・砂糖・鶏もも肉' },
    ],
    similar: ['白だし', 'たまり醤油', 'ポン酢醤油', '魚醤（ナンプラー）'],
    substitutes: ['白だし（薄味）', 'たまり醤油（濃い味）', 'ナンプラー（エスニック風）'],
    compatibleIngredients: ['豆腐', '鶏肉', '豚肉', '魚介類', '野菜全般'],
  },
  '味噌': {
    overview: '大豆に麹と塩を加えて発酵・熟成させた日本の伝統発酵調味料。地域によって白・赤・麦など多様な種類があります。',
    features: ['発酵食品ならではの深いコクと旨味', '米・麦・豆など原料によって風味が異なる', '腸活に役立つ生きた乳酸菌を含む', '加熱しすぎると風味が飛ぶため最後に加えるのがコツ'],
    dishes: [
      { name: '味噌汁', ingredients: '味噌・だし・豆腐・わかめ・ねぎ' },
      { name: '豚汁', ingredients: '味噌・豚バラ・大根・にんじん・ごぼう' },
      { name: '鯖の味噌煮', ingredients: '味噌・砂糖・みりん・鯖・生姜' },
      { name: '味噌漬け', ingredients: '味噌・みりん・砂糖・魚や肉' },
    ],
    similar: ['白味噌（甘口）', '赤味噌（辛口）', '麦味噌（九州）', '豆板醤（中国）'],
    substitutes: ['白味噌（甘み重視）', '赤味噌（コク重視）'],
    compatibleIngredients: ['豚肉', '魚', '豆腐', '根野菜', 'きのこ'],
  },
  '塩': {
    overview: '料理の基本となる調味料で、食材の旨味を引き出し、味を引き締める効果があります。産地・製法によって風味が異なります。',
    features: ['食材本来の旨味を引き出す', '産地によって含まれるミネラル成分が異なる', '天日塩・岩塩・精製塩など種類が豊富', '少量で料理全体の味が変わる重要な調味料'],
    dishes: [
      { name: 'ステーキ', ingredients: '塩・黒胡椒・牛肉・にんにく' },
      { name: 'パスタ', ingredients: '塩・オリーブオイル・にんにく・パスタ' },
      { name: '塩おにぎり', ingredients: '塩・ご飯（・具材お好みで）' },
      { name: 'サラダ', ingredients: '塩・オリーブオイル・酢・野菜' },
    ],
    similar: ['岩塩（ヒマラヤ）', 'フルールドセル', 'ゲランドの塩', '藻塩'],
    substitutes: ['白だし（旨味入り）', '昆布塩', '塩麹'],
    compatibleIngredients: ['肉類全般', '魚介類', '野菜', 'パスタ', '卵'],
  },
  '酢': {
    overview: '穀物や果実を発酵させて作る酸味調味料。料理に爽やかな酸味を加えるだけでなく、食材の色を鮮やかにする効果もあります。',
    features: ['さっぱりとした酸味で料理を引き締める', '食材の色を鮮やかに保つ（酢飯・なます）', '米酢・穀物酢・果実酢など種類が豊富', '防腐効果があり保存食にも活用される'],
    dishes: [
      { name: '寿司飯', ingredients: '米酢・砂糖・塩・温かいご飯' },
      { name: '酢の物', ingredients: '酢・砂糖・塩・きゅうり・わかめ' },
      { name: 'ピクルス', ingredients: '酢・砂糖・塩・スパイス・野菜' },
      { name: '南蛮漬け', ingredients: '酢・砂糖・醤油・唐辛子・揚げた魚や鶏' },
    ],
    similar: ['バルサミコ酢', '黒酢', 'りんご酢', 'ワインビネガー'],
    substitutes: ['レモン汁（さっぱり感）', 'ゆず果汁（香り重視）'],
    compatibleIngredients: ['魚介類', 'きゅうり', 'わかめ', '鶏肉', '野菜全般'],
  },
  'ごま油': {
    overview: '焙煎したごまを絞って作る香り豊かな植物油。中華・韓国料理に欠かせない仕上げの調味料として広く使われています。',
    features: ['香ばしく深い香りが料理を格上げする', '少量でも存在感がある仕上げ用オイル', '加熱より仕上げ・和え物に向いている', '抗酸化作用のあるセサミンを含む'],
    dishes: [
      { name: 'ナムル', ingredients: 'ごま油・塩・にんにく・ほうれん草などの野菜' },
      { name: 'チャーハン', ingredients: 'ごま油・醤油・卵・ご飯・ねぎ' },
      { name: '棒棒鶏', ingredients: 'ごま油・醤油・砂糖・酢・鶏胸肉・きゅうり' },
      { name: '餃子のタレ', ingredients: 'ごま油・醤油・酢・ラー油' },
    ],
    similar: ['太白ごま油（白）', 'ラー油', 'オリーブオイル', '菜種油'],
    substitutes: ['太白ごま油（香り控えめ）', 'ラー油（辛みプラス）'],
    compatibleIngredients: ['鶏肉', '豚肉', '野菜炒め', 'ラーメン', '和え物'],
  },
  'オリーブオイル': {
    overview: 'オリーブの実を圧搾して作る油。地中海料理に欠かせない素材で、エキストラバージンは香りが高く生食向きです。',
    features: ['フルーティーな香りと後味のほろ苦さが特徴', '不飽和脂肪酸が豊富で健康的', 'エキストラバージン・ピュアなど品質の等級がある', 'サラダのドレッシングから炒め物まで幅広く使える'],
    dishes: [
      { name: 'カプレーゼ', ingredients: 'オリーブオイル・塩・バルサミコ酢・トマト・モッツァレラ' },
      { name: 'ペペロンチーノ', ingredients: 'オリーブオイル・にんにく・唐辛子・パスタ・塩' },
      { name: 'アヒージョ', ingredients: 'オリーブオイル・にんにく・塩・えび・マッシュルーム' },
      { name: 'サラダドレッシング', ingredients: 'オリーブオイル・酢・塩・黒胡椒・マスタード' },
    ],
    similar: ['グレープシードオイル', 'アボカドオイル', 'キャノーラ油', 'ごま油（香り系）'],
    substitutes: ['グレープシードオイル（加熱向き）', 'バター（濃厚さ重視）'],
    compatibleIngredients: ['トマト', 'チーズ', 'にんにく', 'パスタ', '海鮮'],
  },
  'バルサミコ酢': {
    overview: 'イタリア・モデナ産の高品質な濃縮酢。ぶどうを長期熟成させた甘酸っぱい複雑な風味が特徴です。',
    features: ['甘みと酸味が絶妙に調和した濃厚な風味', '長期熟成（12〜25年以上）で深いコク', '少量でも料理の格が上がる高級調味料', 'アイスクリームなどデザートにも合う'],
    dishes: [
      { name: 'カプレーゼ', ingredients: 'バルサミコ酢・トマト・モッツァレラ・オリーブオイル・バジル' },
      { name: 'カルパッチョ', ingredients: 'バルサミコ酢・オリーブオイル・塩・薄切り牛肉や魚' },
      { name: 'バルサミコソースのチキン', ingredients: 'バルサミコ酢・醤油・はちみつ・鶏もも肉' },
      { name: 'バニラアイスがけ', ingredients: 'バルサミコ酢・バニラアイスクリーム' },
    ],
    similar: ['黒酢（中国）', '赤ワインビネガー', '果実酢', '米酢（まろやか系）'],
    substitutes: ['赤ワインビネガー＋はちみつ', '黒酢（コク重視）'],
    compatibleIngredients: ['牛肉', 'チーズ', 'いちご', 'サラダ', 'フルーツ'],
  },
  '白だし': {
    overview: '淡口醤油に鰹・昆布のだしを合わせた万能調味料。色が薄く料理の色を邪魔しないため、和食全般に活躍します。',
    features: ['薄い色で食材の色を活かせる', '鰹・昆布の旨味が濃縮されている', '少量加えるだけで本格的な和の風味に', '醤油より塩分が高いため少量で味が決まる'],
    dishes: [
      { name: '出汁巻き卵', ingredients: '白だし・卵・みりん（・水）' },
      { name: '茶碗蒸し', ingredients: '白だし・卵・だし汁・具材（えび・三つ葉）' },
      { name: 'うどんつゆ', ingredients: '白だし・水（・みりん・塩）' },
      { name: 'おでん', ingredients: '白だし・水・みりん・各おでん種' },
    ],
    similar: ['醤油（濃い色）', '昆布だし', '鰹だし', 'めんつゆ'],
    substitutes: ['醤油＋だし（自家製）', 'めんつゆ（甘め）'],
    compatibleIngredients: ['卵', '白身魚', '豆腐', 'うどん', '根野菜'],
  },
  'ナンプラー': {
    overview: 'タイ・東南アジアの魚醤。小魚を塩漬けにして発酵させた調味料で、独特の香りと強烈な旨味が料理に深みを与えます。',
    features: ['強烈な旨味（アミノ酸）が豊富', '独特の発酵香があるが加熱すると和らぐ', 'アジア料理に不可欠な調味料', '少量で料理の旨味が格段にアップ'],
    dishes: [
      { name: 'パッタイ', ingredients: 'ナンプラー・砂糖・ライムジュース・米麺・えび・ピーナッツ' },
      { name: 'トムヤムクン', ingredients: 'ナンプラー・レモングラス・コブミカン・えび・唐辛子' },
      { name: 'タイ風炒め物', ingredients: 'ナンプラー・オイスターソース・にんにく・バジル・豚ひき肉' },
      { name: 'ガパオライス', ingredients: 'ナンプラー・オイスターソース・砂糖・バジル・鶏ひき肉' },
    ],
    similar: ['醤油（旨味系）', '日本の魚醤（しょっつる・いしる）', 'ヌクマム（ベトナム）', 'コラトゥーラ（イタリア）'],
    substitutes: ['醤油＋少量の塩（代用）', 'しょっつる（国産魚醤）'],
    compatibleIngredients: ['えび', '豚肉', '鶏肉', 'もやし', 'バジル'],
  },
  'みりん': {
    overview: 'もち米・米麹・焼酎を熟成させた和食の甘み調味料。砂糖にはない複雑な甘みとコクを料理に与えます。',
    features: ['上品な甘みとコクで料理に深みを出す', '照り・つや出し効果がある', 'アルコールが食材の臭みを消す', '砂糖より穏やかな甘さで素材を引き立てる'],
    dishes: [
      { name: '照り焼き', ingredients: 'みりん・醤油・砂糖・鶏もも肉' },
      { name: 'きんぴらごぼう', ingredients: 'みりん・醤油・砂糖・ごま油・ごぼう・にんじん' },
      { name: 'すき焼き', ingredients: 'みりん・醤油・砂糖・牛肉・野菜各種' },
      { name: '煮物', ingredients: 'みりん・醤油・だし・季節の野菜や魚' },
    ],
    similar: ['料理酒（旨味添加）', '日本酒（辛口）', '本みりん・みりん風調味料'],
    substitutes: ['砂糖＋料理酒（割合1:1）', 'はちみつ（少量）'],
    compatibleIngredients: ['鶏肉', '魚', 'れんこん', 'ごぼう', '大根'],
  },
  '豆板醤': {
    overview: '中国四川省発祥の辛い発酵調味料。そら豆・唐辛子・塩を発酵させたもので、麻婆豆腐には欠かせません。',
    features: ['刺激的な辛みと発酵由来のコク', '加熱することで辛みと香りが引き立つ', '少量で料理全体にパンチが出る', '辛さの中に旨味と複雑な風味がある'],
    dishes: [
      { name: '麻婆豆腐', ingredients: '豆板醤・醤油・ごま油・豚ひき肉・豆腐・花椒' },
      { name: '担々麺', ingredients: '豆板醤・ごま・醤油・豚ひき肉・中華麺' },
      { name: 'エビチリ', ingredients: '豆板醤・ケチャップ・砂糖・塩・えび' },
      { name: '回鍋肉', ingredients: '豆板醤・甜麺醤・醤油・キャベツ・豚バラ' },
    ],
    similar: ['コチュジャン（韓国・甘辛）', '一味唐辛子（シンプル辛み）', '七味唐辛子', 'ラー油'],
    substitutes: ['コチュジャン（甘辛）', '一味＋醤油（簡易代用）'],
    compatibleIngredients: ['豆腐', '豚肉', 'えび', 'なす', 'キャベツ'],
  },
  'コチュジャン': {
    overview: '韓国の甘辛発酵調味料。もち米・唐辛子・大豆を発酵させたもので、甘みと辛みのバランスが特徴です。',
    features: ['甘みと辛みが合わさった独特のうまみ', '発酵由来のコクと深みがある', 'ビビンバ・トッポッキなど韓国料理に欠かせない', '豆板醤より甘みが強く食べやすい辛さ'],
    dishes: [
      { name: 'ビビンバ', ingredients: 'コチュジャン・ごま油・醤油・ご飯・ナムル各種・卵' },
      { name: 'トッポッキ', ingredients: 'コチュジャン・砂糖・醤油・水・餅・さつま揚げ' },
      { name: 'ヤンニョムチキン', ingredients: 'コチュジャン・はちみつ・醤油・にんにく・鶏肉' },
      { name: '韓国風サムギョプサル', ingredients: 'コチュジャン・にんにく・ごま油・豚バラ' },
    ],
    similar: ['豆板醤（辛さ重視）', '甜麺醤（甘み重視）', 'ハリッサ（中東辛味噌）'],
    substitutes: ['豆板醤＋はちみつ（代用）', 'みそ＋一味＋砂糖（簡易）'],
    compatibleIngredients: ['豚肉', '鶏肉', '餅', 'レタス', 'ごま'],
  },
};

const condimentKeywords = Object.keys(condimentKnowledge);

const recommendationsByPurpose: Record<string, { condiments: string[]; reason: string }> = {
  '甘い': { condiments: ['みりん', 'はちみつ（天然）', 'きび砂糖', '白みそ'], reason: '甘みのある調味料' },
  '甘': { condiments: ['みりん', 'はちみつ（天然）', 'きび砂糖'], reason: '甘みのある調味料' },
  '辛い': { condiments: ['豆板醤', 'コチュジャン', '一味唐辛子', '七味唐辛子', 'ハリッサ'], reason: '辛みのある調味料' },
  '辛': { condiments: ['豆板醤', 'コチュジャン', '一味唐辛子'], reason: '辛みのある調味料' },
  '旨味': { condiments: ['白だし', '醤油', '味噌', 'ナンプラー'], reason: '旨味が豊富な調味料' },
  'うまみ': { condiments: ['白だし', '醤油', '味噌', 'ナンプラー'], reason: '旨味が豊富な調味料' },
  '酸っぱい': { condiments: ['米酢', 'バルサミコ酢', 'ポン酢', 'ゆず果汁'], reason: '酸味のある調味料' },
  '酸': { condiments: ['米酢', 'バルサミコ酢', 'ポン酢'], reason: '酸味のある調味料' },
  '香り': { condiments: ['ごま油', 'オリーブオイル', 'バルサミコ酢', '一味唐辛子'], reason: '香り豊かな調味料' },
  '万能': { condiments: ['醤油', '白だし', '塩', 'みりん'], reason: '幅広い料理に使える万能調味料' },
  'アジア': { condiments: ['ナンプラー', 'コチュジャン', '豆板醤', 'ごま油'], reason: 'アジア料理向きの調味料' },
  'イタリア': { condiments: ['オリーブオイル', 'バルサミコ酢', '塩', '黒胡椒'], reason: 'イタリア料理向きの調味料' },
  '韓国': { condiments: ['コチュジャン', 'ごま油', '醤油', '豆板醤'], reason: '韓国料理向きの調味料' },
  '中華': { condiments: ['豆板醤', 'ごま油', 'オイスターソース', '甜麺醤'], reason: '中華料理向きの調味料' },
  '和食': { condiments: ['醤油', '味噌', '白だし', 'みりん'], reason: '和食向きの調味料' },
  '健康': { condiments: ['塩麹', 'オリーブオイル', '米酢', 'はちみつ'], reason: '健康志向の方におすすめな調味料' },
  '発酵': { condiments: ['味噌', '醤油', '塩麹', 'ナンプラー', '豆板醤'], reason: '発酵食品の調味料' },
};

const suggestedQuestions = {
  ja: [
    '醤油はどんな料理に使えますか？',
    '辛い調味料をおすすめして',
    '旨味が強い調味料は？',
    '豚肉に合う調味料は？',
    '発酵調味料を教えて',
    'ナンプラーとは？',
  ],
  en: [
    'What dishes can I use soy sauce for?',
    'Recommend a spicy condiment',
    'What are high-umami condiments?',
    'What condiment goes with pork?',
    'Tell me about fermented condiments',
  ],
};

function detectCondiment(message: string): string | null {
  for (const key of condimentKeywords) {
    if (message.includes(key)) return key;
  }
  return null;
}

function formatStructuredResponse(
  condimentName: string,
  knowledge: CondimentKnowledge,
  language: Language
): string {
  if (language === 'en') {
    return `**${condimentName}**\n\n■ Overview\n${knowledge.overview}\n\n■ Features\n${knowledge.features.map(f => `・${f}`).join('\n')}\n\n■ Recommended Dishes\n${knowledge.dishes.map(d => `・${d.name}（${d.ingredients}）`).join('\n')}\n\n■ Similar Condiments\n${knowledge.similar.map(s => `・${s}`).join('\n')}`;
  }
  return `**${condimentName}**\n\n■概要\n${knowledge.overview}\n\n■特徴\n${knowledge.features.map(f => `・${f}`).join('\n')}\n\n■おすすめ料理\n${knowledge.dishes.map(d => `・${d.name}（材料：${d.ingredients}）`).join('\n')}\n\n■似ている調味料\n${knowledge.similar.map(s => `・${s}`).join('\n')}`;
}

export function ChatPage({ onClose, language, condiments, onViewCondiment }: ChatPageProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: language === 'ja'
        ? 'こんにちは！「世界の調味料図鑑」専門AIアシスタントです🌏\n\n世界中の調味料について何でもお答えします！\n\n・調味料の特徴や使い方が知りたい\n・料理に合う調味料を提案してほしい\n・調味料を比較したい\n\nなど、お気軽にどうぞ！'
        : 'Hello! I\'m the AI assistant for the World Condiment Encyclopedia 🌏\n\nI can answer any question about condiments around the world!\n\n・Learn about condiment features and usage\n・Get condiment recommendations for dishes\n・Compare different condiments\n\nFeel free to ask anything!',
      sender: 'bot',
      timestamp: new Date(),
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateBotResponse = (userMessage: string): Message => {
    const lower = userMessage.toLowerCase();
    let responseText = '';
    let relatedCondiments: Condiment[] = [];

    // 1. Specific condiment name detected → structured response
    const detectedCondiment = detectCondiment(userMessage);
    if (detectedCondiment) {
      const knowledge = condimentKnowledge[detectedCondiment];
      if (knowledge) {
        responseText = formatStructuredResponse(detectedCondiment, knowledge, language);
        relatedCondiments = condiments.filter(c =>
          c.name.toLowerCase().includes(detectedCondiment.toLowerCase()) ||
          c.category.toLowerCase().includes(detectedCondiment.toLowerCase())
        ).slice(0, 3);
      } else {
        // Condiment in app data but not in knowledge base — find from data
        const appCondiments = condiments.filter(c =>
          c.name.includes(detectedCondiment) || c.category === detectedCondiment
        ).slice(0, 3);
        relatedCondiments = appCondiments;
        if (appCondiments.length > 0) {
          const c = appCondiments[0];
          responseText = language === 'ja'
            ? `**${c.name}**\n\n■概要\n${c.description}\n\n■特徴\n・原産地：${c.origin}\n・カテゴリ：${c.category}\n・リピート評価：${c.repeatRating}/5\n\n■おすすめ料理\n${c.recommendedDishes.slice(0, 4).map(d => `・${d}`).join('\n')}`
            : `**${c.name}**\n\n■Overview\n${c.description}\n\n■Features\n・Origin: ${c.origin}\n・Category: ${c.category}\n・Repeat Rating: ${c.repeatRating}/5\n\n■Recommended Dishes\n${c.recommendedDishes.slice(0, 4).map(d => `・${d}`).join('\n')}`;
        }
      }
    }

    // 2. "おすすめ" (recommend) query
    if (!responseText && (lower.includes('おすすめ') || lower.includes('recommend') || lower.includes('提案') || lower.includes('suggest'))) {
      const purposeKey = Object.keys(recommendationsByPurpose).find(k => lower.includes(k));

      if (purposeKey) {
        const rec = recommendationsByPurpose[purposeKey];
        responseText = language === 'ja'
          ? `${rec.reason}をご提案します！\n\n${rec.condiments.map(c => `・${c}`).join('\n')}\n\n気になる調味料名を教えていただければ、詳しい使い方や料理もご説明します😊`
          : `Here are ${rec.reason}:\n\n${rec.condiments.map(c => `・${c}`).join('\n')}\n\nTell me which one you'd like to know more about!`;

        relatedCondiments = condiments.filter(c =>
          rec.condiments.some(name => c.name.includes(name.replace('（天然）', '').replace('（白）', '')))
        ).slice(0, 3);
      } else {
        // Generic recommend — ask about preference
        responseText = language === 'ja'
          ? `お好みや用途を教えていただけますか？\n\n・どんな味が好きですか？\n  （甘い・辛い・酸っぱい・旨味・香り重視など）\n\n・どんな料理に使いたいですか？\n  （和食・洋食・中華・韓国など）\n\nに合わせて最適な調味料をご提案します！`
          : `Could you tell me your preferences?\n\n・What flavors do you like?\n  (sweet, spicy, sour, umami, aromatic, etc.)\n\n・What type of cuisine?\n  (Japanese, Western, Chinese, Korean, etc.)\n\nI'll suggest the perfect condiment for you!`;
      }
    }

    // 3. Comparison query
    if (!responseText && (lower.includes('違い') || lower.includes('比べ') || lower.includes('compare') || lower.includes('difference') || lower.includes('vs'))) {
      responseText = language === 'ja'
        ? '比較したい調味料を教えてください。\n\n例：「醤油と白だしの違いは？」\n例：「米酢とバルサミコ酢を比べて」\n\nのように聞いていただくと詳しくご説明します！'
        : 'Which condiments would you like to compare?\n\nExample: "What\'s the difference between soy sauce and white dashi?"\n\nI\'ll explain in detail!';
    }

    // 4. Ingredient-based cooking suggestion
    if (!responseText) {
      const ingredientTriggers = ['があります', 'がある', 'を使って', 'を使いたい', 'が余って', 'に合う', 'に使える', 'i have', 'using', 'goes with'];
      const isIngredientQuery = ingredientTriggers.some(t => lower.includes(t));

      if (isIngredientQuery) {
        const ingredientCondiments = condiments.filter(c =>
          c.recommendedDishes.some(d => lower.includes(d.slice(0, 3))) ||
          c.name.split('').some(ch => lower.includes(ch) && ch.length > 1)
        ).slice(0, 3);
        relatedCondiments = ingredientCondiments;

        responseText = language === 'ja'
          ? `お持ちの食材に合う調味料をお探しですね！\n\nどの食材をお使いですか？\n（例：「豚肉があります」「トマトを使いたい」）\n\n食材名を教えていただければ、おすすめ調味料と料理をご提案します🍳`
          : `You\'re looking for condiments to match your ingredients!\n\nWhat ingredient do you have?\n(e.g., "I have pork", "I want to use tomatoes")\n\nTell me the ingredient and I\'ll suggest condiments and dishes! 🍳`;
      }
    }

    // 5. Unknown condiment name query — ask clarifying question
    if (!responseText && (lower.includes('とは') || lower.includes('って何') || lower.includes('what is') || lower.includes('tell me about'))) {
      responseText = language === 'ja'
        ? `調味料のご質問ありがとうございます！\n\n以下を教えていただくと詳しくご説明できます😊\n\n・どの国の調味料ですか？\n・どのような料理に使いたいですか？\n・味の特徴はわかりますか？\n  （辛い・甘い・酸っぱいなど）`
        : `Thank you for your condiment question!\n\nCould you tell me:\n\n・Which country is this condiment from?\n・What type of dish do you want to use it in?\n・Do you know any flavor characteristics?\n  (spicy, sweet, sour, etc.)`;
    }

    // 6. Rating-based search from app data
    if (!responseText) {
      if (lower.includes('人気') || lower.includes('高評価') || lower.includes('popular') || lower.includes('top rated')) {
        relatedCondiments = [...condiments].sort((a, b) => b.repeatRating - a.repeatRating).slice(0, 3);
        responseText = language === 'ja'
          ? 'リピート評価の高い人気調味料です：'
          : 'Top-rated condiments in our collection:';
      } else if (lower.includes('最新') || lower.includes('新しい') || lower.includes('recent') || lower.includes('new')) {
        relatedCondiments = [...condiments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 3);
        responseText = language === 'ja'
          ? '最近投稿された調味料です：'
          : 'Recently posted condiments:';
      }
    }

    // 7. Fallback
    if (!responseText) {
      responseText = language === 'ja'
        ? '調味料に関するご質問をお待ちしています！\n\n例えばこんな質問ができます：\n\n・「醤油の特徴を教えて」\n・「辛い調味料をおすすめして」\n・「豚肉に合う調味料は？」\n・「ナンプラーとは？」\n\n何でもお気軽にどうぞ🌏'
        : 'I\'m here to answer your condiment questions!\n\nFor example:\n\n・"Tell me about soy sauce"\n・"Recommend a spicy condiment"\n・"What condiment goes with pork?"\n・"What is fish sauce?"\n\nFeel free to ask anything 🌏';
    }

    return {
      id: Date.now().toString(),
      text: responseText,
      sender: 'bot',
      timestamp: new Date(),
      relatedCondiments: relatedCondiments.length > 0 ? relatedCondiments : undefined,
    };
  };

  const handleSendMessage = (text?: string) => {
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

    setTimeout(() => {
      const botResponse = generateBotResponse(messageText);
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 700);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-md h-[92vh] flex flex-col rounded-t-2xl shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 px-4 py-3 flex items-center justify-between rounded-t-2xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white rounded-full flex items-center justify-center shadow">
              <Bot size={20} className="text-blue-500" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                {language === 'ja' ? '調味料専門AIアシスタント' : 'Condiment AI Assistant'}
              </h2>
              <div className="flex items-center gap-1">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                <p className="text-xs text-blue-100">{language === 'ja' ? '世界の調味料図鑑' : 'World Condiment Encyclopedia'}</p>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:text-gray-200 p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={22} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 shadow-sm mt-1 ${
                message.sender === 'user' ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-blue-500'
              }`}>
                {message.sender === 'user' ? (
                  <UserIcon size={14} className="text-white" />
                ) : (
                  <Bot size={14} className="text-white" />
                )}
              </div>
              <div className={`flex-1 max-w-[88%] ${message.sender === 'user' ? 'flex flex-col items-end' : ''}`}>
                <div
                  className={`px-3 py-2.5 rounded-2xl shadow-sm ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white rounded-tr-sm'
                      : 'bg-white border border-gray-100 rounded-tl-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{message.text}</p>

                  {message.relatedCondiments && message.relatedCondiments.length > 0 && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs font-medium text-gray-500 mb-1">
                        {language === 'ja' ? '📚 図鑑から見つかりました' : '📚 Found in encyclopedia'}
                      </p>
                      {message.relatedCondiments.map(condiment => (
                        <div
                          key={condiment.id}
                          onClick={() => onViewCondiment?.(condiment)}
                          className="bg-gray-50 border border-gray-200 rounded-xl p-2.5 cursor-pointer hover:bg-blue-50 hover:border-blue-200 transition-all"
                        >
                          <div className="flex gap-2">
                            {condiment.imageUrl && (
                              <img
                                src={condiment.imageUrl}
                                alt={condiment.name}
                                className="w-12 h-12 object-cover rounded-lg flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-gray-900 text-sm">{condiment.name}</h4>
                              <span className="inline-block px-1.5 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full mt-0.5">
                                {condiment.category}
                              </span>
                              <p className="text-xs text-gray-600 mt-1 line-clamp-2">{condiment.description}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <span className="text-xs text-yellow-600">★ {condiment.repeatRating}/5</span>
                                <span className="text-xs text-gray-400">·</span>
                                <span className="text-xs text-gray-500">{condiment.origin}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs mt-1 text-gray-400">
                  {message.timestamp.toLocaleTimeString(language === 'ja' ? 'ja-JP' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-sm">
                <Bot size={14} className="text-white" />
              </div>
              <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center h-4">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Questions */}
        <div className="border-t bg-white flex-shrink-0">
          <div className="px-3 pt-2 pb-1 flex gap-2 overflow-x-auto scrollbar-hide">
            <Sparkles size={13} className="text-purple-400 flex-shrink-0 mt-1" />
            {suggestedQuestions[language].map((q, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(q)}
                className="flex-shrink-0 px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-xs rounded-full transition-colors border border-gray-200 hover:border-blue-200"
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
              placeholder={language === 'ja' ? '調味料について質問してください...' : 'Ask about condiments...'}
              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50 text-sm"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputText.trim()}
              className="px-3 py-2.5 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
