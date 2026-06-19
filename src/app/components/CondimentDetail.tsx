import { useState } from 'react';
import { X, Star, MapPin, Repeat, Globe, Heart, Bookmark, Languages, Loader } from 'lucide-react';
import { Condiment } from '../types';
import { TasteRadarChart } from './TasteRadarChart';
import { TranslateModal } from './TranslateModal';
import { Language, t, CATEGORY_KEYS, PURCHASE_LOCATION_KEYS } from '../i18n/translations';


interface CondimentDetailProps {
  condiment: Condiment;
  onClose: () => void;
  language: Language;
  onToggleLike: (condimentId: string) => void;
  onToggleBookmark: (condimentId: string) => void;
  isLiked: boolean;
  isBookmarked: boolean;
}

export function CondimentDetail({ condiment, onClose, language, onToggleLike, onToggleBookmark, isLiked, isBookmarked }: CondimentDetailProps) {
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateContent, setTranslateContent] = useState({ title: '', text: '' });
  const [descTranslations, setDescTranslations] = useState<Record<string, string>>({});
  const [activeDescLang, setActiveDescLang] = useState<string | null>(null);
  const [isTranslatingDescription, setIsTranslatingDescription] = useState(false);
  const [descTranslateError, setDescTranslateError] = useState('');
  const [selectedImage, setSelectedImage] = useState(condiment.imageUrl);
  const locale = language === 'ja' ? 'ja-JP' : 'en-US';

  const DESC_LANGS = [
    { code: 'ja', label: '日本語' },
    { code: 'en', label: 'English' },
    { code: 'zh-CN', label: '中文' },
    { code: 'ko', label: '한국어' },
    { code: 'vi', label: 'Tiếng Việt' },
  ];

  const handleSelectDescLang = async (targetCode: string) => {
    if (activeDescLang === targetCode) {
      setActiveDescLang(null);
      return;
    }
    if (targetCode === 'ja') {
      setActiveDescLang(null);
      return;
    }
    if (descTranslations[targetCode]) {
      setActiveDescLang(targetCode);
      return;
    }
    setIsTranslatingDescription(true);
    setDescTranslateError('');
    try {
      const sourceLang = language === 'ja' ? 'ja' : 'en';
      const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetCode}&dt=t&q=${encodeURIComponent(condiment.description)}`;
      const response = await fetch(url);
      const data = await response.json();
      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translated = data[0].map((item: any) => item[0]).join('');
        setDescTranslations(prev => ({ ...prev, [targetCode]: translated }));
        setActiveDescLang(targetCode);
      } else {
        throw new Error('Translation failed');
      }
    } catch {
      setDescTranslateError(language === 'ja' ? '翻訳に失敗しました' : 'Translation failed');
    } finally {
      setIsTranslatingDescription(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col max-w-md mx-auto">
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10">
        <button onClick={onClose} className="flex items-center gap-1 text-gray-500 hover:text-gray-700">
          <X size={20} />
          <span className="text-sm">{language === 'ja' ? '戻る' : 'Back'}</span>
        </button>
        <h2 className="text-base font-semibold truncate mx-2 flex-1 text-center">{condiment.name}</h2>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onToggleLike(condiment.id)}
              className={`p-2 rounded-lg transition-colors ${
                isLiked ? 'text-red-600' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={language === 'ja' ? 'いいね' : 'Like'}
            >
              <Heart size={20} className={isLiked ? 'fill-red-600' : ''} />
            </button>
            <button
              onClick={() => onToggleBookmark(condiment.id)}
              className={`p-2 rounded-lg transition-colors ${
                isBookmarked ? 'text-yellow-500' : 'text-gray-400 hover:text-gray-600'
              }`}
              title={language === 'ja' ? 'ブックマーク' : 'Bookmark'}
            >
              <Bookmark size={20} className={isBookmarked ? 'fill-yellow-500' : ''} />
            </button>
            <button
              onClick={() => {
                const dishText = condiment.recommendedDishes.length > 0
                  ? `\n\n【${language === 'ja' ? 'おすすめ料理' : 'Recommended Dishes'}】\n${condiment.recommendedDishes.join('、')}`
                  : '';
                setTranslateContent({
                  title: condiment.name,
                  text: condiment.description + dishText
                });
                setShowTranslate(true);
              }}
              className="p-2 text-blue-500 hover:text-blue-700 transition-colors"
              title={language === 'ja' ? '翻訳' : 'Translate'}
            >
              <Globe size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <div className="space-y-4">
            {/* Image */}
            <div className="space-y-2">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                {selectedImage ? (
                  <img
                    src={selectedImage}
                    alt={condiment.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-gray-400 text-9xl">🧂</div>
                  </div>
                )}
              </div>
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2">
                <button
                  onClick={() => setSelectedImage(condiment.imageUrl)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === condiment.imageUrl ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <img
                    src={condiment.imageUrl}
                    alt={condiment.name}
                    className="w-full h-full object-cover"
                  />
                </button>
                {condiment.dishImageUrl && (
                  <button
                    onClick={() => setSelectedImage(condiment.dishImageUrl!)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                      selectedImage === condiment.dishImageUrl ? 'border-orange-500' : 'border-gray-200 hover:border-orange-300'
                    }`}
                  >
                    <img
                      src={condiment.dishImageUrl}
                      alt="Dish"
                      className="w-full h-full object-cover"
                    />
                  </button>
                )}
                {/* Placeholder thumbnails */}
                {[...Array(Math.max(0, 4 - (condiment.dishImageUrl ? 2 : 1)))].map((_, i) => (
                  <div key={i} className="aspect-square rounded-lg bg-gray-100 border-2 border-gray-200" />
                ))}
              </div>
            </div>

            {/* Details */}
            <div className="space-y-4">
            {/* Title and Rating */}
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">{condiment.name}</h2>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={18}
                      className={i < condiment.repeatRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                    />
                  ))}
                </div>
                <span className="text-lg font-bold text-gray-900">{condiment.repeatRating.toFixed(1)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-orange-100 text-orange-700 text-sm rounded-full font-medium">
                  {t(language, CATEGORY_KEYS[condiment.category])}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{t(language, 'origin')}</h3>
                <p className="text-gray-900">{condiment.origin}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">{t(language, 'purchaseLocation')}</h3>
                <div className="flex items-center gap-1">
                  <MapPin size={16} className="text-gray-600" />
                  <p className="text-gray-900">{t(language, PURCHASE_LOCATION_KEYS[condiment.purchaseLocation])}</p>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <h3 className="text-sm font-medium text-gray-500 mr-1">{t(language, 'description')}</h3>
                {DESC_LANGS.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => handleSelectDescLang(lang.code)}
                    disabled={isTranslatingDescription && activeDescLang !== lang.code}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-colors ${
                      (lang.code === 'ja' && activeDescLang === null) || activeDescLang === lang.code
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
                    } disabled:opacity-40`}
                  >
                    {isTranslatingDescription && lang.code !== 'ja' && !descTranslations[lang.code] ? (
                      <Loader size={10} className="animate-spin" />
                    ) : null}
                    {lang.label}
                  </button>
                ))}
              </div>
              {descTranslateError && (
                <p className="text-xs text-red-500 mb-1">{descTranslateError}</p>
              )}
              {isTranslatingDescription && (
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
                  <Loader size={12} className="animate-spin" />
                  <span>{language === 'ja' ? '翻訳中...' : 'Translating...'}</span>
                </div>
              )}
              <p className="text-gray-900 whitespace-pre-wrap">
                {activeDescLang && descTranslations[activeDescLang]
                  ? descTranslations[activeDescLang]
                  : condiment.description}
              </p>
              {activeDescLang && (
                <p className="text-xs text-gray-400 mt-1">
                  {language === 'ja' ? '※ Google翻訳による自動翻訳' : '※ Auto-translated by Google Translate'}
                </p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t(language, 'tasteProfile')}</h3>
              <div className="bg-gray-50 p-4 rounded-lg">
                <TasteRadarChart tasteProfile={condiment.tasteProfile} size="medium" />
              </div>
            </div>

            {condiment.recommendedDishes.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">{t(language, 'recommendedDishes')}</h3>
                <div className="flex flex-wrap gap-2 mb-4">
                  {condiment.recommendedDishes.map((dish, index) => (
                    <span key={index} className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                      {dish}
                    </span>
                  ))}
                </div>
                {/* 投稿時の料理写真 */}
                {condiment.dishImageUrl && (
                  <>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">
                      {language === 'ja' ? '料理の写真' : 'Dish Photo'}
                    </h3>
                    <div className="rounded-xl overflow-hidden aspect-video bg-gray-100">
                      <img
                        src={condiment.dishImageUrl}
                        alt={language === 'ja' ? '料理の写真' : 'Dish photo'}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {condiment.pairingCondiments && condiment.pairingCondiments.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  {language === 'ja' ? '相性のよい調味料' : 'Pairing Condiments'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {condiment.pairingCondiments.map((name, i) => (
                    <span key={i} className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full flex items-center gap-1">
                      <span className="text-orange-400">×</span>
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="border-t pt-4">
              <h3 className="text-sm font-medium text-gray-500 mb-2">{t(language, 'postedBy')}</h3>
              <div className="bg-gray-50 rounded p-3 space-y-2">
                <div>
                  <span className="text-sm font-medium">{condiment.postedBy.nickname}</span>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">味覚バッジ:</p>
                  <div className="flex flex-wrap gap-1">
                    {condiment.postedBy.tasteBadges.map((badge, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">{t(language, 'postedDate')}</h3>
              <p className="text-gray-600 text-sm">
                {new Date(condiment.createdAt).toLocaleString(locale)}
              </p>
            </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="mt-8 border-t pt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Star size={20} className="text-yellow-400" />
              {language === 'ja' ? 'レビュー' : 'Reviews'}
            </h3>
            <div className="space-y-4">
              {/* Mock Review */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 bg-purple-400 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {condiment.postedBy.nickname[0]}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{condiment.postedBy.nickname}</p>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={12}
                          className={i < condiment.repeatRating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-gray-700 text-sm">{condiment.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showTranslate && (
        <TranslateModal
          title={translateContent.title}
          text={translateContent.text}
          onClose={() => setShowTranslate(false)}
          currentLanguage={language}
        />
      )}
    </div>
  );
}
