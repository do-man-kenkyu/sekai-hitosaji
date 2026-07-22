import { useEffect, useState } from 'react';
import { Trophy, Heart, Star, MapPin, FileText, User } from 'lucide-react';
import { fetchAllLikeCounts } from '../../lib/database';
import { AggregatedCondiment, Condiment } from '../types';
import { Language, t, CATEGORY_KEYS } from '../i18n/translations';

interface Props {
  aggregatedCondiments: AggregatedCondiment[];
  condiments: Condiment[];
  language: Language;
  onViewReviews: (agg: AggregatedCondiment) => void;
  likedCondiments: string[];
}

const MEDAL = ['🥇', '🥈', '🥉'];

type Tab = 'condiment' | 'user_posts' | 'user_likes';

export function RankingPage({ aggregatedCondiments, condiments, language, onViewReviews, likedCondiments }: Props) {
  const [likeCounts, setLikeCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>('condiment');

  useEffect(() => {
    fetchAllLikeCounts()
      .then(setLikeCounts)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // 調味料ランキング（いいね数）
  const condimentRanked = [...aggregatedCondiments]
    .map(agg => ({
      agg,
      totalLikes: agg.posts.reduce((sum, p) => sum + (likeCounts[p.id] ?? 0), 0),
    }))
    .sort((a, b) => b.totalLikes - a.totalLikes);

  // ユーザー集計
  const userStats = condiments.reduce<Record<string, { nickname: string; postCount: number; totalLikes: number }>>((acc, c) => {
    const uid = c.postedBy.userId;
    if (!acc[uid]) acc[uid] = { nickname: c.postedBy.nickname, postCount: 0, totalLikes: 0 };
    acc[uid].postCount += 1;
    acc[uid].totalLikes += likeCounts[c.id] ?? 0;
    return acc;
  }, {});

  const userList = Object.entries(userStats).map(([uid, s]) => ({ uid, ...s }));
  const userByPosts = [...userList].sort((a, b) => b.postCount - a.postCount);
  const userByLikes = [...userList].sort((a, b) => b.totalLikes - a.totalLikes);

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'condiment', label: t(language, 'rankCondimentLikes'), icon: <Heart size={14} /> },
    { key: 'user_posts', label: t(language, 'postCountLabel'), icon: <FileText size={14} /> },
    { key: 'user_likes', label: t(language, 'likesEarned'), icon: <Star size={14} /> },
  ];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-[#f5ede0] rounded-xl flex items-center justify-center">
          <Trophy size={20} className="text-[#c17f3a]" />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#3d1f00]">
            {t(language, 'ranking')}
          </h2>
          <p className="text-xs text-[#a07850]">
            {t(language, 'rankingSubtitle')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-[#f5ede0] rounded-xl p-1">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.key
                ? 'bg-[#7c4a1e] text-white shadow'
                : 'text-[#7c4a1e] hover:bg-[#ede4d3]'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-[#a07850]">
          <Trophy size={32} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">{t(language, 'loading')}</p>
        </div>
      ) : (
        <>
          {/* 調味料いいねランキング */}
          {activeTab === 'condiment' && (
            <div className="space-y-3">
              {condimentRanked.length === 0 ? (
                <p className="text-center text-sm text-[#a07850] py-12">{t(language, 'noData')}</p>
              ) : condimentRanked.map(({ agg, totalLikes }, i) => {
                const latestPost = agg.posts[0];
                const isLiked = likedCondiments.includes(latestPost.id);
                const isTop3 = i < 3;
                return (
                  <button
                    key={agg.name}
                    onClick={() => onViewReviews(agg)}
                    className={`w-full text-left flex items-center gap-3 p-3 rounded-xl border transition-all hover:border-[#c17f3a] hover:bg-[#fdf5ea] ${
                      isTop3 ? 'border-[#e2d5c0] bg-white' : 'border-[#eee8e0] bg-white/60'
                    }`}
                  >
                    <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg ${
                      i === 0 ? 'bg-amber-50 text-amber-500' :
                      i === 1 ? 'bg-gray-50 text-gray-400' :
                      i === 2 ? 'bg-orange-50 text-orange-400' :
                      'bg-[#f5ede0] text-[#a07850] text-sm'
                    }`}>
                      {i < 3 ? MEDAL[i] : `${i + 1}`}
                    </div>
                    <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden bg-white border border-[#e2d5c0] p-1">
                      {agg.representativeImage ? (
                        <img src={agg.representativeImage} alt={agg.name} className="w-full h-full object-contain" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-2xl">🧂</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="font-bold text-sm text-[#2c1a06] truncate">{agg.name}</span>
                        <span className="px-1.5 py-0.5 border border-[#c17f3a] text-[#7c4a1e] text-[10px] rounded flex-shrink-0">
                          {t(language, CATEGORY_KEYS[agg.category])}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[#a07850]">
                        <span className="flex items-center gap-1"><MapPin size={11} className="text-[#c17f3a]" />{agg.origin}</span>
                        <span className="flex items-center gap-1"><Star size={11} className="text-[#c17f3a] fill-[#c17f3a]" />{agg.averageRepeatRating.toFixed(1)}</span>
                      </div>
                    </div>
                    <div className={`flex-shrink-0 flex flex-col items-center gap-0.5 ${isLiked ? 'text-red-500' : 'text-[#a07850]'}`}>
                      <Heart size={16} className={isLiked ? 'fill-red-500' : ''} />
                      <span className="text-xs font-bold">{totalLikes}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* 投稿数ランキング */}
          {activeTab === 'user_posts' && (
            <div className="space-y-3">
              {userByPosts.length === 0 ? (
                <p className="text-center text-sm text-[#a07850] py-12">{t(language, 'noData')}</p>
              ) : userByPosts.map((u, i) => (
                <div
                  key={u.uid}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    i < 3 ? 'border-[#e2d5c0] bg-white' : 'border-[#eee8e0] bg-white/60'
                  }`}
                >
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg ${
                    i === 0 ? 'bg-amber-50 text-amber-500' :
                    i === 1 ? 'bg-gray-50 text-gray-400' :
                    i === 2 ? 'bg-orange-50 text-orange-400' :
                    'bg-[#f5ede0] text-[#a07850] text-sm'
                  }`}>
                    {i < 3 ? MEDAL[i] : `${i + 1}`}
                  </div>
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#f5ede0] flex items-center justify-center">
                    <User size={18} className="text-[#7c4a1e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#2c1a06] truncate">{u.nickname}</p>
                    <p className="text-xs text-[#a07850]">{t(language, 'postsCountText', { count: u.postCount })}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center gap-0.5 text-[#7c4a1e]">
                    <FileText size={16} />
                    <span className="text-xs font-bold">{u.postCount}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* いいね獲得数ランキング */}
          {activeTab === 'user_likes' && (
            <div className="space-y-3">
              {userByLikes.length === 0 ? (
                <p className="text-center text-sm text-[#a07850] py-12">{t(language, 'noData')}</p>
              ) : userByLikes.map((u, i) => (
                <div
                  key={u.uid}
                  className={`flex items-center gap-3 p-3 rounded-xl border ${
                    i < 3 ? 'border-[#e2d5c0] bg-white' : 'border-[#eee8e0] bg-white/60'
                  }`}
                >
                  <div className={`w-10 h-10 flex-shrink-0 flex items-center justify-center rounded-lg font-bold text-lg ${
                    i === 0 ? 'bg-amber-50 text-amber-500' :
                    i === 1 ? 'bg-gray-50 text-gray-400' :
                    i === 2 ? 'bg-orange-50 text-orange-400' :
                    'bg-[#f5ede0] text-[#a07850] text-sm'
                  }`}>
                    {i < 3 ? MEDAL[i] : `${i + 1}`}
                  </div>
                  <div className="w-10 h-10 flex-shrink-0 rounded-full bg-[#f5ede0] flex items-center justify-center">
                    <User size={18} className="text-[#7c4a1e]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-[#2c1a06] truncate">{u.nickname}</p>
                    <p className="text-xs text-[#a07850]">{t(language, 'postsLikesText', { count: u.postCount, likes: u.totalLikes })}</p>
                  </div>
                  <div className="flex-shrink-0 flex flex-col items-center gap-0.5 text-red-400">
                    <Heart size={16} />
                    <span className="text-xs font-bold">{u.totalLikes}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
