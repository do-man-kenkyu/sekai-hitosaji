import { Eye, Star, Users, Repeat, Heart, Bookmark } from 'lucide-react';
import { AggregatedCondiment } from '../types';
import { Language, t, CATEGORY_KEYS, PURCHASE_LOCATION_KEYS } from '../i18n/translations';

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
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all cursor-pointer">
      <div className="h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
        {aggregated.representativeImage ? (
          <img
            src={aggregated.representativeImage}
            alt={aggregated.name}
            className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="text-gray-300 text-6xl">🧂</div>
        )}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-gray-900">{aggregated.name}</h3>
          <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full font-medium">
            {t(language, CATEGORY_KEYS[aggregated.category])}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                size={14}
                className={i < Math.round(aggregated.averageRepeatRating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
              />
            ))}
          </div>
          <span className="text-sm text-gray-600">{aggregated.averageRepeatRating.toFixed(1)}</span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            ({aggregated.postCount}{language === 'ja' ? '件' : ' reviews'})
          </span>
        </div>

        <p className="text-gray-600 text-sm mb-2 line-clamp-2 leading-relaxed">{latestPost.description}</p>
        <p className="text-gray-400 text-xs mb-3">📍 {aggregated.origin}</p>

        {latestPost.recommendedDishes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-500 mb-1">{t(language, 'recommendedDishes')}:</p>
            <div className="flex flex-wrap gap-1">
              {latestPost.recommendedDishes.slice(0, 2).map((dish, index) => (
                <span key={index} className="px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                  {dish}
                </span>
              ))}
              {latestPost.recommendedDishes.length > 2 && (
                <span className="px-2 py-0.5 text-gray-500 text-xs">
                  +{latestPost.recommendedDishes.length - 2}
                </span>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleLike(latestPost.id);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
              isLiked
                ? 'bg-red-100 text-red-600 hover:bg-red-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={language === 'ja' ? 'いいね' : 'Like'}
          >
            <Heart size={16} className={isLiked ? 'fill-red-600' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleBookmark(latestPost.id);
            }}
            className={`flex items-center gap-1 px-3 py-1.5 rounded transition-colors ${
              isBookmarked
                ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
            title={language === 'ja' ? 'ブックマーク' : 'Bookmark'}
          >
            <Bookmark size={16} className={isBookmarked ? 'fill-yellow-600' : ''} />
          </button>
        </div>

        <button
          onClick={() => onViewReviews(aggregated)}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition-colors"
        >
          <Eye size={16} />
          {language === 'ja' ? '詳細を見る' : 'View Details'}
        </button>
      </div>
    </div>
  );
}
