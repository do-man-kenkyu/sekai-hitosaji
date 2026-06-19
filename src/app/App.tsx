import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, User as UserIcon, Shield, Languages, MessageCircle, Home, Grid, TrendingUp, MapPin, Users, Sparkles } from 'lucide-react';
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
import { LoginModal } from './components/LoginModal';
import { NotificationBell } from './components/NotificationBell';
import { Condiment, User, AggregatedCondiment } from './types';
import { aggregateCondiments } from './utils/aggregateCondiments';
import { Language, t, CATEGORY_KEYS } from './i18n/translations';
import { supabase } from '../lib/supabase';
import { getProfile, signOut, updateProfile } from '../lib/auth';
import { fetchCondiments, insertCondiment, deleteCondiment, fetchLikedIds, toggleLike, fetchBookmarkedIds, toggleBookmark } from '../lib/database';

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
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'trends'>('home');
  const [condiments, setCondiments] = useState<Condiment[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
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

    // Supabase から調味料取得
    fetchCondiments().then(data => {
      if (data.length > 0) { setCondiments(data); return; }
      // Supabase が空の場合はサンプルデータを localStorage から読む（移行期）
      const stored = localStorage.getItem('condiments');
      const dataVersion = localStorage.getItem('condimentsVersion');

    // Check if we need to migrate old data
    if (stored && dataVersion === '4.1') {
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
          id: '1',
          name: '本醸造醤油',
          category: '醤油',
          description: '大豆と小麦を主原料とし、伝統的な製法で醸造された醤油です。深いコクと香りが特徴で、煮物や刺身など幅広い料理に使えます。',
          origin: '千葉県',
          recommendedDishes: ['刺身', '冷奴', '煮物', '照り焼き', '卵かけご飯', '漬物', '焼き魚', 'おひたし'],
          repeatRating: 5,
          purchaseLocation: 'スーパー',
          tasteProfile: { sweetness: 2, sourness: 1, bitterness: 1, umami: 5, saltiness: 3, richness: 4, aroma: 3 },
          imageUrl: 'https://images.unsplash.com/photo-1638324396179-61035bc1e645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzb3klMjBzYXVjZSUyMGJvdHRsZXxlbnwxfHx8fDE3Nzk0Mzk3MjR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user1', nickname: '調味料マスター', tasteBadges: ['旨味好き', '伝統派'] },
          createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '2',
          name: '信州味噌',
          category: '味噌',
          description: '長野県で作られる淡色辛口の米味噌。すっきりとした味わいで、味噌汁はもちろん、炒め物や和え物にも最適です。',
          origin: '長野県',
          recommendedDishes: ['味噌汁', '野菜炒め', 'もつ煮込み', '味噌漬け', '豚汁', '味噌田楽', '鯖の味噌煮', '肉味噌'],
          repeatRating: 4,
          purchaseLocation: '道の駅',
          tasteProfile: { sweetness: 2, sourness: 0, bitterness: 1, umami: 4, saltiness: 4, richness: 3, aroma: 4 },
          imageUrl: 'https://images.unsplash.com/photo-1480911620066-b6ccd99c48f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaXNvJTIwcGFzdGUlMjBqYXBhbmVzZXxlbnwxfHx8fDE3Nzk0Mzk3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user2', nickname: '発酵食品ラバー', tasteBadges: ['健康志向', '伝統派'] },
          createdAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '3',
          name: 'ゲランドの塩',
          category: '塩',
          description: 'フランス・ブルターニュ地方の天日塩。ミネラル豊富でまろやかな味わいが特徴。仕上げの一振りに最適です。',
          origin: '海外',
          recommendedDishes: ['ステーキ', 'サラダ', 'パスタ', '焼き魚', 'ローストチキン', 'グリル野菜', 'カルパッチョ', 'バゲット'],
          repeatRating: 5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 0, sourness: 0, bitterness: 0, umami: 2, saltiness: 5, richness: 1, aroma: 1 },
          imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWElMjBzYWx0fGVufDF8fHx8MTc3OTQzOTcyNnww&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user3', nickname: 'ソルティエ', tasteBadges: ['塩味好き', 'グルメ', '舌が肥えている'] },
          createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '4',
          name: '米酢',
          category: '酢',
          description: '国産米を100%使用した純米酢。まろやかな酸味とふくよかな旨みが特徴で、寿司飯や酢の物に最適です。',
          origin: '京都府',
          recommendedDishes: ['寿司飯', '酢の物', 'ピクルス', '南蛮漬け', 'マリネ', '紅白なます', '酢豚', 'ちらし寿司'],
          repeatRating: 4,
          purchaseLocation: 'スーパー',
          tasteProfile: { sweetness: 1, sourness: 5, bitterness: 0, umami: 2, saltiness: 1, richness: 2, aroma: 4 },
          imageUrl: 'https://images.unsplash.com/photo-1516684732162-798a0062be99?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxyaWNlJTIwdmluZWdhcnxlbnwxfHx8fDE3Nzk0NDAyNjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user4', nickname: '和食の達人', tasteBadges: ['酸味好き', '伝統派'] },
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '5',
          name: 'ごま油',
          category: '油',
          description: '香ばしく焙煎したごまから抽出した純正ごま油。豊かな香りが料理を引き立てます。',
          origin: '日本',
          recommendedDishes: ['ナムル', 'チャーハン', '中華スープ', 'サラダ', 'ラー油', '棒棒鶏', '坦々麺', '餃子のタレ'],
          repeatRating: 5,
          purchaseLocation: 'スーパー',
          tasteProfile: { sweetness: 1, sourness: 0, bitterness: 1, umami: 3, saltiness: 1, richness: 4, aroma: 5 },
          imageUrl: 'https://images.unsplash.com/photo-1552592074-ea7a91b851b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZXNhbWUlMjBvaWx8ZW58MXx8fHwxNzc5NDQwMjcwfDA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user5', nickname: 'アジア料理好き', tasteBadges: ['万能型', '冒険派'] },
          createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '6',
          name: '一味唐辛子',
          category: 'スパイス',
          description: '国産唐辛子100%使用。辛さの中にも旨みがあり、うどんや麻婆豆腐などに最適です。',
          origin: '京都府',
          recommendedDishes: ['うどん', '麻婆豆腐', '餃子', 'ラーメン', '焼き鳥', 'キムチ鍋', '担々麺', '四川風炒め物'],
          repeatRating: 4,
          purchaseLocation: '道の駅',
          tasteProfile: { sweetness: 0, sourness: 0, bitterness: 1, umami: 2, saltiness: 1, richness: 2, aroma: 4 },
          imageUrl: 'https://images.unsplash.com/photo-1567539549213-cc1697632146?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGlsaSUyMHBlcHBlciUyMHNwaWNlfGVufDF8fHx8MTc3OTQ0MDI3MXww&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user6', nickname: 'スパイシー太郎', tasteBadges: ['辛党', '冒険派'] },
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '7',
          name: 'ウスターソース',
          category: 'ソース',
          description: '野菜と果実をじっくり煮込んだ伝統的なウスターソース。串カツやコロッケに最適です。',
          origin: '大阪府',
          recommendedDishes: ['串カツ', 'コロッケ', 'お好み焼き', '焼きそば', 'たこ焼き', 'とんかつ', 'エビフライ', 'オムライス'],
          repeatRating: 4,
          purchaseLocation: 'スーパー',
          tasteProfile: { sweetness: 3, sourness: 2, bitterness: 1, umami: 3, saltiness: 2, richness: 3, aroma: 3 },
          imageUrl: 'https://images.unsplash.com/photo-1662523978645-8c0bfb15f2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3b3JjZXN0ZXJzaGlyZSUyMHNhdWNlfGVufDF8fHx8MTc3OTQ0MDI3Mnww&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user7', nickname: '関西グルメ', tasteBadges: ['旨味好き', '万能型'] },
          createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '8',
          name: 'きび砂糖',
          category: '砂糖',
          description: 'サトウキビから作られた自然な甘さが特徴の砂糖。ミネラルが豊富で、煮物に深いコクを与えます。',
          origin: '沖縄県',
          recommendedDishes: ['煮物', '照り焼き', 'あんこ', 'すき焼き', '肉じゃが', 'きんぴらごぼう', '大学芋', '甘露煮'],
          repeatRating: 4,
          purchaseLocation: 'スーパー',
          tasteProfile: { sweetness: 5, sourness: 0, bitterness: 0, umami: 1, saltiness: 0, richness: 2, aroma: 2 },
          imageUrl: 'https://images.unsplash.com/photo-1594813592981-5f97b07dd392?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxyaWNlJTIwdmluZWdhcnxlbnwxfHx8fDE3Nzk0NDAyNjl8MA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user8', nickname: 'スイーツ職人', tasteBadges: ['甘党', '健康志向'] },
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '9',
          name: '白だし',
          category: 'その他',
          description: '鰹節と昆布の旨みを凝縮した万能調味料。出汁巻き卵や茶碗蒸しに最適です。',
          origin: '愛知県',
          recommendedDishes: ['出汁巻き卵', '茶碗蒸し', 'おでん', 'うどんつゆ', '親子丼', '煮浸し', '天つゆ', '雑煮'],
          repeatRating: 5,
          purchaseLocation: 'スーパー',
          tasteProfile: { sweetness: 1, sourness: 0, bitterness: 0, umami: 5, saltiness: 4, richness: 4, aroma: 4 },
          imageUrl: 'https://images.unsplash.com/photo-1638324396179-61035bc1e645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxzb3klMjBzYXVjZSUyMGJvdHRsZXxlbnwxfHx8fDE3Nzk0Mzk3MjR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user9', nickname: '出汁マニア', tasteBadges: ['旨味好き', '舌が肥えている', '伝統派'] },
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '10',
          name: 'バルサミコ酢',
          category: '酢',
          description: 'イタリア・モデナ産の伝統的なバルサミコ酢。濃厚で芳醇な香りが特徴で、サラダやカルパッチョに最適です。',
          origin: 'イタリア',
          recommendedDishes: ['カプレーゼ', 'カルパッチョ', 'ローストビーフ', 'アイスクリーム', 'リゾット', 'マリネ', 'フルーツサラダ', 'チーズ'],
          repeatRating: 5,
          purchaseLocation: 'デパート',
          tasteProfile: { sweetness: 3, sourness: 4, bitterness: 1, umami: 2, saltiness: 1, richness: 3, aroma: 5 },
          imageUrl: 'https://images.unsplash.com/photo-1565275369836-d86de057255a?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHx3b3JjZXN0ZXJzaGlyZSUyMHNhdWNlfGVufDF8fHx8MTc3OTQ0MDI3Mnww&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user10', nickname: 'イタリアン愛好家', tasteBadges: ['酸味好き', 'グルメ', '冒険派'] },
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '11',
          name: '本醸造醤油',
          category: '醤油',
          description: '別メーカーの醤油ですが、こちらも深い味わいで気に入っています。刺身との相性が抜群です。',
          origin: '兵庫県',
          recommendedDishes: ['刺身', '寿司', '卵かけご飯', '豆腐ステーキ', 'あさりの酒蒸し', '焼きおにぎり', 'だし茶漬け'],
          repeatRating: 4,
          purchaseLocation: 'デパート',
          tasteProfile: { sweetness: 2, sourness: 1, bitterness: 1, umami: 4, saltiness: 3, richness: 3, aroma: 4 },
          imageUrl: 'https://images.unsplash.com/photo-1697026993856-261121bb5025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwzfHxzb3klMjBzYXVjZSUyMGJvdHRsZXxlbnwxfHx8fDE3Nzk0Mzk3MjR8MA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user11', nickname: '魚料理研究家', tasteBadges: ['旨味好き', '本格派', '舌が肥えている'] },
          createdAt: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '12',
          name: 'エクストラバージンオリーブオイル',
          category: '油',
          description: 'イタリア産の高品質なオリーブオイル。フルーティーな香りと後味のピリッとした辛みが特徴です。',
          origin: '海外',
          recommendedDishes: ['カプレーゼ', 'パスタ', 'サラダ', 'カルパッチョ', 'バジルパスタ', 'ブルスケッタ', 'アヒージョ', 'マリネ'],
          repeatRating: 5,
          purchaseLocation: 'オンライン',
          tasteProfile: { sweetness: 1, sourness: 1, bitterness: 2, umami: 1, saltiness: 0, richness: 4, aroma: 5 },
          imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user10', nickname: 'イタリアン愛好家', tasteBadges: ['酸味好き', 'グルメ', '冒険派'] },
          createdAt: new Date(Date.now() - 0.3 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '13',
          name: '粗びき黒胡椒',
          category: 'スパイス',
          description: 'インド産の黒胡椒を粗びきにしたもの。香りが強く、肉料理に最適です。',
          origin: '海外',
          recommendedDishes: ['ステーキ', 'ペペロンチーノ', 'カルボナーラ', 'サラダ', 'アクアパッツァ', 'クリームパスタ', 'マッシュルームソテー', 'グリルチキン'],
          repeatRating: 5,
          purchaseLocation: '専門店',
          tasteProfile: { sweetness: 0, sourness: 0, bitterness: 2, umami: 1, saltiness: 0, richness: 1, aroma: 5 },
          imageUrl: 'https://images.unsplash.com/photo-1599987662084-97832741bfa2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxjaGlsaSUyMHBlcHBlciUyMHNwaWNlfGVufDF8fHx8MTc3OTQ0MDI3MXww&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user12', nickname: 'スパイス研究家', tasteBadges: ['スパイスマニア', '香り重視', '本格派'] },
          createdAt: new Date(Date.now() - 0.2 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '14',
          name: '信州味噌',
          category: '味噌',
          description: '別の蔵元の信州味噌。こちらはより辛口で、野菜の甘みを引き立てます。',
          origin: '長野県',
          recommendedDishes: ['豚汁', '味噌ラーメン', '鯖の味噌煮', '味噌カツ', '味噌おでん', '豚の角煮', '味噌チャーハン', 'ホイコーロー'],
          repeatRating: 5,
          purchaseLocation: '道の駅',
          tasteProfile: { sweetness: 1, sourness: 0, bitterness: 2, umami: 5, saltiness: 5, richness: 4, aroma: 3 },
          imageUrl: 'https://images.unsplash.com/photo-1587754823609-6c7ead28a09f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwyfHxtaXNvJTIwcGFzdGUlMjBqYXBhbmVzZXxlbnwxfHx8fDE3Nzk0Mzk3MjV8MA&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user13', nickname: '信州出身の主婦', tasteBadges: ['発酵食品好き', '地産地消', '伝統派'] },
          createdAt: new Date(Date.now() - 0.1 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: '15',
          name: '天然はちみつ',
          category: 'その他',
          description: '国産アカシアのはちみつ。透明感のある甘さと上品な香りが特徴です。',
          origin: '北海道',
          recommendedDishes: ['ヨーグルト', 'パンケーキ', '紅茶', 'チーズ', 'トースト', 'フレンチトースト', 'グラノーラ', 'スコーン'],
          repeatRating: 5,
          purchaseLocation: '道の駅',
          tasteProfile: { sweetness: 5, sourness: 0, bitterness: 0, umami: 0, saltiness: 0, richness: 3, aroma: 4 },
          imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784320?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080',
          postedBy: { userId: 'user8', nickname: 'スイーツ職人', tasteBadges: ['甘党', '健康志向'] },
          createdAt: new Date(Date.now() - 0.05 * 24 * 60 * 60 * 1000).toISOString()
        },
        // 醤油 追加
        { id: '16', name: 'たまり醤油', category: '醤油', description: '大豆を主原料とした濃厚でとろみのある醤油。深いコクと旨みで刺身や照り焼きに最適です。', origin: '愛知県', recommendedDishes: ['刺身', '照り焼き', 'うなぎのたれ', '煮物'], repeatRating: 5, purchaseLocation: '専門店', tasteProfile: { sweetness: 1, sourness: 0, bitterness: 1, umami: 5, saltiness: 4, richness: 5, aroma: 4 }, imageUrl: 'https://images.unsplash.com/photo-1697026993856-261121bb5025?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user14', nickname: '和食研究家', tasteBadges: ['旨味好き', '本格派'] }, createdAt: new Date(Date.now() - 42 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '17', name: '九州甘口醤油', category: '醤油', description: '九州特有の甘みが強い醤油。刺身にそのままつけるとほんのり甘くておいしい。', origin: '福岡県', recommendedDishes: ['刺身', '卵かけご飯', '冷奴', '煮物'], repeatRating: 4, purchaseLocation: 'スーパー', tasteProfile: { sweetness: 4, sourness: 0, bitterness: 0, umami: 4, saltiness: 2, richness: 3, aroma: 3 }, imageUrl: 'https://images.unsplash.com/photo-1638324396179-61035bc1e645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user15', nickname: '福岡在住', tasteBadges: ['甘党', '地産地消'] }, createdAt: new Date(Date.now() - 43 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '18', name: '生醤油', category: '醤油', description: '加熱処理をしていないフレッシュな醤油。豊かな香りとまろやかな味わいがかけ醤油に最適。', origin: '千葉県', recommendedDishes: ['冷奴', 'カルパッチョ', 'サラダ', '卵かけご飯'], repeatRating: 4, purchaseLocation: 'デパート', tasteProfile: { sweetness: 1, sourness: 1, bitterness: 0, umami: 4, saltiness: 3, richness: 3, aroma: 5 }, imageUrl: 'https://images.unsplash.com/photo-1638324396179-61035bc1e645?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user16', nickname: 'フレッシュ派', tasteBadges: ['香り重視', '繊細な味覚'] }, createdAt: new Date(Date.now() - 44 * 24 * 60 * 60 * 1000).toISOString() },
        // 味噌 追加
        { id: '19', name: '白味噌', category: '味噌', description: '短期間で仕込む甘口の米味噌。まろやかな甘みと上品な香りで西京漬けに欠かせない。', origin: '京都府', recommendedDishes: ['西京焼き', '白味噌雑煮', '田楽', '味噌汁'], repeatRating: 4, purchaseLocation: '専門店', tasteProfile: { sweetness: 4, sourness: 0, bitterness: 0, umami: 3, saltiness: 2, richness: 3, aroma: 3 }, imageUrl: 'https://images.unsplash.com/photo-1480911620066-b6ccd99c48f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user17', nickname: '京料理好き', tasteBadges: ['甘党', '伝統派'] }, createdAt: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '20', name: '赤だし味噌', category: '味噌', description: '豆味噌ベースの辛口な赤い味噌。名古屋飯には欠かせない濃厚な味わい。', origin: '愛知県', recommendedDishes: ['赤だし味噌汁', '味噌煮込みうどん', '串カツ', '味噌おでん'], repeatRating: 4, purchaseLocation: 'スーパー', tasteProfile: { sweetness: 0, sourness: 0, bitterness: 2, umami: 5, saltiness: 5, richness: 4, aroma: 3 }, imageUrl: 'https://images.unsplash.com/photo-1587754823609-6c7ead28a09f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user18', nickname: '名古屋っ子', tasteBadges: ['旨味好き', '地産地消'] }, createdAt: new Date(Date.now() - 46 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '21', name: '金山寺味噌', category: '味噌', description: '野菜や生姜を混ぜ込んだなめ味噌。そのままご飯にのせると止まらないおいしさ。', origin: '和歌山県', recommendedDishes: ['ご飯のお供', '豆腐のせ', 'きゅうり添え', '酒のつまみ'], repeatRating: 5, purchaseLocation: '専門店', tasteProfile: { sweetness: 3, sourness: 0, bitterness: 0, umami: 4, saltiness: 3, richness: 3, aroma: 4 }, imageUrl: 'https://images.unsplash.com/photo-1480911620066-b6ccd99c48f3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user19', nickname: '発酵食品マニア', tasteBadges: ['発酵食品好き', '伝統派'] }, createdAt: new Date(Date.now() - 47 * 24 * 60 * 60 * 1000).toISOString() },
        // 塩 追加
        { id: '22', name: 'ヒマラヤ岩塩', category: '塩', description: 'パキスタン産のピンク色の岩塩。ミネラル豊富でまろやかな塩味が料理を引き立てる。', origin: '海外', recommendedDishes: ['ステーキ', 'サラダ', 'グリル野菜', 'スープ'], repeatRating: 4, purchaseLocation: 'オンライン', tasteProfile: { sweetness: 0, sourness: 0, bitterness: 0, umami: 2, saltiness: 4, richness: 1, aroma: 1 }, imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user20', nickname: '健康マニア', tasteBadges: ['健康志向', '冒険派'] }, createdAt: new Date(Date.now() - 48 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '23', name: '藻塩', category: '塩', description: '海藻のエキスを含んだ和の塩。ほのかな磯の香りと旨みが料理を引き立てます。', origin: '広島県', recommendedDishes: ['おにぎり', '天ぷら', '刺身', '焼き鳥'], repeatRating: 5, purchaseLocation: '道の駅', tasteProfile: { sweetness: 0, sourness: 0, bitterness: 0, umami: 3, saltiness: 4, richness: 2, aroma: 3 }, imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user21', nickname: '瀬戸内グルメ', tasteBadges: ['旨味好き', '地産地消'] }, createdAt: new Date(Date.now() - 49 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '24', name: '燻製塩', category: '塩', description: 'サクラチップで燻した塩。スモーキーな香りが肉料理や卵料理を格上げします。', origin: '北海道', recommendedDishes: ['ステーキ', '目玉焼き', 'BBQ', 'バター'], repeatRating: 4, purchaseLocation: '専門店', tasteProfile: { sweetness: 0, sourness: 0, bitterness: 1, umami: 2, saltiness: 4, richness: 2, aroma: 5 }, imageUrl: 'https://images.unsplash.com/photo-1518110925495-5fe2fda0442c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user22', nickname: 'BBQマスター', tasteBadges: ['香り重視', '冒険派'] }, createdAt: new Date(Date.now() - 50 * 24 * 60 * 60 * 1000).toISOString() },
        // ソース 追加
        { id: '25', name: 'オイスターソース', category: 'ソース', description: '牡蠣のエキスを凝縮した中華の万能調味料。濃厚な旨みと甘みで炒め物を格上げします。', origin: '中国', recommendedDishes: ['青梗菜炒め', '中華炒め全般', '焼きそば', 'ガパオライス'], repeatRating: 5, purchaseLocation: 'スーパー', tasteProfile: { sweetness: 2, sourness: 0, bitterness: 0, umami: 5, saltiness: 3, richness: 4, aroma: 3 }, imageUrl: 'https://images.unsplash.com/photo-1662523978645-8c0bfb15f2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user23', nickname: '中華料理好き', tasteBadges: ['旨味好き', '万能型'] }, createdAt: new Date(Date.now() - 51 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '26', name: 'バーベキューソース', category: 'ソース', description: 'トマト・スモーク・スパイスを合わせたアメリカンソース。BBQの肉に塗って焼くと最高。', origin: 'アメリカ', recommendedDishes: ['BBQチキン', 'スペアリブ', 'ハンバーガー', 'ポーク'], repeatRating: 4, purchaseLocation: 'スーパー', tasteProfile: { sweetness: 3, sourness: 2, bitterness: 1, umami: 2, saltiness: 2, richness: 3, aroma: 4 }, imageUrl: 'https://images.unsplash.com/photo-1662523978645-8c0bfb15f2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user24', nickname: 'BBQ好き', tasteBadges: ['冒険派', '肉好き'] }, createdAt: new Date(Date.now() - 52 * 24 * 60 * 60 * 1000).toISOString() },
        { id: '27', name: 'タバスコ', category: 'ソース', description: 'アメリカ発の有名なペッパーソース。ピザやパスタに数滴でパンチが出る。', origin: 'アメリカ', recommendedDishes: ['ピザ', 'パスタ', 'タコス', 'スープ', '卵料理'], repeatRating: 4, purchaseLocation: 'スーパー', tasteProfile: { sweetness: 0, sourness: 3, bitterness: 0, umami: 1, saltiness: 2, richness: 1, aroma: 3 }, imageUrl: 'https://images.unsplash.com/photo-1662523978645-8c0bfb15f2f8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixlib=rb-4.1.0&q=80&w=1080', postedBy: { userId: 'user25', nickname: '辛いもの好き', tasteBadges: ['辛党', '冒険派'] }, createdAt: new Date(Date.now() - 53 * 24 * 60 * 60 * 1000).toISOString() }
      ];
      setCondiments(sampleData);
    });

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
      const inserted = await insertCondiment(newCondiment, currentUser.id);
      setCondiments(prev => [inserted, ...prev]);
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

  const handleTabChange = (tab: 'home' | 'search' | 'trends') => {
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
    if (searchTerm.trim()) setActiveTab('search');
  };

  const handleSearchClear = () => {
    setSearchTerm('');
    setCommittedSearch('');
    setActiveTab('home');
  };

  const aggregatedCondiments = useMemo(() => {
    return aggregateCondiments(condiments);
  }, [condiments]);

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto sm:max-w-7xl min-h-screen relative pb-20 sm:pb-0 bg-white">
      <header className="bg-white shadow-sm border-b sticky top-0 z-30">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-lg font-bold text-gray-900">{t(language, 'siteTitle')}</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-0.5 px-1.5 py-1 bg-gray-100 rounded-lg">
              <Languages size={12} className="text-gray-600 mr-0.5" />
              <button
                onClick={() => handleLanguageChange('ja')}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  language === 'ja' ? 'bg-blue-500 text-white' : 'text-gray-600'
                }`}
              >
                JP
              </button>
              <button
                onClick={() => handleLanguageChange('en')}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  language === 'en' ? 'bg-blue-500 text-white' : 'text-gray-600'
                }`}
              >
                EN
              </button>
            </div>
            <button
              onClick={() => setShowAdminPanel(true)}
              className="p-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
              title={t(language, 'admin')}
            >
              <Shield size={16} />
            </button>
          </div>
        </div>
      </header>

      {/* PC Tab Navigation */}
      <div className="hidden sm:block bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-8 flex items-center gap-1">
            <button
              onClick={() => handleTabChange('home')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'home' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Home size={16} />
              <span className="text-sm font-medium">{language === 'ja' ? 'ホーム' : 'Home'}</span>
            </button>
            <button
              onClick={() => handleTabChange('search')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'search' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <Grid size={16} />
              <span className="text-sm font-medium">{language === 'ja' ? '調味料一覧' : 'Browse'}</span>
            </button>
            <button
              onClick={() => handleTabChange('trends')}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${activeTab === 'trends' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >
              <TrendingUp size={16} />
              <span className="text-sm font-medium">{language === 'ja' ? 'トレンド' : 'Trends'}</span>
            </button>
            <button
              onClick={() => setShowChat(true)}
              className="flex items-center gap-2 px-4 py-3 border-b-2 border-transparent text-gray-500 hover:text-green-600 transition-colors"
            >
              <MessageCircle size={16} />
              <span className="text-sm font-medium">{language === 'ja' ? 'AIチャット' : 'AI Chat'}</span>
            </button>
            <div className="flex-1" />
            {currentUser && <NotificationBell currentUser={currentUser} />}
            <button
              onClick={() => {
                if (currentUser) setShowMyPage(true);
                else setShowLoginModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
            >
              <UserIcon size={16} />
              {currentUser ? currentUser.nickname : (language === 'ja' ? 'ログイン' : 'Sign In')}
            </button>
            {currentUser && (
              <button
                onClick={() => { signOut(); }}
                className="flex items-center gap-1 px-3 py-2 text-gray-400 hover:text-gray-600 text-xs border rounded-lg"
              >
                ログアウト
              </button>
            )}
            <button
              onClick={() => {
                if (!currentUser) { setShowLoginModal(true); }
                else setShowAddForm(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm ml-2"
            >
              <Plus size={16} />
              {language === 'ja' ? '投稿する' : 'Post'}
            </button>
          </div>
        </div>

      <main className="px-4 py-4 sm:px-8 sm:py-6 bg-white">

        {activeTab === 'home' && !committedSearch && (
          <div className="mb-8">
            {/* Hero Section */}
            <div className="relative rounded-2xl overflow-hidden mb-3 h-36 sm:h-64">
              <img
                src="https://images.unsplash.com/photo-1506368249639-73a05d6f6488?w=1200&h=400&fit=crop"
                alt="Hero"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/40 flex flex-col items-center justify-center text-white px-4">
                <h2 className="text-2xl sm:text-4xl font-black mb-1 text-center drop-shadow-lg">
                  {language === 'ja' ? '世界の調味料を知ろう' : 'Discover World Condiments'}
                </h2>
                <p className="text-sm sm:text-lg sm:mb-4 text-center drop-shadow">
                  {language === 'ja'
                    ? 'あなたの知らない調味料の世界へようこそ'
                    : 'Welcome to a world of condiments'}
                </p>
                <div className="hidden sm:block relative w-full max-w-lg">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                    <input
                      type="text"
                      placeholder={language === 'ja' ? '調味料名・説明文で検索...' : 'Search by name or description...'}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      className="w-full pl-12 pr-20 py-3 rounded-full text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 shadow-lg"
                    />
                    <button
                      onClick={handleSearch}
                      className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-1.5 bg-orange-500 text-white text-sm rounded-full hover:bg-orange-600 transition-colors"
                    >
                      {language === 'ja' ? '検索' : 'Search'}
                    </button>
                  </div>
              </div>
            </div>

            {/* Search Bar (SP only) */}
            <div className="sm:hidden mb-5">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder={language === 'ja' ? '調味料名・説明文で検索...' : 'Search by name or description...'}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-white border border-gray-200 text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-400 shadow-sm text-sm"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-4 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors text-sm font-medium"
                >
                  {language === 'ja' ? '検索' : 'Search'}
                </button>
              </div>
              {committedSearch && (
                <button
                  onClick={handleSearchClear}
                  className="mt-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕ {language === 'ja' ? `「${committedSearch}」をクリア` : `Clear "${committedSearch}"`}
                </button>
              )}
            </div>

            <div className="grid grid-cols-5 gap-2 mb-5">
              <button
                onClick={() => handleTabChange('search')}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm group"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Grid size={20} className="text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{language === 'ja' ? '調味料一覧' : 'Browse All'}</span>
              </button>

              <button
                onClick={() => {
                  if (currentUser) setShowMyPage(true);
                  else setShowLoginModal(true);
                }}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-300 hover:bg-purple-50 transition-all shadow-sm group"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <UserIcon size={20} className="text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{language === 'ja' ? 'マイページ' : 'My Page'}</span>
              </button>

              <button
                onClick={() => setShowChat(true)}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:bg-green-50 transition-all shadow-sm group"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <MessageCircle size={20} className="text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{language === 'ja' ? 'AIチャット' : 'AI Chat'}</span>
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
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all shadow-sm group"
              >
                <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors">
                  <Plus size={20} className="text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{language === 'ja' ? '投稿する' : 'Add Post'}</span>
              </button>

              <button
                onClick={() => setShowCombination(true)}
                className="flex flex-col items-center gap-1 p-3 bg-white rounded-xl border border-gray-200 hover:border-pink-300 hover:bg-pink-50 transition-all shadow-sm group"
              >
                <div className="w-10 h-10 bg-pink-100 rounded-full flex items-center justify-center group-hover:bg-pink-200 transition-colors">
                  <Sparkles size={20} className="text-pink-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{language === 'ja' ? '組み合わせ' : 'Combine'}</span>
              </button>
            </div>

            {/* Category Section with Horizontal Scroll */}
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                {language === 'ja' ? 'カテゴリーから探す' : 'Browse by Category'}
              </h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                {['醤油', '味噌', '塩', '酢', '油', 'スパイス', 'ソース', '砂糖'].map((category) => {
                  const categoryCondiment = condiments.find(c => c.category === category);
                  return (
                    <button
                      key={category}
                      onClick={() => {
                        setFilterCategory(category);
                        handleTabChange('search');
                      }}
                      className="flex flex-col items-center gap-2 flex-shrink-0 hover:opacity-75 transition-opacity"
                    >
                      <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-white border-2 border-orange-200 shadow-sm">
                        {categoryCondiment?.imageUrl ? (
                          <img
                            src={categoryCondiment.imageUrl}
                            alt={category}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-orange-50 to-amber-50">
                            🧂
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium text-gray-700">{t(language, CATEGORY_KEYS[category])}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <h2 className="text-lg font-semibold text-gray-800 mb-3">
              {language === 'ja' ? '最新の調味料' : 'Latest Condiments'}
            </h2>
          </div>
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
            {(activeTab === 'home' && !committedSearch
              ? [...filteredAggregated].sort((a, b) =>
                  new Date(b.posts[0]?.createdAt || 0).getTime() - new Date(a.posts[0]?.createdAt || 0).getTime()
                ).slice(0, 12)
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
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-orange-500" />
                {language === 'ja' ? '世界の調味料マップ' : 'World Condiments Map'}
              </h3>
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-green-50 rounded-lg flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?w=600&h=400&fit=crop"
                  alt="World Map"
                  className="w-full h-full object-cover rounded-lg opacity-60"
                />
              </div>
              <p className="text-sm text-gray-600 mt-4">
                {language === 'ja'
                  ? '世界中から集まった調味料の産地を探索しましょう'
                  : 'Explore condiment origins from around the world'}
              </p>
            </div>

            {/* Community Section */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl shadow-sm border border-orange-100 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Users size={20} className="text-orange-500" />
                {language === 'ja' ? 'コミュニティへようこそ' : 'Join Our Community'}
              </h3>
              <p className="text-gray-700 mb-4">
                {language === 'ja'
                  ? '調味料愛好家のコミュニティに参加して、あなたのお気に入りの調味料をシェアしましょう！'
                  : 'Join our community of condiment lovers and share your favorites!'}
              </p>
              <div className="space-y-3">
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <div className="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{condiments.length}</p>
                    <p className="text-xs text-gray-600">{language === 'ja' ? '投稿数' : 'Total Posts'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white rounded-lg p-3">
                  <div className="w-10 h-10 bg-amber-200 rounded-full flex items-center justify-center">
                    <span className="text-lg">🌍</span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{aggregatedCondiments.length}</p>
                    <p className="text-xs text-gray-600">{language === 'ja' ? '調味料の種類' : 'Condiment Types'}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  if (!currentUser) {
                    setShowLoginModal(true);
                  } else {
                    setShowAddForm(true);
                  }
                }}
                className="w-full mt-4 px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors font-medium"
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
              className="px-6 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
            >
              {language === 'ja' ? `すべて見る（${aggregatedCondiments.length}種類）` : `View all (${aggregatedCondiments.length} types)`}
            </button>
          </div>
        )}

        <div className="mt-6 text-center text-xs text-gray-400">
          {t(language, 'totalPosts', { count: condiments.length })} / {t(language, 'totalTypes', { count: aggregatedCondiments.length })}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40 safe-area-bottom sm:hidden">
        <div className="flex items-center justify-around max-w-md mx-auto">
          <button
            onClick={() => handleTabChange('home')}
            className={`flex flex-col items-center gap-1 px-4 py-3 transition-colors ${
              activeTab === 'home' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Home size={22} />
            <span className="text-xs">{language === 'ja' ? 'ホーム' : 'Home'}</span>
          </button>

          <button
            onClick={() => handleTabChange('search')}
            className={`flex flex-col items-center gap-1 px-4 py-3 transition-colors ${
              activeTab === 'search' ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <Search size={22} />
            <span className="text-xs">{language === 'ja' ? '検索' : 'Search'}</span>
          </button>

          <button
            onClick={() => handleTabChange('trends')}
            className={`flex flex-col items-center gap-1 px-4 py-3 transition-colors ${
              activeTab === 'trends' ? 'text-orange-500' : 'text-gray-400 hover:text-orange-400'
            }`}
          >
            <TrendingUp size={22} />
            <span className="text-xs">{language === 'ja' ? 'トレンド' : 'Trends'}</span>
          </button>

          <button
            onClick={() => setShowChat(true)}
            className="flex flex-col items-center gap-1 px-4 py-3 text-gray-400 hover:text-green-500 transition-colors"
          >
            <div className="relative">
              <MessageCircle size={22} />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"></span>
            </div>
            <span className="text-xs">{language === 'ja' ? 'AIチャット' : 'AI Chat'}</span>
          </button>

          <button
            onClick={() => {
              if (currentUser) setShowMyPage(true);
              else setShowLoginModal(true);
            }}
            className="flex flex-col items-center gap-1 px-4 py-3 text-gray-400 hover:text-purple-500 transition-colors"
          >
            <UserIcon size={22} />
            <span className="text-xs">{language === 'ja' ? 'マイページ' : 'My Page'}</span>
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
            className="flex flex-col items-center gap-1 px-4 py-3 text-gray-400 hover:text-orange-500 transition-colors"
          >
            <Plus size={22} />
            <span className="text-xs">{language === 'ja' ? '投稿' : 'Post'}</span>
          </button>
        </div>
      </nav>

      {showAddForm && (
        <AddCondimentForm
          onAdd={handleAddCondiment}
          onClose={() => setShowAddForm(false)}
          language={language}
          condiments={condiments}
          userId={currentUser?.id}
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

      {showAdminPanel && (
        <AdminPanel
          users={allUsers}
          onClose={() => setShowAdminPanel(false)}
          language={language}
        />
      )}

      {showMyPage && currentUser && (
        <MyPage
          user={currentUser}
          posts={getUserPosts(currentUser.id)}
          likedPosts={getLikedPosts()}
          bookmarkedPosts={getBookmarkedPosts()}
          onClose={() => setShowMyPage(false)}
          onViewCondiment={setSelectedCondiment}
          language={language}
          onToggleLike={handleToggleLike}
          onToggleBookmark={handleToggleBookmark}
          onDeletePost={handleDeletePost}
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
      </div>
    </div>
  );
}
