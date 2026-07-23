import { X, Star, MapPin, ChevronLeft, Utensils, ShoppingBag, User, BarChart2 } from 'lucide-react';
import { AggregatedCondiment } from '../types';
import { TasteRadarChart } from './TasteRadarChart';
import { Language, t, PURCHASE_LOCATION_KEYS, CATEGORY_KEYS } from '../i18n/translations';

interface CondimentReviewsProps {
  aggregated: AggregatedCondiment;
  onClose: () => void;
  onViewUser: (userId: string, nickname: string) => void;
  language: Language;
}

export function CondimentReviews({ aggregated, onClose, onViewUser, language }: CondimentReviewsProps) {
  const locale = language === 'ja' ? 'ja-JP' : 'en-US';

  return (
    <div className="fixed inset-0 bg-[#faf7f2] z-50 flex flex-col max-w-md mx-auto overflow-hidden">

      {/* Hero */}
      <div className="relative h-52 bg-[#3d1f00] flex-shrink-0 overflow-hidden">
        {aggregated.representativeImage ? (
          <img
            src={aggregated.representativeImage}
            alt={aggregated.name}
            className="w-full h-full object-cover opacity-75"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🧂</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#3d1f00]/90 via-[#3d1f00]/30 to-transparent" />

        {/* Back button */}
        <div className="absolute top-4 left-4">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-white/80 hover:text-white bg-black/20 rounded-full px-3 py-1.5 text-sm backdrop-blur-sm"
          >
            <ChevronLeft size={16} />
            {t(language, 'back')}
          </button>
        </div>

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <span className="inline-block px-2 py-0.5 border border-[#c17f3a] text-[#e8d5b0] text-[10px] rounded mb-1.5">
            {t(language, CATEGORY_KEYS[aggregated.category])}
          </span>
          <h2 className="text-2xl font-bold text-white leading-tight mb-1">{aggregated.name}</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  size={13}
                  className={i < Math.round(aggregated.averageRepeatRating) ? 'text-[#c17f3a] fill-[#c17f3a]' : 'text-white/30'}
                />
              ))}
            </div>
            <span className="text-white font-bold">{aggregated.averageRepeatRating.toFixed(1)}</span>
            <span className="text-[#e8d5b0] text-sm">
              {t(language, 'totalPostsCount', { count: aggregated.postCount })}
            </span>
            <div className="flex items-center gap-1 ml-auto">
              <MapPin size={12} className="text-[#c17f3a]" />
              <span className="text-[#e8d5b0] text-xs">{aggregated.origin}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-5 space-y-5">

          {/* Average stats */}
          <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[#e2d5c0] bg-[#faf7f2] flex items-center gap-2">
              <BarChart2 size={13} className="text-[#c17f3a]" />
              <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">{t(language, 'averageRating')}</span>
            </div>
            <div className="px-4 pb-4 pt-2">
              <TasteRadarChart tasteProfile={aggregated.averageTasteProfile} size="medium" language={language} />
            </div>
          </div>

          {/* All reviews */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="text-sm font-bold text-[#3d1f00] tracking-wide">{t(language, 'allReviews')}</span>
              <div className="flex-1 h-px bg-[#e2d5c0]" />
            </div>

            <div className="space-y-4">
              {aggregated.posts.map((post, index) => (
                <div key={post.id} className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">

                  {/* Post image — prominent at top */}
                  {post.imageUrl && (
                    <div className="h-44 overflow-hidden relative">
                      <img
                        src={post.imageUrl}
                        alt={post.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      <div className="absolute top-2.5 left-2.5">
                        <span className="bg-[#3d1f00]/70 text-[#e8d5b0] text-[10px] px-2 py-0.5 rounded-full backdrop-blur-sm">
                          #{index + 1}
                        </span>
                      </div>
                      <div className="absolute bottom-2.5 right-2.5 flex items-center gap-1 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                        <Star size={11} className="text-[#c17f3a] fill-[#c17f3a]" />
                        <span className="text-white text-xs font-bold">{post.repeatRating}/5</span>
                      </div>
                    </div>
                  )}

                  <div className="p-4">
                    {/* Posted by */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#f5ede0] rounded-full flex items-center justify-center text-[#7c4a1e] font-bold text-sm flex-shrink-0">
                          {post.postedBy.nickname[0]}
                        </div>
                        <div>
                          <button
                            onClick={(e) => { e.stopPropagation(); onViewUser(post.postedBy.userId, post.postedBy.nickname); }}
                            className="text-sm font-bold text-[#3d1f00] hover:text-[#7c4a1e] transition-colors"
                          >
                            {post.postedBy.nickname}
                          </button>
                          <p className="text-[10px] text-[#a07850]">{new Date(post.createdAt).toLocaleDateString(locale)}</p>
                        </div>
                      </div>
                      {!post.imageUrl && (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} className={i < post.repeatRating ? 'text-[#c17f3a] fill-[#c17f3a]' : 'text-[#e2d5c0]'} />
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Taste badges */}
                    {post.postedBy.tasteBadges.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-3">
                        {post.postedBy.tasteBadges.slice(0, 3).map((badge, i) => (
                          <span key={i} className="px-2 py-0.5 bg-[#f5ede0] text-[#7c4a1e] text-[10px] rounded-full border border-[#e2d5c0]">
                            {badge}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Description */}
                    <p className="text-sm text-[#3d1f00] leading-relaxed mb-3">{post.description}</p>

                    {/* Recommended dishes */}
                    {post.recommendedDishes.length > 0 && (
                      <div className="mb-3 p-3 bg-[#fdf5ea] rounded-xl border border-[#e8d5b0]">
                        <div className="flex items-center gap-1.5 mb-2">
                          <Utensils size={11} className="text-[#c17f3a]" />
                          <span className="text-[10px] font-bold text-[#c17f3a] uppercase tracking-wide">
                            {t(language, 'bestWith')}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {post.recommendedDishes.map((dish, i) => (
                            <span key={i} className="px-2.5 py-1 bg-white border border-[#e2d5c0] text-[#5c3311] text-xs rounded-lg font-medium">
                              {dish}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Meta tags */}
                    <div className="flex flex-wrap gap-1.5">
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-[#f5ede0] text-[#7c4a1e] text-[10px] rounded-lg border border-[#e8d5b0]">
                        <ShoppingBag size={10} />
                        {t(language, PURCHASE_LOCATION_KEYS[post.purchaseLocation])}
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-1 bg-[#f5ede0] text-[#7c4a1e] text-[10px] rounded-lg border border-[#e8d5b0]">
                        <MapPin size={10} />
                        {post.origin}
                      </span>
                    </div>

                    {/* Taste radar (collapsible) */}
                    <details className="mt-3">
                      <summary className="text-xs text-[#c17f3a] cursor-pointer hover:text-[#7c4a1e] font-medium flex items-center gap-1 select-none">
                        <BarChart2 size={11} />
                        {t(language, 'tasteProfile')}
                      </summary>
                      <div className="mt-2 bg-[#fdf5ea] rounded-xl p-3 border border-[#e8d5b0]">
                        <TasteRadarChart tasteProfile={post.tasteProfile} size="small" language={language} />
                      </div>
                    </details>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="h-4" />
        </div>
      </div>
    </div>
  );
}
