import { X, Star, MapPin, Repeat } from 'lucide-react';
import { AggregatedCondiment } from '../types';
import { TasteRadarChart } from './TasteRadarChart';
import { Language, t, PURCHASE_LOCATION_KEYS } from '../i18n/translations';

interface CondimentReviewsProps {
  aggregated: AggregatedCondiment;
  onClose: () => void;
  onViewUser: (userId: string, nickname: string) => void;
  language: Language;
}

export function CondimentReviews({ aggregated, onClose, onViewUser, language }: CondimentReviewsProps) {
  const locale = language === 'ja' ? 'ja-JP' : 'en-US';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold">{aggregated.name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {t(language, 'totalPostsCount', { count: aggregated.postCount })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium mb-3">{t(language, 'averageRating')}</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex items-center gap-2">
                <Repeat size={32} className="text-blue-500" />
                <span className="text-2xl font-semibold">{aggregated.averageRepeatRating.toFixed(1)} / 5.0</span>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">{t(language, 'averageTaste')}</h4>
              <TasteRadarChart tasteProfile={aggregated.averageTasteProfile} size="medium" />
            </div>
          </div>

          <h3 className="font-medium mb-4">{t(language, 'allReviews')}</h3>
          <div className="space-y-4">
            {aggregated.posts.map(post => (
              <div key={post.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex gap-4">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.name}
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewUser(post.postedBy.userId, post.postedBy.nickname);
                            }}
                            className="font-medium text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            {post.postedBy.nickname}
                          </button>
                          {post.postedBy.tasteBadges.slice(0, 2).map((badge, index) => (
                            <span key={index} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
                              {badge}
                            </span>
                          ))}
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString(locale)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Repeat size={16} className="text-blue-500" />
                        <span className="text-sm font-medium">{post.repeatRating}/5</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-2">{post.description}</p>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                        <MapPin size={12} />
                        {t(language, PURCHASE_LOCATION_KEYS[post.purchaseLocation])}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {t(language, 'origin')}: {post.origin}
                      </span>
                      {post.recommendedDishes.slice(0, 3).map((dish, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          {dish}
                        </span>
                      ))}
                    </div>

                    <div className="mt-3">
                      <details className="text-xs">
                        <summary className="cursor-pointer text-blue-600 hover:text-blue-700">
                          {t(language, 'tasteProfile')}
                        </summary>
                        <div className="mt-2 bg-gray-50 p-2 rounded">
                          <TasteRadarChart tasteProfile={post.tasteProfile} size="small" />
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
