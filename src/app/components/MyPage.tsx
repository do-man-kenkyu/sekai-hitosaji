import { useState } from 'react';
import { X, User as UserIcon, Mail, MapPin, Calendar, Star, Heart, Bookmark, Trash2, Pencil, Check } from 'lucide-react';
import { User, Condiment, TasteBadge, PREFECTURES } from '../types';
import { Language, t, CATEGORY_KEYS, PURCHASE_LOCATION_KEYS } from '../i18n/translations';

const TASTE_BADGE_OPTIONS: TasteBadge[] = [
  '辛党', '甘党', '塩味好き', '酸味好き', '苦味好き', '旨味好き',
  '舌が肥えている', 'グルメ', '健康志向', '伝統派', '冒険派', '万能型',
  'スパイスマニア', '発酵食品好き', '無添加派', 'オーガニック志向',
  '減塩派', '糖質控えめ', '和食派', '洋食派', '中華好き', 'エスニック好き',
  '本格派', '時短重視', 'コスパ重視', '高級志向', '地産地消', '希少品コレクター',
  '調味料オタク', '料理好き', '素材重視', '香り重視', '色彩重視', '食感重視',
];

interface MyPageProps {
  user: User;
  posts: Condiment[];
  likedPosts: Condiment[];
  bookmarkedPosts: Condiment[];
  onClose: () => void;
  onViewCondiment: (condiment: Condiment) => void;
  language: Language;
  onToggleLike: (condimentId: string) => void;
  onToggleBookmark: (condimentId: string) => void;
  onDeletePost: (postId: string) => void;
  onUpdateUser: (user: User) => void;
  likedCondiments: string[];
  bookmarkedCondiments: string[];
}

interface PostCardProps {
  post: Condiment;
  onViewCondiment: (condiment: Condiment) => void;
  onToggleLike: (condimentId: string) => void;
  onToggleBookmark: (condimentId: string) => void;
  isLiked: boolean;
  isBookmarked: boolean;
  language: Language;
  onDeletePost?: (postId: string) => void;
}

function PostCard({ post, onViewCondiment, onToggleLike, onToggleBookmark, isLiked, isBookmarked, language, onDeletePost }: PostCardProps) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  return (
    <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
      <div className="flex gap-3">
        {post.imageUrl && (
          <img
            src={post.imageUrl}
            alt={post.name}
            className="w-24 h-24 object-cover rounded cursor-pointer"
            onClick={() => onViewCondiment(post)}
          />
        )}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h4 className="font-semibold cursor-pointer hover:text-blue-600" onClick={() => onViewCondiment(post)}>
              {post.name}
            </h4>
            <div className="flex items-center gap-1 text-sm">
              <Star size={14} className="text-yellow-500 fill-yellow-500" />
              <span className="font-medium">{post.repeatRating}</span>
            </div>
          </div>
          <span className="inline-block px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full mb-2">
            {t(language, CATEGORY_KEYS[post.category])}
          </span>
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">{post.description}</p>
          <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
            <Calendar size={12} />
            {new Date(post.createdAt).toLocaleDateString(language === 'ja' ? 'ja-JP' : 'en-US')}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onToggleLike(post.id); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${isLiked ? 'bg-red-100 text-red-600 hover:bg-red-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Heart size={14} className={isLiked ? 'fill-red-600' : ''} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggleBookmark(post.id); }}
              className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${isBookmarked ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <Bookmark size={14} className={isBookmarked ? 'fill-yellow-600' : ''} />
            </button>
            {onDeletePost && !confirmDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
                className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-100 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors ml-auto"
              >
                <Trash2 size={14} />
              </button>
            )}
            {onDeletePost && confirmDelete && (
              <div className="ml-auto flex items-center gap-1" onClick={e => e.stopPropagation()}>
                <span className="text-xs text-gray-500">{language === 'ja' ? '削除しますか？' : 'Delete?'}</span>
                <button
                  onClick={() => onDeletePost(post.id)}
                  className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                >
                  {language === 'ja' ? '削除' : 'Yes'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 bg-gray-200 text-gray-600 text-xs rounded hover:bg-gray-300 transition-colors"
                >
                  {language === 'ja' ? 'キャンセル' : 'Cancel'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export function MyPage({ user, posts, likedPosts, bookmarkedPosts, onClose, onViewCondiment, language, onToggleLike, onToggleBookmark, onDeletePost, onUpdateUser, likedCondiments, bookmarkedCondiments }: MyPageProps) {
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'bookmarks'>('posts');
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    nickname: user.nickname,
    email: user.email ?? '',
    age: String(user.age),
    gender: user.gender,
    prefecture: user.prefecture,
    city: user.city,
    tasteBadges: [...user.tasteBadges],
  });

  const handleSave = () => {
    if (!editForm.nickname || !editForm.age || !editForm.prefecture || !editForm.city) return;
    onUpdateUser({
      ...user,
      nickname: editForm.nickname,
      email: editForm.email,
      age: parseInt(editForm.age),
      gender: editForm.gender as User['gender'],
      prefecture: editForm.prefecture,
      city: editForm.city,
      tasteBadges: editForm.tasteBadges,
    });
    setIsEditing(false);
  };

  const toggleBadge = (badge: TasteBadge) => {
    setEditForm(f => ({
      ...f,
      tasteBadges: f.tasteBadges.includes(badge)
        ? f.tasteBadges.filter(b => b !== badge)
        : [...f.tasteBadges, badge],
    }));
  };
  const avgRepeatRating = posts.length > 0
    ? (posts.reduce((sum, p) => sum + p.repeatRating, 0) / posts.length).toFixed(1)
    : 0;

  const categoryCount = posts.reduce((acc, post) => {
    acc[post.category] = (acc[post.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = Object.entries(categoryCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-semibold">{t(language, 'myPage')}</h2>
            <p className="text-sm text-gray-500 mt-1">{user.nickname}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {/* User Information */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <UserIcon size={20} />
                {t(language, 'profile')}
              </h3>
              {!isEditing ? (
                <button
                  onClick={() => { setEditForm({ nickname: user.nickname, email: user.email ?? '', age: String(user.age), gender: user.gender, prefecture: user.prefecture, city: user.city, tasteBadges: [...user.tasteBadges] }); setIsEditing(true); }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Pencil size={14} />
                  {language === 'ja' ? '編集' : 'Edit'}
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="px-3 py-1.5 bg-white border border-gray-300 text-gray-600 text-sm rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    {language === 'ja' ? 'キャンセル' : 'Cancel'}
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={!editForm.nickname || !editForm.age || !editForm.prefecture || !editForm.city || editForm.tasteBadges.length === 0}
                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-40 transition-colors"
                  >
                    <Check size={14} />
                    {language === 'ja' ? '保存' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {!isEditing ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t(language, 'nickname')}</p>
                    <p className="font-medium text-lg">{user.nickname}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{language === 'ja' ? 'メールアドレス' : 'Email'}</p>
                    <p className="font-medium text-sm">{user.email || '—'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t(language, 'age')}</p>
                    <p className="font-medium">{user.age}{language === 'ja' ? '歳' : ' years old'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t(language, 'gender')}</p>
                    <p className="font-medium">{user.gender}</p>
                  </div>
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">{t(language, 'location')}</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin size={16} className="text-gray-500" />
                      {user.prefecture} {user.city}
                    </p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">{t(language, 'tasteBadges')}</p>
                  <div className="flex flex-wrap gap-2">
                    {user.tasteBadges.map((badge, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-medium">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t(language, 'nickname')}</label>
                    <input
                      type="text"
                      value={editForm.nickname}
                      onChange={e => setEditForm(f => ({ ...f, nickname: e.target.value }))}
                      maxLength={20}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{language === 'ja' ? 'メールアドレス' : 'Email'}</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t(language, 'age')}</label>
                    <input
                      type="number"
                      min="1" max="120"
                      value={editForm.age}
                      onChange={e => setEditForm(f => ({ ...f, age: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t(language, 'gender')}</label>
                    <select
                      value={editForm.gender}
                      onChange={e => setEditForm(f => ({ ...f, gender: e.target.value as User['gender'] }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      <option value="男性">{t(language, 'male')}</option>
                      <option value="女性">{t(language, 'female')}</option>
                      <option value="その他">{t(language, 'otherGender')}</option>
                      <option value="回答しない">{t(language, 'noAnswer')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t(language, 'prefecture')}</label>
                    <select
                      value={editForm.prefecture}
                      onChange={e => setEditForm(f => ({ ...f, prefecture: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    >
                      {PREFECTURES.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-medium text-gray-600 mb-1">{t(language, 'city')}</label>
                    <input
                      type="text"
                      value={editForm.city}
                      onChange={e => setEditForm(f => ({ ...f, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">{t(language, 'tasteBadges')}</label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                    {TASTE_BADGE_OPTIONS.map(badge => (
                      <button
                        key={badge}
                        type="button"
                        onClick={() => toggleBadge(badge)}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${
                          editForm.tasteBadges.includes(badge)
                            ? 'bg-purple-500 text-white'
                            : 'bg-white border border-gray-300 text-gray-600 hover:border-purple-400'
                        }`}
                      >
                        {badge}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-1">{t(language, 'postsCount')}</h3>
              <p className="text-3xl font-bold text-orange-500">{posts.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-1">{t(language, 'avgRepeatRating')}</h3>
              <p className="text-3xl font-bold text-green-600">{avgRepeatRating}</p>
            </div>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-purple-900 mb-1">{language === 'ja' ? 'カテゴリ数' : 'Categories'}</h3>
              <p className="text-3xl font-bold text-purple-600">{Object.keys(categoryCount).length}</p>
            </div>
          </div>

          {/* Category Distribution */}
          {topCategories.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-medium mb-3">{t(language, 'topCategories')}</h3>
              <div className="space-y-2">
                {topCategories.map(([category, count]) => {
                  const percentage = (count / posts.length) * 100;
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t(language, CATEGORY_KEYS[category])}</span>
                        <span className="font-medium">{count} {language === 'ja' ? '件' : 'posts'} ({percentage.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b">
              <button
                onClick={() => setActiveTab('posts')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'posts'
                    ? 'text-blue-600 border-blue-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <UserIcon size={18} />
                {language === 'ja' ? 'マイ投稿' : 'My Posts'}
                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs rounded-full">
                  {posts.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('likes')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'likes'
                    ? 'text-red-600 border-red-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Heart size={18} />
                {language === 'ja' ? 'いいね' : 'Liked'}
                <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                  {likedPosts.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('bookmarks')}
                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors border-b-2 ${
                  activeTab === 'bookmarks'
                    ? 'text-yellow-600 border-yellow-600'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                <Bookmark size={18} />
                {language === 'ja' ? 'ブックマーク' : 'Bookmarks'}
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-600 text-xs rounded-full">
                  {bookmarkedPosts.length}
                </span>
              </button>
            </div>
          </div>

          {/* Posts List */}
          <div>
            {activeTab === 'posts' && (
              <>
                <h3 className="font-medium mb-4 text-lg">{t(language, 'yourPosts')}</h3>
                {posts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {t(language, 'noPosts')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {posts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onViewCondiment={onViewCondiment}
                        onToggleLike={onToggleLike}
                        onToggleBookmark={onToggleBookmark}
                        isLiked={likedCondiments.includes(post.id)}
                        isBookmarked={bookmarkedCondiments.includes(post.id)}
                        language={language}
                        onDeletePost={onDeletePost}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'likes' && (
              <>
                <h3 className="font-medium mb-4 text-lg flex items-center gap-2">
                  <Heart size={20} className="text-red-500" />
                  {language === 'ja' ? 'いいねした投稿' : 'Liked Posts'}
                </h3>
                {likedPosts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {language === 'ja' ? 'いいねした投稿がありません' : 'No liked posts'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {likedPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onViewCondiment={onViewCondiment}
                        onToggleLike={onToggleLike}
                        onToggleBookmark={onToggleBookmark}
                        isLiked={likedCondiments.includes(post.id)}
                        isBookmarked={bookmarkedCondiments.includes(post.id)}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </>
            )}

            {activeTab === 'bookmarks' && (
              <>
                <h3 className="font-medium mb-4 text-lg flex items-center gap-2">
                  <Bookmark size={20} className="text-yellow-500" />
                  {language === 'ja' ? 'ブックマークした投稿' : 'Bookmarked Posts'}
                </h3>
                {bookmarkedPosts.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    {language === 'ja' ? 'ブックマークした投稿がありません' : 'No bookmarked posts'}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {bookmarkedPosts.map(post => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onViewCondiment={onViewCondiment}
                        onToggleLike={onToggleLike}
                        onToggleBookmark={onToggleBookmark}
                        isLiked={likedCondiments.includes(post.id)}
                        isBookmarked={bookmarkedCondiments.includes(post.id)}
                        language={language}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
