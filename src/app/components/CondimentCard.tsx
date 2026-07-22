import { Eye, Star, Heart, Bookmark, MapPin } from 'lucide-react';
import { AggregatedCondiment } from '../types';
import { Language, t, CATEGORY_KEYS } from '../i18n/translations';

interface CondimentCardProps {
  aggregated: AggregatedCondiment;
  onViewReviews: (aggregated: AggregatedCondiment) => void;
  language: Language;
  onToggleLike: (condimentId: string) => void;
  onToggleBookmark: (condimentId: string) => void;
  likedCondiments: string[];
  bookmarkedCondiments: string[];
}

export function CondimentCard({ aggregated, onViewReviews, language, onToggleLike, onToggleBookmark, likedCondiments, bookmarkedCondiments }: CondimentCardProps) {
  const latestPost = aggregated.posts[0];
  const isLiked = likedCondiments.includes(latestPost.id);
  const isBookmarked = bookmarkedCondiments.includes(latestPost.id);

  return (
    <div className="bg-white rounded-xl border border-[#e2d5c0] overflow-hidden hover:border-[#c17f3a] hover:shadow-md transition-all cursor-pointer group">
      {/* Accent bar */}
      <div className="h-1 bg-[#7c4a1e]" />

      {/* Image */}
      <div className="h-36 sm:h-44 bg-white flex items-center justify-center overflow-hidden p-2">
        {aggregated.representativeImage ? (
          <img
            src={aggregated.representativeImage}
            alt={aggregated.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-5xl opacity-40">🧂</div>
        )}
      </div>

      <div className="p-3">
        {/* Name + category */}
        <div className="flex items-start justify-between gap-1 mb-1.5">
          <h3 className="font-bold text-[#2c1a06] text-sm leading-tight">{aggregated.name}</h3>
          <span className="px-1.5 py-0.5 border border-[#c17f3a] text-[#7c4a1e] text-[10px] rounded whitespace-nowrap flex-shrink-0">
            {t(language, CATEGORY_KEYS[aggregated.category])}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="flex items-center gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={11}
                className={i < Math.round(aggregated.averageRepeatRating) ? 'text-[#c17f3a] fill-[#c17f3a]' : 'text-[#e2d5c0]'}
              />
            ))}
          </div>
          <span className="text-xs text-[#7c4a1e] font-medium">{aggregated.averageRepeatRating.toFixed(1)}</span>
          <span className="text-[10px] text-[#a07850]">({aggregated.postCount}{t(language, 'countUnit')})</span>
        </div>

        {/* Description */}
        <p className="text-[#5c3d11] text-xs mb-1.5 line-clamp-2 leading-relaxed">{latestPost.description}</p>

        {/* Origin */}
        <div className="flex items-center gap-1 mb-2">
          <MapPin size={11} className="text-[#c17f3a] flex-shrink-0" />
          <span className="text-[10px] text-[#a07850]">{aggregated.origin}</span>
        </div>

        {/* Dishes */}
        {latestPost.recommendedDishes.length > 0 && (
          <div className="mb-2 p-2 bg-[#fdf5ea] rounded-lg border border-[#e8d5b0]">
            <p className="text-xs font-bold text-[#c17f3a] uppercase tracking-wide mb-1">{t(language, 'bestWith')}</p>
            <div className="flex flex-wrap gap-1">
              {latestPost.recommendedDishes.slice(0, 3).map((dish, index) => (
                <span key={index} className="px-2 py-0.5 bg-white border border-[#e2d5c0] text-[#5c3311] text-xs rounded font-medium">
                  {dish}
                </span>
              ))}
              {latestPost.recommendedDishes.length > 3 && (
                <span className="px-1.5 py-0.5 text-[#a07850] text-[10px]">+{latestPost.recommendedDishes.length - 3}</span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleLike(latestPost.id); }}
            className={`p-1.5 rounded-lg transition-colors ${
              isLiked ? 'bg-red-50 text-red-500' : 'bg-[#f5ede0] text-[#a07850] hover:bg-red-50 hover:text-red-400'
            }`}
            title={t(language, 'like')}
          >
            <Heart size={14} className={isLiked ? 'fill-red-500' : ''} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleBookmark(latestPost.id); }}
            className={`p-1.5 rounded-lg transition-colors ${
              isBookmarked ? 'bg-amber-50 text-amber-600' : 'bg-[#f5ede0] text-[#a07850] hover:bg-amber-50 hover:text-amber-500'
            }`}
            title={t(language, 'bookmark')}
          >
            <Bookmark size={14} className={isBookmarked ? 'fill-amber-600' : ''} />
          </button>
          <button
            onClick={() => onViewReviews(aggregated)}
            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#3d1f00] text-[#e8d5b0] text-xs rounded-lg hover:bg-[#2a1200] transition-colors"
          >
            <Eye size={13} />
            {t(language, 'viewDetails')}
          </button>
        </div>
      </div>
    </div>
  );
}
