import { useMemo, useState } from 'react';
import {
  TrendingUp, Star, MapPin, Flame, Crown, Utensils, BarChart2, Search
} from 'lucide-react';
import { Condiment } from '../types';
import { Language } from '../i18n/translations';

interface TrendsPageProps {
  condiments: Condiment[];
  likedCondiments: string[];
  bookmarkedCondiments: string[];
  language: Language;
  onViewCondiment: (c: Condiment) => void;
}

interface TrendCard {
  id: string;
  title: string;
  icon: React.ReactNode;
  bgColor: string;
  iconBg: string;
  count?: number;
}

function InfoCard({ card, onClick }: { card: TrendCard; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`${card.bgColor} rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 h-40`}
    >
      <div className={`${card.iconBg} w-16 h-16 rounded-full flex items-center justify-center`}>
        {card.icon}
      </div>
      <p className="font-bold text-gray-800">{card.title}</p>
      {card.count !== undefined && (
        <p className="text-xs text-gray-500">{card.count}件</p>
      )}
    </button>
  );
}

export function TrendsPage({ condiments, likedCondiments, bookmarkedCondiments, language, onViewCondiment }: TrendsPageProps) {
  const isJa = language === 'ja';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState<'cards' | 'latest'>('cards');

  // Top rated condiments (by repeatRating)
  const topRated = useMemo(() =>
    [...condiments].sort((a, b) => b.repeatRating - a.repeatRating).slice(0, 3),
    [condiments]
  );

  // Newest condiments
  const latestCondiments = useMemo(() =>
    [...condiments].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 6),
    [condiments]
  );

  // Category counts
  const categoryStats = useMemo(() => {
    const counts: Record<string, number> = {};
    condiments.forEach(c => {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [condiments]);

  // Most liked count
  const likedCount = likedCondiments.length;

  // Bookmarked count
  const bookmarkedCount = bookmarkedCondiments.length;

  // Recommended dishes count
  const dishesCount = useMemo(() => {
    const allDishes = new Set<string>();
    condiments.forEach(c => {
      c.recommendedDishes.forEach(d => allDishes.add(d));
    });
    return allDishes.size;
  }, [condiments]);

  const trendCards: TrendCard[] = [
    {
      id: 'top-rated',
      title: isJa ? '高評価ランキング' : 'Top Rated',
      icon: <Crown size={28} className="text-amber-600" />,
      bgColor: 'bg-white',
      iconBg: 'bg-amber-100',
      count: topRated.length,
    },
    {
      id: 'categories',
      title: isJa ? 'カテゴリ分析' : 'Categories',
      icon: <BarChart2 size={28} className="text-blue-600" />,
      bgColor: 'bg-white',
      iconBg: 'bg-blue-100',
      count: categoryStats.length,
    },
    {
      id: 'popular-dishes',
      title: isJa ? '人気の料理' : 'Popular Dishes',
      icon: <Utensils size={28} className="text-green-600" />,
      bgColor: 'bg-white',
      iconBg: 'bg-green-100',
      count: dishesCount,
    },
    {
      id: 'hot-trends',
      title: isJa ? '急上昇トレンド' : 'Hot Trends',
      icon: <Flame size={28} className="text-orange-600" />,
      bgColor: 'bg-white',
      iconBg: 'bg-orange-100',
    },
  ];

  const handleCardClick = (cardId: string) => {
    if (cardId === 'top-rated') {
      setSelectedView('latest');
    }
  };

  const filteredCondiments = useMemo(() => {
    if (!searchQuery.trim()) return latestCondiments;
    const q = searchQuery.toLowerCase();
    return condiments.filter(c =>
      c.name.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [searchQuery, condiments, latestCondiments]);

  if (condiments.length === 0) {
    return (
      <div className="text-center py-16 text-gray-400">
        <TrendingUp size={48} className="mx-auto mb-4 opacity-40" />
        <p>{isJa ? '投稿がまだありません' : 'No posts yet'}</p>
      </div>
    );
  }

  return (
    <div className="pb-6">
      {/* Search bar + Home/List buttons */}
      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={isJa ? '🔍 検索' : '🔍 Search'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 border-2 border-gray-900 rounded-lg focus:outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => setSelectedView('cards')}
          className={`px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            selectedView === 'cards'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border-2 border-gray-200'
          }`}
        >
          🏠 {isJa ? 'ホーム' : 'Home'}
        </button>
        <button
          onClick={() => setSelectedView('latest')}
          className={`px-4 py-3 rounded-lg font-semibold whitespace-nowrap transition-colors ${
            selectedView === 'latest'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 border-2 border-gray-200'
          }`}
        >
          📋 {isJa ? '一覧' : 'List'}
        </button>
      </div>

      {/* Trend card as single box (same size as other cards) */}
      {selectedView === 'cards' && (
        <div className="mb-6">
          <button
            onClick={() => setSelectedView('latest')}
            className="w-full bg-white rounded-2xl p-6 flex flex-col items-center justify-center gap-3 shadow-sm hover:shadow-md transition-all active:scale-95 h-40"
          >
            <div className="bg-orange-100 w-16 h-16 rounded-full flex items-center justify-center">
              <TrendingUp size={28} className="text-orange-600" />
            </div>
            <p className="font-bold text-gray-800">{isJa ? 'トレンド' : 'Trends'}</p>
            <p className="text-xs text-gray-500">{condiments.length}{isJa ? '件' : ' posts'}</p>
          </button>
        </div>
      )}

      {/* Latest condiments section */}
      {selectedView === 'latest' && (
        <div>
          <h3 className="font-bold text-gray-800 mb-4">
            {isJa ? '最新の調味料' : 'Latest Condiments'}
          </h3>
          <div className="space-y-4">
            {filteredCondiments.map(c => (
              <div
                key={c.id}
                onClick={() => onViewCondiment(c)}
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
              >
                <img
                  src={c.imageUrl}
                  alt={c.name}
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-900 flex-1">{c.name}</h4>
                    <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full shrink-0">
                      {c.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                    <span className="flex items-center gap-1">
                      <Star size={14} fill="#FBBF24" className="text-yellow-400" />
                      {c.repeatRating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {c.origin.length > 15 ? c.origin.slice(0, 15) + '...' : c.origin}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {c.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
