import { X, Star, MapPin, Repeat } from 'lucide-react';
import { Condiment } from '../types';
import { TasteRadarChart } from './TasteRadarChart';
import { Language, t, CATEGORY_KEYS, PURCHASE_LOCATION_KEYS } from '../i18n/translations';

interface UserPostsProps {
  nickname: string;
  posts: Condiment[];
  onClose: () => void;
  onViewCondiment: (condiment: Condiment) => void;
  language: Language;
}

export function UserPosts({ nickname, posts, onClose, onViewCondiment, language }: UserPostsProps) {
  const avgRepeatRating = posts.length > 0
    ? (posts.reduce((sum, p) => sum + p.repeatRating, 0) / posts.length).toFixed(1)
    : 0;

  const categoryCount = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-xl font-semibold">{t(language, 'userPosts', { nickname })}</h2>
            <p className="text-sm text-gray-500 mt-1">{t(language, 'totalPostsCount', { count: posts.length })}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-1">{t(language, 'postsCount')}</h3>
              <p className="text-3xl font-bold text-blue-600">{posts.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-1">{t(language, 'avgRepeatRating')}</h3>
              <p className="text-3xl font-bold text-green-600">{avgRepeatRating}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-900 mb-2">{t(language, 'topCategories')}</h3>
              <div className="space-y-1 text-sm">
                {topCategories.map(([category, count]) => (
                  <div key={category} className="flex justify-between">
                    <span>{t(language, CATEGORY_KEYS[category])}:</span>
                    <span className="font-medium">{t(language, 'items', { count })}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="font-medium mb-4">{t(language, 'postList')}</h3>
          <div className="space-y-4">
            {posts.map(post => (
              <div
                key={post.id}
                className="border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => onViewCondiment(post)}
              >
                <div className="flex gap-4">
                  {post.imageUrl && (
                    <img
                      src={post.imageUrl}
                      alt={post.name}
                      className="w-32 h-32 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">{post.name}</h4>
                        <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full mt-1">
                          {t(language, CATEGORY_KEYS[post.category])}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Repeat size={16} className="text-blue-500" />
                        <span className="font-medium">{post.repeatRating}/5</span>
                      </div>
                    </div>

                    <p className="text-sm text-gray-700 mb-2 line-clamp-2">{post.description}</p>

                    <div className="flex flex-wrap gap-2 text-xs mb-2">
                      <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded">
                        <MapPin size={12} />
                        {t(language, PURCHASE_LOCATION_KEYS[post.purchaseLocation])}
                      </span>
                      <span className="px-2 py-1 bg-gray-100 rounded">
                        {t(language, 'origin')}: {post.origin}
                      </span>
                      {post.recommendedDishes.slice(0, 2).map((dish, index) => (
                        <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded">
                          {dish}
                        </span>
                      ))}
                      {post.recommendedDishes.length > 2 && (
                        <span className="px-2 py-1 text-gray-500">
                          +{post.recommendedDishes.length - 2}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-gray-500">
                      {t(language, 'postedDate')}: {new Date(post.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}
                    </p>
                  </div>

                  {post.dishImageUrl && (
                    <img
                      src={post.dishImageUrl}
                      alt="料理"
                      className="w-24 h-24 object-cover rounded"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>

          {posts.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              {t(language, 'noPosts')}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
