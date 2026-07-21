import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, User as UserIcon, Shield, MessageCircle, Home, Grid, TrendingUp, MapPin, Users, Sparkles, Trophy, Menu, X as XIcon, Star, ChevronLeft, Mail } from 'lucide-react';
import { CondimentCard } from './components/CondimentCard';
import { AddCondimentForm } from './components/AddCondimentForm';
import { CondimentReviews } from './components/CondimentReviews';
import { UserRegistration } from './components/UserRegistration';
import { AdminPanel } from './components/AdminPanel';
import { UserPosts } from './components/UserPosts';
import { CondimentDetail } from './components/CondimentDetail';
import { MyPage } from './components/MyPage';
import { CategoryGrid } from './components/CategoryGrid';
import { ChatPage } from './components/ChatPage';
import { CombinationPage } from './components/CombinationPage';
import { TrendsPage } from './components/TrendsPage';
import { RankingPage } from './components/RankingPage';
import { LoginModal } from './components/LoginModal';
import { NotificationBell } from './components/NotificationBell';
import { ShareModal } from './components/ShareModal';
import { AdCarousel } from './components/AdCarousel';
import { CondimentMap } from './components/CondimentMap';
import { ContactModal } from './components/ContactModal';
import { isAdmin } from './admin';
import { logSearch } from './searchLog';
import { CategoryIllustration } from './components/CategoryIllustration';
import { withBase } from './assetPath';
import { Condiment, User, AggregatedCondiment } from './types';
import { aggregateCondiments } from './utils/aggregateCondiments';
import { Language, t, CATEGORY_KEYS } from './i18n/translations';
import { supabase } from '../lib/supabase';
import { getProfile, signOut, updateProfile } from '../lib/auth';
import { fetchCondiments, insertCondiment, updateCondiment, deleteCondiment, fetchLikedIds, toggleLike, fetchBookmarkedIds, toggleBookmark, fetchAllUsers } from '../lib/database';

export default function App() {
  const [language, setLanguage] = useState<Language>('ja');
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [showUserRegistration, setShowUserRegistration] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showMyPage, setShowMyPage] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showCombination, setShowCombination] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'trends' | 'ranking'>('home');
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [condiments, setCondiments] = useState<Condiment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCondiment, setEditingCondiment] = useState<Condiment | null>(null);
  const [shareModalName, setShareModalName] = useState<string | null>(null);
  const [selectedAggregated, setSelectedAggregated] = useState<AggregatedCondiment | null>(null);
  const [selectedUserPosts, setSelectedUserPosts] = useState<{ userId: string; nickname: string } | null>(null);
  const [selectedCondiment, setSelectedCondiment] = useState<Condiment | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [committedSearch, setCommittedSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('すべて');
  const [likedCondiments, setLikedCondiments] = useState<string[]>([]);
  const [bookmarkedCondiments, setBookmarkedCondiments] = useState<string[]>([]);

  const translateText = async (text: string, targetLang: string): Promise<string> => {
    try {
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=ja&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
      const response = await fetch(url);
      const data = await response.json();

      if (data && data[0] && data[0][0] && data[0][0][0]) {
        return data[0].map((item: any) => item[0]).join('');
      }
    } catch (error) {
      console.error('Translation failed for text:', text, error);
    }
    return text;
  };

  const handleLanguageChange = async (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('language', lang);

    // Translate sample data when switching to English
    if (lang === 'en') {
      try {
        // Save original Japanese data before translating
        const originalDataKey = 'originalCondimentsJa';
        if (!localStorage.getItem(originalDataKey)) {
          localStorage.setItem(originalDataKey, JSON.stringify(condiments));
        }

        const translationCacheKey = 'condimentsTranslationCache';
        const cachedTranslations = localStorage.getItem(translationCacheKey);
        let translationCache: Record<string, any> = {};

        if (cachedTranslations) {
          translationCache = JSON.parse(cachedTranslations);
        }

        const translatedCondiments = await Promise.all(
          condiments.map(async (condiment) => {
            // Check if translation is already cached
            if (translationCache[condiment.id]) {
              return {
                ...condiment,
                ...translationCache[condiment.id]
              };
            }

            // Translate all fields using Google Translate API
            try {
              const translationsToFetch = [
                translateText(condiment.name, 'en'),
                translateText(condiment.category, 'en'),
                translateText(condiment.description, 'en'),
                translateText(condiment.origin, 'en'),
                translateText(condiment.purchaseLocation, 'en'),
                translateText(condiment.postedBy.nickname, 'en'),
                ...condiment.postedBy.tasteBadges.map(badge => translateText(badge, 'en')),
                ...condiment.recommendedDishes.map(dish => translateText(dish, 'en'))
              ];

              const results = await Promise.all(translationsToFetch);

              const translatedName = results[0];
              const translatedCategory = results[1];
              const translatedDescription = results[2];
              const translatedOrigin = results[3];
              const translatedPurchaseLocation = results[4];
              const translatedNickname = results[5];
              const translatedBadges = results.slice(6, 6 + condiment.postedBy.tasteBadges.length);
              const translatedDishes = results.slice(6 + condiment.postedBy.tasteBadges.length);

              const translatedFields = {
                name: translatedName,
                category: translatedCategory,
                description: translatedDescription,
                origin: translatedOrigin,
                purchaseLocation: translatedPurchaseLocation,
                recommendedDishes: translatedDishes,
                postedBy: {
                  ...condiment.postedBy,
                  nickname: translatedNickname,
                  tasteBadges: translatedBadges
                }
              };

              // Save to cache
              translationCache[condiment.id] = translatedFields;

              return {
                ...condiment,
                ...translatedFields
              };
            } catch (error) {
              console.error('Translation failed for condiment:', condiment.id, error);
            }

            return condiment;
          })
        );

        // Save translation cache
        localStorage.setItem(translationCacheKey, JSON.stringify(translationCache));

        // Update condiments state with translated data
        setCondiments(translatedCondiments);
      } catch (error) {
        console.error('Translation process failed:', error);
      }
    } else {
      // Restore original Japanese data
      const originalDataKey = 'originalCondimentsJa';
      const stored = localStorage.getItem(originalDataKey);
      if (stored) {
        try {
          const originalCondiments = JSON.parse(stored);
          setCondiments(originalCondiments);
        } catch (error) {
          console.error('Failed to restore original condiments:', error);
        }
      }
    }
  };

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang && (storedLang === 'ja' || storedLang === 'en')) {
      setLanguage(storedLang);
    }

    // Supabase 認証セッション監視
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile) {
          setCurrentUser({ ...profile, email: session.user.email ?? '' });
          const [likes, bookmarks] = await Promise.all([
            fetchLikedIds(session.user.id),
            fetchBookmarkedIds(session.user.id),
          ]);
          setLikedCondiments(likes);
          setBookmarkedCondiments(bookmarks);
        }
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const profile = await getProfile(session.user.id);
        if (profile) {
          setCurrentUser({ ...profile, email: session.user.email ?? '' });
          const [likes, bookmarks] = await Promise.all([
            fetchLikedIds(session.user.id),
            fetchBookmarkedIds(session.user.id),
          ]);
          setLikedCondiments(likes);
          setBookmarkedCondiments(bookmarks);
        }
        setShowLoginModal(false);
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setLikedCondiments([]);
        setBookmarkedCondiments([]);
      }
    });

    // Supabase から調味料取得（失敗・空の場合はサンプルデータ22件を表示）
    const loadFallback = () => {
      const stored = localStorage.getItem('condiments');
      const dataVersion = localStorage.getItem('condimentsVersion');

    // Check if we need to migrate old data
    if (stored && dataVersion === '4.3') {
      try {
        const parsed = JSON.parse(stored);
        // Verify data structure
        if (parsed.length > 0 && parsed[0].tasteProfile && parsed[0].tasteProfile.saltiness !== undefined && parsed[0].tasteProfile.richness !== undefined && parsed[0].tasteProfile.aroma !== undefined && parsed[0].repeatRating !== undefined && parsed[0].imageUrl) {
          setCondiments(parsed);
          return;
        }
      } catch (e) {
        console.error('Failed to parse stored condiments', e);
      }
    }

    // Load sample data if no valid stored data exists
    {
      const sampleData: Condiment[] = [
        {
          id: 'dm-001',
          name: 'みどりのラー油',
          category: '辛味',
          description: '新潟県小千谷市特産のかぐら南蛮を原料にしたみどり色のラー油です。少し遅れてくるさわやかな辛味が料理の味を引き立てます。きれいなみどり色が料理の色合いを際立たせて美味しく見せます。2020調味料選手権辛味部門最優秀賞・2018審査員特別賞受賞。いつものメニューが変わる、美味しさを引き出す魔法の一滴。',
          origin: '新潟県',
          recommendedDishes: ['スープ', 'ラーメン', '冷奴', 'そば・うどん', 'カプレーゼ', 'ちょい辛サラダ'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 0, sourness: 1, bitterness: 4, umami: 2, saltiness: 2, richness: 3, aroma: 5 },
          imageUrl: '/condiments/01_a.jpg',
          dishImageUrl: '/condiments/01_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '辛党'] },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-002',
          name: '薫る焦がし醤油',
          category: '醤油',
          description: 'かつお節や昆布の旨みと焦がし醤油の香ばしい風味が料理の味を上品にひきたてます。瓶の中に短冊状のかごめ昆布が入っており、使うたびに昆布だしが深まります。鍋肌で丁寧に焦がした上品な味わい。製造：北海道函館市。',
          origin: '北海道',
          recommendedDishes: ['卵かけご飯', '納豆', 'お浸し', '焼き魚', 'ステーキ'],
          repeatRating: 4.5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 1, sourness: 0, bitterness: 2, umami: 4, saltiness: 3, richness: 2, aroma: 5 },
          imageUrl: '/condiments/02_a.jpg',
          dishImageUrl: '/condiments/02_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '旨味好き'] },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-003',
          name: '離宮の食べる七味',
          category: 'スパイス',
          description: '京都離宮が手がける、食べられる七味唐辛子。国産とうがらし・ゆず・山椒・黒ごま・青のり・生姜を合わせた芳醇な風味。京都の食文化が凝縮された本格派スパイス。製造：京都府京都市。',
          origin: '京都府',
          recommendedDishes: ['鍋料理', 'うどん', '焼き鳥', '天ぷら', 'お浸し'],
          repeatRating: 4.5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 0, sourness: 1, bitterness: 3, umami: 1, saltiness: 2, richness: 1, aroma: 5 },
          imageUrl: '/condiments/03_a.jpeg',
          dishImageUrl: '/condiments/03_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '伝統派'] },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-004',
          name: '心のぽん酢醤油',
          category: '醤油',
          description: 'ほんとうに美味しいぽん酢醤油を造るため、原材料にこだわりました。埼玉県の国産丸大豆醤油、高知の有機栽培ゆず果汁、愛知のみりん、種子島の粗糖、山梨の甲州味噌、メキシコ産天日塩、静岡の鰹厚削り、日高みついし昆布、大分の干し椎茸、そして戸塚醸造の心の酢。「美味しい！」の笑顔を届けるために造った、心のこもったぽん酢醤油です。',
          origin: '埼玉県',
          recommendedDishes: ['鍋料理', '餃子', '冷奴', 'サラダ', '焼き魚'],
          repeatRating: 4.5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 2, sourness: 4, bitterness: 0, umami: 3, saltiness: 3, richness: 2, aroma: 3 },
          imageUrl: '/condiments/04_a.jpg',
          dishImageUrl: '/condiments/04_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '素材重視'] },
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-005',
          name: '生きてる醤油',
          category: '醤油',
          description: '「生きてる醤油」は何百年の昔に食されていたそのままの醤油を、食卓に届けようとするものです。すべての微生物が生きたままの醤油。古式天然醸造2年熟成醤油もろみから、一番しぼりの雫だけを集めた希少価値のある醤油です。大豆は京都産を使用。製造：京都府綾部市。',
          origin: '京都府',
          recommendedDishes: ['刺身', '卵かけご飯', '冷奴', 'お刺身', 'お寿司'],
          repeatRating: 5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 1, sourness: 1, bitterness: 0, umami: 5, saltiness: 3, richness: 4, aroma: 4 },
          imageUrl: '/condiments/05_a.jpg',
          dishImageUrl: '/condiments/05_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '発酵食品好き'] },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-006',
          name: '北海道の鰹節香るだし醤油',
          category: 'だし',
          description: '北海道丸大豆醤油に鰹節をベースとしただしをブレンド。上品な甘みと豊かな旨みが広がる、まろやかな味わいのだし醤油です。北海道産素材（丸大豆・小麦・鰹節・日高昆布）にこだわった逸品。調味料選手権2023しょうゆ部門最優秀賞受賞。鰹節の旨みひろがる、甘旨仕立てのだし醤油。',
          origin: '北海道',
          recommendedDishes: ['バター醤油もち', '醤油焼きうどん', 'ズッキーニとツナの和風サラダ', '卵かけご飯', '冷奴'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 2, sourness: 0, bitterness: 0, umami: 4, saltiness: 3, richness: 2, aroma: 4 },
          imageUrl: '/condiments/06_a.jpg',
          dishImageUrl: '/condiments/06_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '旨味好き'] },
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-007',
          name: '底引きたまり',
          category: '醤油',
          description: '圧縮や加熱をしていない純生引溜は酵母と乳酸菌にストレスがかかっていません。活きたままの生詰めです。杉桶天然醸造三年半以上の希少品。木桶下部より滴る自然分離の古式たまり。国産丸大豆使用、三重県鈴鹿市製造。',
          origin: '三重県',
          recommendedDishes: ['刺身', '漬け丼', 'お寿司', '冷奴', 'ステーキ'],
          repeatRating: 5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 1, sourness: 0, bitterness: 1, umami: 5, saltiness: 4, richness: 5, aroma: 3 },
          imageUrl: '/condiments/07_a.jpg',
          dishImageUrl: '/condiments/07_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '希少品コレクター'] },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-008',
          name: 'ひしほ',
          category: '醤油',
          description: '発酵食文化の栄える金沢大野。ヤマトは1911年創業の醤油味噌屋。「ひしほ醤油」は、香りの良さと豊かな味わいで世界のトップシェフから選ばれている一品です。国産丸大豆・国産小麦使用、加熱殺菌せずミクロフィルターでろ過した生醤油。石川県金沢市製造。',
          origin: '石川県',
          recommendedDishes: ['冷奴', '鯛のあら炊き', 'スペアリブ', '和風ハンバーグ', '肉じゃが'],
          repeatRating: 5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 1, sourness: 0, bitterness: 0, umami: 4, saltiness: 3, richness: 3, aroma: 5 },
          imageUrl: '/condiments/08_a.jpeg',
          dishImageUrl: '/condiments/08_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '香り重視'] },
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-009',
          name: '赤ぽん酢',
          category: '酢',
          description: '赤唐辛子の辛味と花ゆずのさわやかな果汁感を合わせたピリッと辛い柚子こしょう風味のぽん酢です。辛味と酸味のバランスにこだわり、後を引く美味しさに仕上げました。調味料選手権2021鍋部門最優秀賞受賞。花ゆずと赤唐辛子のピリ辛ぽん酢。千葉県野田市製造。',
          origin: '千葉県',
          recommendedDishes: ['鍋もの', 'サラダ', '冷奴', '餃子', '焼肉'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 1, sourness: 4, bitterness: 1, umami: 2, saltiness: 2, richness: 1, aroma: 4 },
          imageUrl: '/condiments/09_a.jpg',
          dishImageUrl: '/condiments/09_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '酸味好き'] },
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-010',
          name: '伊達の旨塩',
          category: '塩',
          description: '牡蠣の養殖が盛んな宮城県石巻市の湾の海水をくみ、誰にもまねできないこだわりの自作の釜を使って、家族二人三脚で丁寧につくられています。魚介の旨みと相性が良い旨みをもつ塩。その名のとおり、旨い塩です。（Solco）',
          origin: '宮城県',
          recommendedDishes: ['焼き魚', '刺身', 'ステーキ', '天ぷら', 'サラダ'],
          repeatRating: 4.5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 0, sourness: 0, bitterness: 0, umami: 3, saltiness: 4, richness: 1, aroma: 2 },
          imageUrl: '/condiments/10_a.jpeg',
          dishImageUrl: '/condiments/10_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '地産地消'] },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-011',
          name: '笹川流れの塩',
          category: '塩',
          description: '新潟県の名勝・天然記念物として知られる海岸「笹川流れ」。その海域の海水を何度もさらしの布に通してアクを取り除きながら、じっくり薪で炊きあげられています。さらにワラのツトに1日置いて、えぐみのない塩が出来上がります。（Solco）',
          origin: '新潟県',
          recommendedDishes: ['赤身の魚料理', 'トマト料理', 'おにぎり', 'ステーキ', '天ぷら'],
          repeatRating: 4.5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 0, sourness: 0, bitterness: 0, umami: 2, saltiness: 4, richness: 1, aroma: 2 },
          imageUrl: '/condiments/11_a.jpeg',
          dishImageUrl: '/condiments/11_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '地産地消'] },
          createdAt: new Date(Date.now() - 11 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-012',
          name: '深層海塩ハマネ焼塩',
          category: '塩',
          description: '伊豆大島の噴火溶岩層（玄武岩）で自然にろ過された地下300mの海水をくみ上げ、2008年から製塩開始。24時間稼働のネット式塩田で天日濃縮後、低温の平釜でじっくり結晶。さらに鍋で手を動かしながら焼いた焼塩は、今まで食べたどの焼塩とも違う、一段突き抜けた気品のあるうまさです。（Solco）',
          origin: '東京都（伊豆大島）',
          recommendedDishes: ['肉料理', 'グリル料理', '焼き魚', 'ステーキ', '天ぷら'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 0, sourness: 0, bitterness: 1, umami: 2, saltiness: 4, richness: 2, aroma: 3 },
          imageUrl: '/condiments/12_a.jpeg',
          dishImageUrl: '/condiments/12_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '希少品コレクター'] },
          createdAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-013',
          name: 'マスターネ。木桶醤油',
          category: 'ソース',
          description: '直接料理にかけるだけの簡単調味料。マスタードの種を潰さず、木桶で作った酢と醤油、朝倉産のはちみつ、こだわりの砂糖、食塩で作った調味液に漬け込んだ粒マスタード。コッテリした料理にかけるだけで、サッパリとした味に変わります。調味料選手権2023日本の伝統調味料部門最優秀賞。プチプチ食感がくせになる。福岡県朝倉市製造。',
          origin: '福岡県',
          recommendedDishes: ['野菜和え物', '納豆', '刺身', '豆腐', 'サラダ', 'グリル肉'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 2, sourness: 3, bitterness: 1, umami: 3, saltiness: 2, richness: 2, aroma: 4 },
          imageUrl: '/condiments/13_a.jpg',
          dishImageUrl: '/condiments/13_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '本格派'] },
          createdAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-014',
          name: 'いしる',
          category: 'タレ',
          description: '「いしる」とは魚などの内臓を塩に漬けこんでつくる魚醤です。1〜3年ほど熟成させ、発酵が進むことで旨みが凝縮されます。能登半島のいしるは、秋田の「しょっつる」、四国の「いかなご」と並ぶ日本三大魚醤のひとつ。ベトナムのニョクマムやタイのナンプラーと同じ製法。国産いわし使用、石川県能登町製造。',
          origin: '石川県',
          recommendedDishes: ['チャーハン', '炒め物', 'カレー', 'パスタ', '鍋料理'],
          repeatRating: 4.5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 0, sourness: 0, bitterness: 0, umami: 5, saltiness: 5, richness: 2, aroma: 4 },
          imageUrl: '/condiments/14_a.jpg',
          dishImageUrl: '/condiments/14_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '発酵食品好き'] },
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-015',
          name: 'トマトバ塩',
          category: '塩',
          description: '越前の海からとれた職人の塩を焙煎し石臼で挽き、純度高い福井産バジルとトマト・ガーリックを混ぜ込みました。食欲そそる香りと旨味をご堪能ください。調味料選手権2022塩部門最優秀賞受賞。香りと旨味を、ひと振り。福井県丹生郡製造。',
          origin: '福井県',
          recommendedDishes: ['肉料理', '魚料理', '天ぷら', '卵料理', 'スープ', 'サラダ'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 1, sourness: 1, bitterness: 1, umami: 2, saltiness: 3, richness: 1, aroma: 5 },
          imageUrl: '/condiments/15_a.jpg',
          dishImageUrl: '/condiments/15_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '香り重視'] },
          createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-016',
          name: 'ジンジャーママ しょうが生ふりかけ',
          category: 'スパイス',
          description: '味噌と鰹節が隠し味。辛みを抑えて食べやすく、お子さまにも人気です。国産しょうがを使用した生ふりかけ。調味料選手権2023ご飯のおとも部門最優秀賞・総合3位受賞。大人も子どもも食べられる、しょうがのふりかけ。愛知県豊川市製造。',
          origin: '愛知県',
          recommendedDishes: ['ご飯', '卵かけご飯', '冷奴', '麺類の薬味', '生姜焼き'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 2, sourness: 1, bitterness: 2, umami: 3, saltiness: 2, richness: 1, aroma: 4 },
          imageUrl: '/condiments/16_a.png',
          dishImageUrl: '/condiments/16_b.png',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '万能型'] },
          createdAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-017',
          name: '卵かけごはんにかける醤油',
          category: '醤油',
          description: '一本一本に天然昆布がそのまま入っているので、使うたびに昆布のだしが効いて美味しくなります。日本人の朝食の定番をより一層おいしく。熊本県熊本市製造。',
          origin: '熊本県',
          recommendedDishes: ['卵かけご飯', '冷奴', 'お浸し', '刺身', '焼き魚'],
          repeatRating: 4.5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 3, sourness: 0, bitterness: 0, umami: 4, saltiness: 3, richness: 2, aroma: 3 },
          imageUrl: '/condiments/17_a.jpeg',
          dishImageUrl: '/condiments/17_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '旨味好き'] },
          createdAt: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-018',
          name: '卵に醤油',
          category: '醤油',
          description: '鰹だしベースの卵かけご飯専用醤油。地元の養鶏農家が「うちの卵がめっちゃうまくなる！」と大絶賛。納豆やおひたしにも。茨城県筑西市製造。',
          origin: '茨城県',
          recommendedDishes: ['卵かけご飯', '納豆', 'お浸し', '冷奴', '豆腐料理'],
          repeatRating: 4,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 2, sourness: 0, bitterness: 0, umami: 4, saltiness: 3, richness: 2, aroma: 3 },
          imageUrl: '/condiments/18_a.jpeg',
          dishImageUrl: '/condiments/18_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '旨味好き'] },
          createdAt: new Date(Date.now() - 18 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-019',
          name: 'きくらげラー油',
          category: '辛味',
          description: '愛知県豊川市で愛情込めて育てられた、無農薬栽培の肉厚プリプリのきくらげをふんだんに使用。味がしっかりとしみ込んでいてニンニクのアクセントが効いてます。ピリ辛ラー油味に仕上げたきくらげの佃煮。福島県郡山市製造。',
          origin: '福島県',
          recommendedDishes: ['ごはん', '卵かけご飯', 'チャーハン', '炒め物', '冷奴'],
          repeatRating: 4.5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 1, sourness: 1, bitterness: 2, umami: 4, saltiness: 3, richness: 3, aroma: 3 },
          imageUrl: '/condiments/19_a.jpeg',
          dishImageUrl: '/condiments/19_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '食感重視'] },
          createdAt: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-020',
          name: 'しろたまり',
          category: '醤油',
          description: '奥三河足助大多賀の豊かな自然環境の中、木桶で仕込んだ逸品。厳選した国産小麦と伝統海塩「海の精」を天然水で仕込み、じっくりと熟成させました。愛知県産小麦100%の調味料。愛知県碧南市製造。',
          origin: '愛知県',
          recommendedDishes: ['卵焼き', 'お吸い物', 'ホワイトソース', '冷奴', 'お浸し'],
          repeatRating: 4.5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 4, sourness: 0, bitterness: 0, umami: 3, saltiness: 2, richness: 2, aroma: 3 },
          imageUrl: '/condiments/20_a.jpeg',
          dishImageUrl: '/condiments/20_b.jpeg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '伝統派'] },
          createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-021',
          name: '玉子ごはん専用昆布醤油',
          category: '醤油',
          description: 'ご飯や玉子の持つ甘みを活かす優しい甘味こそが二杯目も美味しく食べれるポイント。甘さの質がポイントの、玉子ごはん専用に設計された昆布醤油。一杯目が美味しいのは当たり前。二杯目がうまくてこそ本物。熊本県熊本市製造。',
          origin: '熊本県',
          recommendedDishes: ['玉子ごはん', '卵かけご飯', '冷奴', 'お浸し', '豆腐料理'],
          repeatRating: 4,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 4, sourness: 0, bitterness: 0, umami: 4, saltiness: 2, richness: 2, aroma: 3 },
          imageUrl: '/condiments/21_a.jpg',
          dishImageUrl: '/condiments/21_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '甘党'] },
          createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'dm-022',
          name: 'みんなのニラ醤油',
          category: '醤油',
          description: '大分特産のニラを丸ごと新鮮なまま特製オリジナル醤油に漬け込んだ万能味変調味料。専用の特製醤油にニラの旨味を凝縮した逸品です。大分県産ニラにこだわった産地指定の一品。ニラで泣ける！大分県大分市製造。',
          origin: '大分県',
          recommendedDishes: ['ご飯', '卵かけごはん', '納豆', '焼肉', 'パスタ', 'チャーハン', '刺身', '鍋の薬味'],
          repeatRating: 4.5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 1, sourness: 0, bitterness: 1, umami: 4, saltiness: 3, richness: 2, aroma: 5 },
          imageUrl: '/condiments/22_a.jpg',
          dishImageUrl: '/condiments/22_b.jpg',
          postedBy: { userId: 'dohman', nickname: '道満調味料研究所', tasteBadges: ['調味料オタク', '万能型'] },
          createdAt: new Date(Date.now() - 22 * 24 * 60 * 60 * 1000).toISOString()
        }
      ];
      // 画像パスに配信先の base を付与（GitHub Pages のサブパス対応）
      const withBasePaths = sampleData.map(c => ({
        ...c,
        imageUrl: withBase(c.imageUrl) as string,
        dishImageUrl: withBase(c.dishImageUrl),
      }));
      setCondiments(withBasePaths);
      localStorage.setItem('condimentsVersion', '4.3');
      }
    };

    fetchCondiments()
      .then(data => { if (data.length > 0) setCondiments(data); else loadFallback(); })
      .catch(err => { console.error('調味料の取得に失敗、サンプルデータを表示します', err); loadFallback(); });

    return () => subscription.unsubscribe();
  }, []);

  const handleUserRegistration = (user: User) => {
    setCurrentUser(user);
    const updatedUsers = [...allUsers, user];
    setAllUsers(updatedUsers);
    setShowUserRegistration(false);
  };

  const handleAddCondiment = async (newCondiment: Omit<Condiment, 'id' | 'createdAt' | 'postedBy'>) => {
    if (!currentUser) {
      setShowLoginModal(true);
      return;
    }
    try {
      if (editingCondiment) {
        // 編集モード：既存の投稿を更新
        const updated = await updateCondiment(editingCondiment.id, newCondiment);
        setCondiments(prev => prev.map(c => c.id === updated.id ? updated : c));
        setEditingCondiment(null);
      } else {
        const inserted = await insertCondiment(newCondiment, currentUser.id);
        setCondiments(prev => [inserted, ...prev]);
        setShareModalName(inserted.name);
      }
    } catch (err) {
      console.error('投稿失敗:', err);
      alert('投稿に失敗しました。もう一度お試しください。');
    }
  };

  const handleViewUser = (userId: string, nickname: string) => {
    setSelectedUserPosts({ userId, nickname });
    setSelectedAggregated(null);
  };

  const getUserPosts = (userId: string) => {
    return condiments.filter(c => c.postedBy.userId === userId);
  };

  const handleToggleLike = async (condimentId: string) => {
    if (!currentUser) { setShowLoginModal(true); return; }
    const liked = likedCondiments.includes(condimentId);
    const newLikes = liked
      ? likedCondiments.filter(id => id !== condimentId)
      : [...likedCondiments, condimentId];
    setLikedCondiments(newLikes);
    try {
      await toggleLike(currentUser.id, condimentId, liked);
    } catch (err) {
      setLikedCondiments(likedCondiments);
      console.error('いいね失敗:', err);
    }
  };

  const handleToggleBookmark = async (condimentId: string) => {
    if (!currentUser) { setShowLoginModal(true); return; }
    const bookmarked = bookmarkedCondiments.includes(condimentId);
    const newBookmarks = bookmarked
      ? bookmarkedCondiments.filter(id => id !== condimentId)
      : [...bookmarkedCondiments, condimentId];
    setBookmarkedCondiments(newBookmarks);
    try {
      await toggleBookmark(currentUser.id, condimentId, bookmarked);
    } catch (err) {
      setBookmarkedCondiments(bookmarkedCondiments);
      console.error('ブックマーク失敗:', err);
    }
  };

  const handleUpdateUser = async (updatedUser: User) => {
    setCurrentUser(updatedUser);
    try {
      await updateProfile(updatedUser.id, {
        nickname: updatedUser.nickname,
        age: updatedUser.age,
        gender: updatedUser.gender,
        prefecture: updatedUser.prefecture,
        city: updatedUser.city,
        taste_badges: updatedUser.tasteBadges,
      });
    } catch (err) {
      console.error('プロフィール更新失敗:', err);
    }
    const updatedUsers = allUsers.map(u => u.id === updatedUser.id ? updatedUser : u);
    setAllUsers(updatedUsers);
  };

  const handleDeletePost = async (postId: string) => {
    try {
      await deleteCondiment(postId);
    } catch (err) {
      console.error('削除失敗:', err);
    }
    setCondiments(prev => prev.filter(c => c.id !== postId));
    setLikedCondiments(prev => prev.filter(id => id !== postId));
    setBookmarkedCondiments(prev => prev.filter(id => id !== postId));
  };

  const getLikedPosts = () => {
    return condiments.filter(c => likedCondiments.includes(c.id));
  };

  const getBookmarkedPosts = () => {
    return condiments.filter(c => bookmarkedCondiments.includes(c.id));
  };

  const handleTabChange = (tab: 'home' | 'search' | 'trends' | 'ranking') => {
    setActiveTab(tab);
    if (tab !== 'search') {
      setSearchTerm('');
      setCommittedSearch('');
      setFilterCategory('すべて');
    }
  };

  // カタカナ → ひらがな
  const toHiragana = (str: string): string =>
    str.replace(/[ァ-ヶ]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0x60));

  // 漢字 → ひらがな読みマップ
  const kanjiReadings: Record<string, string> = {
    '醤油': 'しょうゆ', '味噌': 'みそ', '塩': 'しお', '砂糖': 'さとう',
    '酢': 'す', '油': 'あぶら', '醸造': 'じょうぞう', '本醸造': 'ほんじょうぞう',
    '信州': 'しんしゅう', '白': 'しろ', '黒': 'くろ', '赤': 'あか', '生': 'なま',
    '塩麹': 'しおこうじ', '麹': 'こうじ', '岩塩': 'いわしお', '藻塩': 'もしお',
    '燻製': 'くんせい', '天然': 'てんねん', '一味': 'いちみ', '七味': 'しちみ',
    '唐辛子': 'とうがらし', '胡椒': 'こしょう', '粗びき': 'あらびき',
    '九州': 'きゅうしゅう', '甘口': 'あまくち', '辛口': 'からくち',
    '合わせ': 'あわせ', '麦': 'むぎ', '金山寺': 'きんざんじ', '米': 'こめ',
    '黒砂糖': 'くろざとう', '和三盆': 'わさんぼん',
    'たまり': 'たまり', '白だし': 'しろだし', 'めんつゆ': 'めんつゆ',
    'みりん': 'みりん', '料理酒': 'りょうりしゅ', '酒': 'さけ',
    '海塩': 'かいえん', '岩': 'いわ', '藻': 'も', '燻': 'くん',
  };

  // 検索用に正規化：元の文字列＋ひらがな変換＋漢字読みを結合
  const normalizeForSearch = (str: string): string => {
    const lower = str.toLowerCase();
    const hiragana = toHiragana(lower);
    const parts = new Set([lower, hiragana]);
    for (const [kanji, reading] of Object.entries(kanjiReadings)) {
      if (lower.includes(kanji)) {
        parts.add(lower.replace(new RegExp(kanji, 'g'), reading));
        parts.add(reading);
      }
    }
    return Array.from(parts).join(' ');
  };

  const handleSearch = () => {
    setCommittedSearch(searchTerm);
    if (searchTerm.trim()) {
      logSearch(searchTerm);
      setActiveTab('search');
    }
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setCommittedSearch('');
    setActiveTab('home');
  };

  const aggregatedCondiments = useMemo(() => {
    return aggregateCondiments(condiments);
  }, [condiments]);

  // パーソナライズ: いいね・ブックマーク済みカテゴリのスコアを計算
  const preferredCategories = useMemo(() => {
    const scores: Record<string, number> = {};
    const likedSet = new Set(likedCondiments);
    const bookmarkedSet = new Set(bookmarkedCondiments);
    condiments.forEach(c => {
      if (likedSet.has(c.id)) scores[c.category] = (scores[c.category] ?? 0) + 2;
      if (bookmarkedSet.has(c.id)) scores[c.category] = (scores[c.category] ?? 0) + 1;
    });
    return scores;
  }, [condiments, likedCondiments, bookmarkedCondiments]);

  const scoreCondiment = (agg: AggregatedCondiment, keywords: string[]): number => {
    if (keywords.length === 0) return 0;
    let total = 0;
    const name = agg.name.toLowerCase();
    const nameNorm = normalizeForSearch(agg.name);
    const desc = agg.posts.map(p => p.description.toLowerCase()).join(' ');
    const descNorm = normalizeForSearch(desc);
    const dishes = agg.posts.flatMap(p => p.recommendedDishes).join(' ').toLowerCase();
    const dishesNorm = normalizeForSearch(dishes);
    const categoryNorm = normalizeForSearch(agg.category);

    for (const kw of keywords) {
      const kwNorm = toHiragana(kw.toLowerCase());

      if (name === kw || nameNorm.split(' ').some(n => n === kwNorm)) total += 100;
      else if (name.startsWith(kw) || nameNorm.split(' ').some(n => n.startsWith(kwNorm))) total += 80;
      else if (nameNorm.includes(kwNorm)) total += 60;

      if (categoryNorm.includes(kwNorm)) total += 40;

      const descCount = (descNorm.match(new RegExp(kwNorm, 'g')) || []).length;
      total += Math.min(descCount * 10, 30);

      if (dishesNorm.includes(kwNorm)) total += 10;
    }
    return total;
  };

  const filteredAggregated = useMemo(() => {
    const keywords = committedSearch.toLowerCase().trim().split(/\s+/).filter(Boolean);
    const matchesCategory = (agg: AggregatedCondiment) =>
      filterCategory === 'すべて' || agg.category === filterCategory;

    if (keywords.length === 0) {
      return aggregatedCondiments.filter(matchesCategory);
    }

    return aggregatedCondiments
      .filter(agg => {
        if (!matchesCategory(agg)) return false;
        return scoreCondiment(agg, keywords) > 0;
      })
      .sort((a, b) => scoreCondiment(b, keywords) - scoreCondiment(a, keywords));
  }, [aggregatedCondiments, committedSearch, filterCategory]);

  return (
    <div className="min-h-screen bg-[#faf7f2]">
      <div className="min-h-screen relative pb-20 sm:pb-0 bg-[#faf7f2] transition-all duration-300 max-w-7xl mx-auto">
      <header className="bg-[#faf7f2] border-b border-[#e2d5c0] sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-[#3d1f00] tracking-wide">{t(language, 'siteTitle')}</h1>
            <p className="text-[10px] text-[#a07850] tracking-widest hidden sm:block">Spices from the World</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value as Language)}
              className="px-2 py-1 text-xs bg-[#ede4d3] text-[#7c4a1e] border-none rounded-lg focus:outline-none focus:ring-1 focus:ring-[#c17f3a] cursor-pointer"
            >
              <option value="ja">🇯🇵 日本語</option>
              <option value="en">🇺🇸 English</option>
              <option value="zh">🇨🇳 中文</option>
              <option value="ko">🇰🇷 한국어</option>
              <option value="fr">🇫🇷 Français</option>
              <option value="es">🇪🇸 Español</option>
              <option value="vi">🇻🇳 Tiếng Việt</option>
            </select>
            {isAdmin(currentUser) && (
              <button
                onClick={() => {
                  setShowAdminPanel(true);
                  fetchAllUsers().then(setAllUsers).catch(err => console.error('ユーザー一覧の取得に失敗:', err));
                }}
                className="p-1.5 bg-[#ede4d3] text-[#7c4a1e] rounded-lg hover:bg-[#e2d5c0] transition-colors"
                title={t(language, 'admin')}
              >
                <Shield size={16} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* PC Hamburger Navigation */}
      <div className="hidden sm:block bg-[#faf7f2] border-b border-[#e2d5c0]">
        <div className="max-w-7xl mx-auto px-8 flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowNavMenu(!showNavMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-[#7c4a1e] hover:bg-[#f5ede0] transition-colors"
            >
              {showNavMenu ? <XIcon size={20} /> : <Menu size={20} />}
              <span className="text-sm font-medium">{language === 'ja' ? 'メニュー' : 'Menu'}</span>
            </button>
            {activeTab !== 'home' && (
              <button
                onClick={() => handleTabChange('home')}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-[#7c4a1e] hover:bg-[#f5ede0] transition-colors text-sm"
              >
                <ChevronLeft size={16} />
                {language === 'ja' ? 'ホームに戻る' : 'Back to Home'}
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {currentUser && <NotificationBell currentUser={currentUser} />}
            {currentUser ? (
              <>
                <span className="text-sm text-[#7c4a1e] font-medium hidden md:block">{currentUser.nickname}</span>
                <button
                  onClick={() => setShowMyPage(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-[#ede4d3] text-[#3d1f00] rounded-lg hover:bg-[#e2d5c0] transition-colors text-sm whitespace-nowrap flex-shrink-0"
                >
                  <UserIcon size={16} />
                  {language === 'ja' ? 'マイページ' : 'My Page'}
                </button>
                <button
                  onClick={() => { signOut(); }}
                  className="flex items-center gap-1 px-3 py-2 text-[#a07850] hover:text-[#3d1f00] text-xs border border-[#e2d5c0] rounded-lg whitespace-nowrap flex-shrink-0"
                >
                  {language === 'ja' ? 'ログアウト' : 'Sign out'}
                </button>
              </>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#ede4d3] text-[#3d1f00] rounded-lg hover:bg-[#e2d5c0] transition-colors text-sm whitespace-nowrap flex-shrink-0"
              >
                <UserIcon size={16} />
                {language === 'ja' ? 'ログイン' : 'Sign In'}
              </button>
            )}
            <button
              onClick={() => { if (!currentUser) { setShowLoginModal(true); } else setShowAddForm(true); }}
              className="flex items-center gap-2 px-4 py-2 bg-[#7c4a1e] text-white rounded-lg hover:bg-[#3d1f00] transition-colors text-sm ml-2 whitespace-nowrap flex-shrink-0"
            >
              <Plus size={16} />
              {language === 'ja' ? '投稿する' : 'Post'}
            </button>
          </div>
        </div>
        {/* Dropdown menu */}
        {showNavMenu && (
          <div className="border-t border-[#e2d5c0] bg-white shadow-lg absolute left-0 right-0 z-40">
            <div className="max-w-7xl mx-auto px-8 py-3 flex flex-wrap items-center gap-1">
              {[
                { tab: 'home' as const, icon: <Home size={16} />, label: language === 'ja' ? 'ホーム' : 'Home' },
                { tab: 'search' as const, icon: <Grid size={16} />, label: language === 'ja' ? '調味料一覧' : 'Browse' },
                { tab: 'trends' as const, icon: <TrendingUp size={16} />, label: language === 'ja' ? 'トレンド' : 'Trends' },
              ].map(({ tab, icon, label }) => (
                <button
                  key={tab}
                  onClick={() => { handleTabChange(tab); setShowNavMenu(false); }}
                  className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-colors ${activeTab === tab ? 'bg-[#f5ede0] text-[#3d1f00] font-semibold' : 'text-[#a07850] hover:bg-[#fdf5ea] hover:text-[#3d1f00]'}`}
                >
                  {icon}
                  <span className="text-sm">{label}</span>
                </button>
              ))}
              <button
                onClick={() => { setShowChat(true); setShowNavMenu(false); }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-[#a07850] hover:bg-[#fdf5ea] hover:text-[#3d1f00] transition-colors"
              >
                <MessageCircle size={16} />
                <span className="text-sm">{language === 'ja' ? 'AIチャット' : 'AI Chat'}</span>
              </button>
              <button
                onClick={() => { setShowCombination(true); setShowNavMenu(false); }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-[#a07850] hover:bg-[#fdf5ea] hover:text-[#3d1f00] transition-colors"
              >
                <Sparkles size={16} />
                <span className="text-sm">{language === 'ja' ? '組み合わせ' : 'Combine'}</span>
              </button>
              <button
                onClick={() => { setShowContact(true); setShowNavMenu(false); }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-[#a07850] hover:bg-[#fdf5ea] hover:text-[#3d1f00] transition-colors"
              >
                <Mail size={16} />
                <span className="text-sm">{t(language, 'contactUs')}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      <main className="px-4 py-4 sm:px-8 sm:py-6 bg-[#faf7f2]">

        {activeTab === 'home' && !committedSearch && (
          <div className="mb-8">
            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden mb-4 h-40 sm:h-64 bg-[#3d1f00]">
              <img
                src="https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=1200&h=400&fit=crop"
                alt="Hero"
                className="w-full h-full object-cover opacity-30 mix-blend-luminosity"
              />
              <div className="absolute inset-0 flex flex-col justify-end px-5 pb-5 sm:px-8 sm:pb-8">
                <span className="text-[10px] sm:text-xs text-[#c17f3a] tracking-[3px] uppercase mb-2">Discover · Share · Taste</span>
                <h2 className="text-xl sm:text-3xl font-bold text-white leading-tight mb-3">
                  {language === 'ja' ? '世界の調味料を\n知ろう' : 'Discover World\nCondiments'}
                </h2>
                <div className="hidden sm:flex relative w-full max-w-lg">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a07850]" size={18} />
                  <input
                    type="text"
                    placeholder={language === 'ja' ? '調味料名・説明文で検索...' : 'Search by name or description...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-11 pr-24 py-2.5 rounded-lg text-[#3d1f00] bg-[#faf7f2] border border-[#c17f3a] focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-sm"
                  />
                  <button
                    onClick={handleSearch}
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-[#7c4a1e] text-white text-sm rounded-md hover:bg-[#3d1f00] transition-colors"
                  >
                    {language === 'ja' ? '検索' : 'Search'}
                  </button>
                </div>
              </div>
            </div>

            {/* Search Bar (SP only) */}
            <div className="sm:hidden mb-4">
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[#a07850]" size={15} />
                  <input
                    type="text"
                    placeholder={language === 'ja' ? '調味料名・説明文で検索...' : 'Search by name or description...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-[#e2d5c0] text-[#3d1f00] focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-sm"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2.5 bg-[#7c4a1e] text-white rounded-xl hover:bg-[#3d1f00] transition-colors text-sm font-medium"
                >
                  {language === 'ja' ? '検索' : 'Search'}
                </button>
                <button
                  onClick={() => handleTabChange('ranking')}
                  className="flex items-center gap-1 px-3 py-2.5 bg-[#fdf5ea] border border-[#c17f3a] text-[#7c4a1e] rounded-xl hover:bg-[#f5ede0] transition-colors text-sm font-medium flex-shrink-0"
                  title={language === 'ja' ? 'ランキング' : 'Ranking'}
                >
                  <Trophy size={15} className="text-[#c17f3a]" />
                </button>
              </div>
              {committedSearch && (
                <button
                  onClick={handleSearchClear}
                  className="mt-2 text-xs text-[#a07850] hover:text-[#3d1f00]"
                >
                  ✕ {language === 'ja' ? `「${committedSearch}」をクリア` : `Clear "${committedSearch}"`}
                </button>
              )}
            </div>

            {/* Ranking mini-widget */}
            {aggregatedCondiments.length > 0 && (
              <div className="mb-6 bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
                <div className="px-4 py-2.5 border-b border-[#e2d5c0] bg-[#faf7f2] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Trophy size={14} className="text-[#c17f3a]" />
                    <span className="text-xs font-bold text-[#3d1f00] tracking-wide">{language === 'ja' ? 'いいねランキング TOP3' : 'Top 3 Liked'}</span>
                  </div>
                  <button onClick={() => handleTabChange('ranking')} className="text-[10px] text-[#c17f3a] hover:text-[#7c4a1e] font-medium">
                    {language === 'ja' ? 'もっと見る →' : 'See all →'}
                  </button>
                </div>
                <div className="divide-y divide-[#f0e8de]">
                  {[...aggregatedCondiments].sort((a, b) => b.averageRepeatRating - a.averageRepeatRating).slice(0, 3).map((agg, i) => (
                    <button
                      key={agg.name}
                      onClick={() => setSelectedAggregated(agg)}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-[#fdf5ea] transition-colors text-left"
                    >
                      <span className="text-base font-bold w-6 text-center flex-shrink-0">
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}
                      </span>
                      {agg.representativeImage && (
                        <img src={agg.representativeImage} alt={agg.name} className="w-9 h-9 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-[#3d1f00] truncate">{agg.name}</p>
                        <p className="text-[10px] text-[#a07850]">{agg.origin}</p>
                      </div>
                      <div className="flex items-center gap-0.5 flex-shrink-0">
                        <Star size={11} className="text-[#c17f3a] fill-[#c17f3a]" />
                        <span className="text-xs font-bold text-[#7c4a1e]">{agg.averageRepeatRating.toFixed(1)}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Ad Carousel (below ranking) */}
            <AdCarousel language={language} />

            {/* Category Section */}
            <div className="mb-7">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-bold text-[#3d1f00] tracking-wide">{language === 'ja' ? 'カテゴリーから探す' : 'Browse by Category'}</span>
                <div className="flex-1 h-px bg-[#e2d5c0]" />
              </div>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {['醤油', '味噌', '塩', '酢', '油', 'スパイス', 'ソース', '砂糖', 'ドレッシング', 'タレ', 'だし', '辛味', 'ハーブ', '柑橘'].map((category) => {
                  return (
                    <button
                      key={category}
                      onClick={() => { setFilterCategory(category); handleTabChange('search'); }}
                      className="flex flex-col items-center gap-1.5 flex-shrink-0 group"
                    >
                      <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl overflow-hidden bg-[#fdf5ea] border border-[#e2d5c0] group-hover:border-[#c17f3a] transition-colors flex items-center justify-center p-1.5">
                        <CategoryIllustration category={category} className="w-full h-full" />
                      </div>
                      <span className="text-xs font-medium text-[#7c4a1e] group-hover:text-[#3d1f00] transition-colors">{t(language, CATEGORY_KEYS[category])}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section heading */}
            <div className="flex items-center gap-3 mb-4">
              <span className="text-sm font-bold text-[#3d1f00] tracking-wide">{language === 'ja' ? '最新の調味料' : 'Latest Condiments'}</span>
              <div className="flex-1 h-px bg-[#e2d5c0]" />
            </div>
          </div>
        )}

        {activeTab === 'ranking' && (
          <RankingPage
            aggregatedCondiments={aggregatedCondiments}
            condiments={condiments}
            language={language}
            onViewReviews={setSelectedAggregated}
            likedCondiments={likedCondiments}
          />
        )}

        {activeTab === 'trends' && (
          <TrendsPage
            condiments={condiments}
            likedCondiments={likedCondiments}
            bookmarkedCondiments={bookmarkedCondiments}
            language={language}
            onViewCondiment={setSelectedCondiment}
          />
        )}

        {activeTab === 'search' && (
          <CategoryGrid
            selectedCategory={filterCategory}
            onSelectCategory={setFilterCategory}
            language={language}
          />
        )}

        {activeTab !== 'trends' && committedSearch && filteredAggregated.length > 0 && (
          <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
            <Search size={14} />
            <span>
              {language === 'ja'
                ? `「${committedSearch}」の検索結果 ${filteredAggregated.length}件（関連度順）`
                : `${filteredAggregated.length} results for "${committedSearch}" (by relevance)`}
            </span>
          </div>
        )}

        {activeTab === 'trends' ? null : filteredAggregated.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-4">
              {committedSearch || filterCategory !== 'すべて'
                ? t(language, 'noResults')
                : t(language, 'noCondiments')}
            </p>
            <button
              onClick={() => {
                if (!currentUser) {
                  setShowLoginModal(true);
                } else {
                  setShowAddForm(true);
                }
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              <Plus size={20} />
              {t(language, 'firstCondiment')}
            </button>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
            {(activeTab === 'home' && !committedSearch
              ? [...filteredAggregated].sort((a, b) => {
                  const hasPrefs = Object.keys(preferredCategories).length > 0;
                  const scoreA = hasPrefs ? (preferredCategories[a.category] ?? 0) : 0;
                  const scoreB = hasPrefs ? (preferredCategories[b.category] ?? 0) : 0;
                  if (scoreB !== scoreA) return scoreB - scoreA;
                  return new Date(b.posts[0]?.createdAt || 0).getTime() - new Date(a.posts[0]?.createdAt || 0).getTime();
                }).slice(0, 12)
              : filteredAggregated
            ).map(aggregated => (
              <CondimentCard
                key={aggregated.name}
                aggregated={aggregated}
                onViewReviews={setSelectedAggregated}
                language={language}
                onToggleLike={handleToggleLike}
                onToggleBookmark={handleToggleBookmark}
                likedCondiments={likedCondiments}
                bookmarkedCondiments={bookmarkedCondiments}
              />
            ))}
          </div>
        )}

        {/* Map and Community Section */}
        {activeTab === 'home' && !committedSearch && (
          <div className="mt-8 grid gap-4 grid-cols-1 sm:grid-cols-2">
            {/* Map Section */}
            <div className="bg-white rounded-2xl border border-[#e2d5c0] p-5 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-[#7c4a1e] rounded-l-2xl" />
              <h3 className="text-sm font-bold text-[#3d1f00] mb-3 flex items-center gap-2 pl-2">
                <MapPin size={16} className="text-[#c17f3a]" />
                {language === 'ja' ? '世界の調味料マップ' : 'World Condiments Map'}
              </h3>
              <div className="aspect-video rounded-lg overflow-hidden">
                <CondimentMap condiments={condiments} language={language} />
              </div>
              <p className="text-xs text-[#7c4a1e] mt-3 pl-2">
                {language === 'ja' ? '世界中から集まった調味料の産地を探索しましょう' : 'Explore condiment origins from around the world'}
              </p>
            </div>

            {/* Community Section */}
            <div className="bg-[#fdf5ea] border border-[#e8d5b0] rounded-2xl p-5 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-[#c17f3a]/10 -translate-y-8 translate-x-8" />
              <h3 className="text-sm font-bold text-[#3d1f00] mb-2 flex items-center gap-2">
                <Users size={16} className="text-[#c17f3a]" />
                {language === 'ja' ? 'コミュニティへようこそ' : 'Join Our Community'}
              </h3>
              <p className="text-xs text-[#7c4a1e] mb-4">
                {language === 'ja'
                  ? 'お気に入りの調味料をシェアしましょう'
                  : 'Share your favorite condiments'}
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="bg-white border border-[#e2d5c0] rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#3d1f00]">{condiments.length}</p>
                  <p className="text-[10px] text-[#7c4a1e]">{language === 'ja' ? '投稿数' : 'Total Posts'}</p>
                </div>
                <div className="bg-white border border-[#e2d5c0] rounded-xl p-3 text-center">
                  <p className="text-lg font-bold text-[#3d1f00]">{aggregatedCondiments.length}</p>
                  <p className="text-[10px] text-[#7c4a1e]">{language === 'ja' ? '調味料の種類' : 'Condiment Types'}</p>
                </div>
              </div>
              <button
                onClick={() => { if (!currentUser) setShowLoginModal(true); else setShowAddForm(true); }}
                className="w-full py-2.5 bg-[#7c4a1e] text-white rounded-lg hover:bg-[#3d1f00] transition-colors text-sm font-medium"
              >
                {language === 'ja' ? '今すぐ投稿する' : 'Post Now'}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'home' && !committedSearch && filteredAggregated.length > 8 && (
          <div className="mt-6 text-center">
            <button
              onClick={() => handleTabChange('search')}
              className="px-6 py-2.5 bg-white border border-[#e2d5c0] text-[#7c4a1e] rounded-lg hover:bg-[#fdf5ea] transition-colors text-sm font-medium"
            >
              {language === 'ja' ? `すべて見る（${aggregatedCondiments.length}種類）` : `View all (${aggregatedCondiments.length} types)`}
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          {t(language, 'totalPosts', { count: condiments.length })} / {t(language, 'totalTypes', { count: aggregatedCondiments.length })}
        </div>
        <div className="mt-2 text-center">
          <button
            onClick={() => setShowContact(true)}
            className="inline-flex items-center gap-1 text-xs text-[#a07850] hover:text-[#3d1f00] transition-colors"
          >
            <Mail size={12} />
            {t(language, 'contactUs')}
          </button>
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#faf7f2] border-t border-[#e2d5c0] z-40 safe-area-bottom sm:hidden">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 transition-colors ${
              activeTab === 'home' ? 'text-[#3d1f00]' : 'text-[#b09070] hover:text-[#7c4a1e]'
            }`}
          >
            <Home size={20} />
            <span className="text-[10px] font-medium">{language === 'ja' ? 'ホーム' : 'Home'}</span>
          </button>

          <button
            onClick={() => handleTabChange('search')}
            className={`flex flex-col items-center gap-1 px-3 py-2.5 transition-colors ${
              activeTab === 'search' ? 'text-[#3d1f00]' : 'text-[#b09070] hover:text-[#7c4a1e]'
            }`}
          >
            <Search size={20} />
            <span className="text-[10px] font-medium">{language === 'ja' ? '検索' : 'Search'}</span>
          </button>

          <button
            onClick={() => setShowCombination(true)}
            className="flex flex-col items-center gap-1 px-3 py-2.5 text-[#b09070] hover:text-[#7c4a1e] transition-colors"
          >
            <Sparkles size={20} />
            <span className="text-[10px] font-medium">{language === 'ja' ? '組み合わせ' : 'Combine'}</span>
          </button>

          <button
            onClick={() => setShowChat(true)}
            className="flex flex-col items-center gap-1 px-3 py-2.5 text-[#b09070] hover:text-[#7c4a1e] transition-colors"
          >
            <div className="relative">
              <MessageCircle size={20} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#c17f3a] rounded-full"></span>
            </div>
            <span className="text-[10px] font-medium">{language === 'ja' ? 'AIチャット' : 'AI Chat'}</span>
          </button>

          <button
            onClick={() => {
              if (currentUser) setShowMyPage(true);
              else setShowLoginModal(true);
            }}
            className="flex flex-col items-center gap-1 px-3 py-2.5 text-[#b09070] hover:text-[#7c4a1e] transition-colors"
          >
            <UserIcon size={20} />
            <span className="text-[10px] font-medium">{language === 'ja' ? 'マイページ' : 'My Page'}</span>
          </button>

          <button
            onClick={() => {
              if (!currentUser) {
                alert(t(language, 'needRegistration'));
                setShowLoginModal(true);
              } else {
                setShowAddForm(true);
              }
            }}
            className="flex flex-col items-center gap-1 px-3 py-2.5 text-[#b09070] hover:text-[#7c4a1e] transition-colors"
          >
            <Plus size={20} />
            <span className="text-[10px] font-medium">{language === 'ja' ? '投稿' : 'Post'}</span>
          </button>
        </div>
      </nav>

      {showAddForm && (
        <AddCondimentForm
          onAdd={handleAddCondiment}
          onClose={() => { setShowAddForm(false); setEditingCondiment(null); }}
          language={language}
          condiments={condiments}
          userId={currentUser?.id}
          editingCondiment={editingCondiment}
        />
      )}

      {selectedAggregated && (
        <CondimentReviews
          aggregated={selectedAggregated}
          onClose={() => setSelectedAggregated(null)}
          onViewUser={handleViewUser}
          language={language}
        />
      )}

      {selectedUserPosts && (
        <UserPosts
          nickname={selectedUserPosts.nickname}
          posts={getUserPosts(selectedUserPosts.userId)}
          onClose={() => setSelectedUserPosts(null)}
          onViewCondiment={setSelectedCondiment}
          language={language}
        />
      )}

      {selectedCondiment && (
        <CondimentDetail
          condiment={selectedCondiment}
          onClose={() => setSelectedCondiment(null)}
          language={language}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          isLiked={likedCondiments.includes(selectedCondiment.id)}
          isBookmarked={bookmarkedCondiments.includes(selectedCondiment.id)}
          currentUser={currentUser}
        />
      )}

      {showUserRegistration && (
        <UserRegistration
          onRegister={handleUserRegistration}
          onClose={() => setShowUserRegistration(false)}
          language={language}
        />
      )}

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onSuccess={() => setShowLoginModal(false)}
        />
      )}

      {showAdminPanel && isAdmin(currentUser) && (
        <AdminPanel
          users={allUsers}
          condiments={condiments}
          onClose={() => setShowAdminPanel(false)}
          language={language}
        />
      )}

      {shareModalName && (
        <ShareModal
          condimentName={shareModalName}
          language={language}
          onClose={() => setShareModalName(null)}
        />
      )}

      {showMyPage && currentUser && (
        <MyPage
          user={currentUser}
          posts={getUserPosts(currentUser.id)}
          likedPosts={getLikedPosts()}
          bookmarkedPosts={getBookmarkedPosts()}
          onClose={() => setShowMyPage(false)}
          onViewCondiment={(c) => { setShowMyPage(false); setSelectedCondiment(c); }}
          language={language}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onDeletePost={handleDeletePost}
          onEditPost={(post) => { setEditingCondiment(post); setShowMyPage(false); setShowAddForm(true); }}
          onUpdateUser={handleUpdateUser}
          likedCondiments={likedCondiments}
          bookmarkedCondiments={bookmarkedCondiments}
        />
      )}

      {showChat && (
        <ChatPage
          onClose={() => setShowChat(false)}
          language={language}
          condiments={condiments}
          onViewCondiment={(condiment) => {
            setSelectedCondiment(condiment);
            setShowChat(false);
          }}
        />
      )}
      {showCombination && (
        <CombinationPage
          onClose={() => setShowCombination(false)}
          language={language}
        />
      )}
      {showContact && (
        <ContactModal
          onClose={() => setShowContact(false)}
          language={language}
          currentUser={currentUser}
        />
      )}
      </div>
    </div>
  );
}
