import { useState, useMemo } from 'react';
import { X, Search, Image, Plus, Star, Repeat, ChevronDown } from 'lucide-react';
import { TasteProfile, PurchaseLocation, PREFECTURES, Condiment } from '../types';
import { TasteRadarChart } from './TasteRadarChart';
import { Language, t, CATEGORY_KEYS, PURCHASE_LOCATION_KEYS } from '../i18n/translations';

interface AddCondimentFormProps {
  onAdd: (condiment: {
    name: string;
    category: string;
    description: string;
    origin: string;
    imageUrl: string;
    dishImageUrl?: string;
    recommendedDishes: string[];
    pairingCondiments: string[];
    repeatRating: number;
    purchaseLocation: PurchaseLocation;
    tasteProfile: TasteProfile;
  }) => void;
  onClose: () => void;
  language: Language;
  condiments: Condiment[];
}

const purchaseLocations: PurchaseLocation[] = [
  'スーパー',
  'コンビニ',
  '道の駅',
  '専門店',
  'オンライン',
  'デパート',
  'その他'
];

const categories = [
  '醤油',
  '味噌',
  '塩',
  '砂糖',
  '酢',
  '油',
  'スパイス',
  'ソース',
  'その他'
];

export function AddCondimentForm({ onAdd, onClose, language, condiments }: AddCondimentFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    category: categories[0],
    description: '',
    origin: '',
    imageUrl: '',
    dishImageUrl: '',
    repeatRating: 3,
    purchaseLocation: 'スーパー' as PurchaseLocation
  });
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>({
    sweetness: 0,
    sourness: 0,
    bitterness: 0,
    umami: 0,
    saltiness: 0,
    richness: 0,
    aroma: 0
  });
  const [recommendedDishes, setRecommendedDishes] = useState<string[]>([]);
  const [newDish, setNewDish] = useState('');
  const [pairingCondiments, setPairingCondiments] = useState<string[]>([]);
  const [showPairingPicker, setShowPairingPicker] = useState(false);
  const [pairingSearch, setPairingSearch] = useState('');
  const [pairingCategory, setPairingCategory] = useState('すべて');

  // 投稿済み調味料から重複を除いた一覧
  const availableCondiments = useMemo(() => {
    const names = Array.from(new Set(condiments.map(c => c.name)));
    return names.map(name => {
      const found = condiments.find(c => c.name === name)!;
      return { name, category: found.category };
    });
  }, [condiments]);
  const [showImageSearch, setShowImageSearch] = useState(false);
  const [showDishImageSearch, setShowDishImageSearch] = useState(false);
  const [imageSearchQuery, setImageSearchQuery] = useState('');
  const [dishImageSearchQuery, setDishImageSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ url: string; description: string }>>([]);
  const [dishSearchResults, setDishSearchResults] = useState<Array<{ url: string; description: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDishSearching, setIsDishSearching] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.name && formData.description && formData.origin && formData.imageUrl) {
      onAdd({
        ...formData,
        dishImageUrl: formData.dishImageUrl || undefined,
        recommendedDishes,
        pairingCondiments,
        tasteProfile
      });
      onClose();
    }
  };

  const addDish = () => {
    if (newDish.trim() && !recommendedDishes.includes(newDish.trim())) {
      setRecommendedDishes([...recommendedDishes, newDish.trim()]);
      setNewDish('');
    }
  };

  const removeDish = (dish: string) => {
    setRecommendedDishes(recommendedDishes.filter(d => d !== dish));
  };

  const removePairing = (name: string) => {
    setPairingCondiments(pairingCondiments.filter(p => p !== name));
  };

  const handleImageSearch = async () => {
    if (!imageSearchQuery.trim()) return;

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(imageSearchQuery)}&per_page=6&client_id=YOUR_UNSPLASH_ACCESS_KEY`
      );
      const data = await response.json();
      setSearchResults(
        data.results?.map((photo: any) => ({
          url: photo.urls.regular,
          description: photo.alt_description || photo.description || ''
        })) || []
      );
    } catch (error) {
      console.error('画像検索エラー:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const selectImage = (url: string) => {
    setFormData({ ...formData, imageUrl: url });
    setShowImageSearch(false);
    setSearchResults([]);
    setImageSearchQuery('');
  };

  const handleDishImageSearch = async () => {
    if (!dishImageSearchQuery.trim()) return;

    setIsDishSearching(true);
    try {
      const response = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(dishImageSearchQuery)}&per_page=6&client_id=YOUR_UNSPLASH_ACCESS_KEY`
      );
      const data = await response.json();
      setDishSearchResults(
        data.results?.map((photo: any) => ({
          url: photo.urls.regular,
          description: photo.alt_description || photo.description || ''
        })) || []
      );
    } catch (error) {
      console.error('画像検索エラー:', error);
      setDishSearchResults([]);
    } finally {
      setIsDishSearching(false);
    }
  };

  const selectDishImage = (url: string) => {
    setFormData({ ...formData, dishImageUrl: url });
    setShowDishImageSearch(false);
    setDishSearchResults([]);
    setDishImageSearchQuery('');
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, imageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDishImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, dishImageUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t(language, 'addCondimentTitle')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'condimentName')} *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'ja' ? '例: 本醸造醤油' : 'e.g., Organic Soy Sauce'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'category')} *</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>{t(language, CATEGORY_KEYS[cat])}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'condimentDescription')} *</label>
            <textarea
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'ja' ? 'この調味料の特徴や使い方を説明してください' : 'Describe the characteristics and usage of this condiment'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'originPrefecture')} *</label>
            <select
              required
              value={formData.origin}
              onChange={(e) => setFormData({ ...formData, origin: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">{t(language, 'selectPrefecture')}</option>
              {PREFECTURES.map(pref => (
                <option key={pref} value={pref}>{pref}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Repeat size={16} />
              {t(language, 'repeatRatingLabel')}
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map(value => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, repeatRating: value })}
                  className={`p-2 transition-colors ${
                    value <= formData.repeatRating ? 'text-blue-500' : 'text-gray-300'
                  }`}
                >
                  <Repeat size={32} strokeWidth={value <= formData.repeatRating ? 2.5 : 1.5} />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-600">{formData.repeatRating} / 5</span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'purchaseLocationLabel')} *</label>
            <select
              value={formData.purchaseLocation}
              onChange={(e) => setFormData({ ...formData, purchaseLocation: e.target.value as PurchaseLocation })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {purchaseLocations.map(loc => (
                <option key={loc} value={loc}>{t(language, PURCHASE_LOCATION_KEYS[loc])}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t(language, 'tasteProfileLabel')} *</label>
            <div className="space-y-3 mb-4">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t(language, 'sweetness')}</span>
                  <span className="text-sm text-gray-600">{tasteProfile.sweetness}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={tasteProfile.sweetness}
                  onChange={(e) => setTasteProfile({ ...tasteProfile, sweetness: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t(language, 'sourness')}</span>
                  <span className="text-sm text-gray-600">{tasteProfile.sourness}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={tasteProfile.sourness}
                  onChange={(e) => setTasteProfile({ ...tasteProfile, sourness: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t(language, 'bitterness')}</span>
                  <span className="text-sm text-gray-600">{tasteProfile.bitterness}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={tasteProfile.bitterness}
                  onChange={(e) => setTasteProfile({ ...tasteProfile, bitterness: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t(language, 'umami')}</span>
                  <span className="text-sm text-gray-600">{tasteProfile.umami}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={tasteProfile.umami}
                  onChange={(e) => setTasteProfile({ ...tasteProfile, umami: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t(language, 'saltiness')}</span>
                  <span className="text-sm text-gray-600">{tasteProfile.saltiness}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={tasteProfile.saltiness}
                  onChange={(e) => setTasteProfile({ ...tasteProfile, saltiness: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t(language, 'richness')}</span>
                  <span className="text-sm text-gray-600">{tasteProfile.richness}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={tasteProfile.richness}
                  onChange={(e) => setTasteProfile({ ...tasteProfile, richness: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-sm">{t(language, 'aroma')}</span>
                  <span className="text-sm text-gray-600">{tasteProfile.aroma}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={tasteProfile.aroma}
                  onChange={(e) => setTasteProfile({ ...tasteProfile, aroma: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded">
              <TasteRadarChart tasteProfile={tasteProfile} size="small" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'recommendedDishesLabel')}</label>
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDish}
                  onChange={(e) => setNewDish(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDish())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={t(language, 'recommendedDishesPlaceholder')}
                />
                <button
                  type="button"
                  onClick={addDish}
                  className="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                >
                  <Plus size={16} />
                </button>
              </div>
              {recommendedDishes.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {recommendedDishes.map((dish, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full"
                    >
                      {dish}
                      <button
                        type="button"
                        onClick={() => removeDish(dish)}
                        className="hover:text-green-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 相性のよい調味料 */}
          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ja' ? '相性のよい調味料（任意）' : 'Pairing Condiments (optional)'}
            </label>
            <p className="text-xs text-gray-500 mb-2">
              {language === 'ja'
                ? '投稿済みの調味料一覧から選択できます'
                : 'Select from the list of posted condiments'}
            </p>

            {/* 選択済みタグ */}
            {pairingCondiments.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {pairingCondiments.map((name, i) => (
                  <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full">
                    <span className="text-orange-400 text-xs">×</span>
                    {name}
                    <button type="button" onClick={() => removePairing(name)} className="hover:text-orange-900 ml-0.5">
                      <X size={12} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* ピッカー開閉ボタン */}
            <button
              type="button"
              onClick={() => setShowPairingPicker(v => !v)}
              className="w-full flex items-center justify-between px-3 py-2 border border-orange-200 rounded-lg bg-orange-50 text-orange-700 hover:bg-orange-100 transition-colors text-sm"
            >
              <span className="flex items-center gap-2">
                <Plus size={15} />
                {language === 'ja' ? '調味料を選んで追加する' : 'Select condiments to add'}
              </span>
              <ChevronDown size={15} className={`transition-transform ${showPairingPicker ? 'rotate-180' : ''}`} />
            </button>

            {/* ピッカー本体 */}
            {showPairingPicker && (
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                {/* 検索・カテゴリフィルター */}
                <div className="p-2 bg-gray-50 border-b border-gray-100 space-y-2">
                  <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      value={pairingSearch}
                      onChange={e => setPairingSearch(e.target.value)}
                      placeholder={language === 'ja' ? '調味料名で絞り込み...' : 'Filter by name...'}
                      className="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 bg-white"
                    />
                  </div>
                  <div className="flex gap-1 overflow-x-auto pb-0.5">
                    {['すべて', ...categories].map(cat => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setPairingCategory(cat)}
                        className={`flex-shrink-0 px-2.5 py-1 text-xs rounded-full transition-colors ${
                          pairingCategory === cat
                            ? 'bg-orange-500 text-white'
                            : 'bg-white border border-gray-200 text-gray-600 hover:border-orange-300'
                        }`}
                      >
                        {cat === 'すべて' ? (language === 'ja' ? 'すべて' : 'All') : (t(language, CATEGORY_KEYS[cat]) || cat)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 調味料リスト */}
                <div className="max-h-48 overflow-y-auto">
                  {availableCondiments
                    .filter(c =>
                      c.name !== formData.name &&
                      (pairingCategory === 'すべて' || c.category === pairingCategory) &&
                      c.name.toLowerCase().includes(pairingSearch.toLowerCase())
                    )
                    .length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      {language === 'ja' ? '該当する調味料がありません' : 'No condiments found'}
                    </p>
                  ) : (
                    availableCondiments
                      .filter(c =>
                        c.name !== formData.name &&
                        (pairingCategory === 'すべて' || c.category === pairingCategory) &&
                        c.name.toLowerCase().includes(pairingSearch.toLowerCase())
                      )
                      .map((c, i) => {
                        const selected = pairingCondiments.includes(c.name);
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => {
                              if (selected) {
                                removePairing(c.name);
                              } else {
                                setPairingCondiments(prev => [...prev, c.name]);
                              }
                            }}
                            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm border-b border-gray-50 transition-colors ${
                              selected
                                ? 'bg-orange-50 text-orange-800'
                                : 'hover:bg-gray-50 text-gray-800'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <span>{c.name}</span>
                              <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                                {t(language, CATEGORY_KEYS[c.category]) || c.category}
                              </span>
                            </div>
                            {selected && (
                              <span className="text-orange-500 text-xs font-medium">✓ 選択中</span>
                            )}
                          </button>
                        );
                      })
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'condimentImageLabel')}</label>
            {formData.imageUrl && (
              <div className="mb-2 relative">
                <img
                  src={formData.imageUrl}
                  alt={t(language, 'condimentImage')}
                  className="w-full h-48 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, imageUrl: '' })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {!showImageSearch ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileUpload}
                      className="hidden"
                    />
                    <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors">
                      <Image size={16} />
                      {t(language, 'uploadImage')}
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowImageSearch(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    <Search size={16} />
                    {t(language, 'searchImage')}
                  </button>
                </div>
                <input
                  type="url"
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'ja' ? 'または画像URLを入力' : 'Or enter image URL'}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={imageSearchQuery}
                    onChange={(e) => setImageSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleImageSearch())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t(language, 'imageSearchPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={handleImageSearch}
                    disabled={isSearching}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    <Search size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowImageSearch(false);
                      setSearchResults([]);
                      setImageSearchQuery('');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <X size={16} />
                  </button>
                </div>

                {isSearching && (
                  <p className="text-sm text-gray-500 text-center py-4">{t(language, 'searching')}</p>
                )}

                {!isSearching && searchResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {searchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectImage(result.url)}
                        className="aspect-square overflow-hidden rounded border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={result.url}
                          alt={result.description}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {!isSearching && searchResults.length === 0 && imageSearchQuery && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {language === 'ja' ? '画像が見つかりませんでした' : 'No images found'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'dishImageLabel')}</label>
            {formData.dishImageUrl && (
              <div className="mb-2 relative">
                <img
                  src={formData.dishImageUrl}
                  alt={t(language, 'dishImage')}
                  className="w-full h-48 object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, dishImageUrl: '' })}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            {!showDishImageSearch ? (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <label className="flex-1 cursor-pointer">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleDishImageFileUpload}
                      className="hidden"
                    />
                    <div className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors">
                      <Image size={16} />
                      {t(language, 'uploadImage')}
                    </div>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowDishImageSearch(true)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                  >
                    <Search size={16} />
                    {t(language, 'searchImage')}
                  </button>
                </div>
                <input
                  type="url"
                  value={formData.dishImageUrl}
                  onChange={(e) => setFormData({ ...formData, dishImageUrl: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={language === 'ja' ? 'または画像URLを入力（任意）' : 'Or enter image URL (optional)'}
                />
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={dishImageSearchQuery}
                    onChange={(e) => setDishImageSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleDishImageSearch())}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={t(language, 'imageSearchPlaceholder')}
                  />
                  <button
                    type="button"
                    onClick={handleDishImageSearch}
                    disabled={isDishSearching}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300"
                  >
                    <Search size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDishImageSearch(false);
                      setDishSearchResults([]);
                      setDishImageSearchQuery('');
                    }}
                    className="px-3 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  >
                    <X size={16} />
                  </button>
                </div>

                {isDishSearching && (
                  <p className="text-sm text-gray-500 text-center py-4">{t(language, 'searching')}</p>
                )}

                {!isDishSearching && dishSearchResults.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                    {dishSearchResults.map((result, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => selectDishImage(result.url)}
                        className="aspect-square overflow-hidden rounded border-2 border-gray-200 hover:border-blue-500 transition-colors"
                      >
                        <img
                          src={result.url}
                          alt={result.description}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}

                {!isDishSearching && dishSearchResults.length === 0 && dishImageSearchQuery && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    {language === 'ja' ? '画像が見つかりませんでした' : 'No images found'}
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {t(language, 'cancel')}
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {t(language, 'add')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
