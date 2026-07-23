import { useState } from 'react';
import { X, Star, MapPin, Globe, Heart, Bookmark, ChevronLeft, Utensils, ShoppingBag, User, Sparkles } from 'lucide-react';
import { Condiment, User as UserType } from '../types';
import { TasteRadarChart } from './TasteRadarChart';
import { TranslateModal } from './TranslateModal';
import { Comments } from './Comments';
import { Language, t, CATEGORY_KEYS, PURCHASE_LOCATION_KEYS } from '../i18n/translations';

interface CondimentDetailProps {
  condiment: Condiment;
  onClose: () => void;
  language: Language;
  onToggleLike: (condimentId: string) => void;
  onToggleBookmark: (condimentId: string) => void;
  isLiked: boolean;
  isBookmarked: boolean;
  currentUser?: UserType | null;
}

export function CondimentDetail({ condiment, onClose, language, onToggleLike, onToggleBookmark, isLiked, isBookmarked, currentUser }: CondimentDetailProps) {
  const [showTranslate, setShowTranslate] = useState(false);
  const [translateContent, setTranslateContent] = useState({ title: '', text: '' });
  const [selectedImage, setSelectedImage] = useState(condiment.imageUrl);
  const locale = language === 'ja' ? 'ja-JP' : 'en-US';

  const tasteLabels: Record<string, string> = {
    sweetness: t(language, 'sweetness'),
    sourness: t(language, 'sourness'),
    bitterness: t(language, 'bitterness'),
    umami: t(language, 'umami'),
    saltiness: t(language, 'saltiness'),
    richness: t(language, 'richness'),
    aroma: t(language, 'aroma'),
  };

  const topTastes = Object.entries(condiment.tasteProfile)
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center sm:p-6"
      onClick={onClose}
    >
    <div
      className="bg-[#faf7f2] w-full sm:max-w-lg sm:rounded-2xl max-h-[95vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >

      {/* Hero Image */}
      <div className="relative h-64 bg-white flex-shrink-0 overflow-hidden flex items-center justify-center p-3">
        {selectedImage ? (
          <img src={selectedImage} alt={condiment.name} className="w-full h-full object-contain" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🧂</div>
        )}
        {/* Dark gradient overlay at bottom only for text legibility */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#3d1f00]/70 to-transparent" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={onClose}
            className="flex items-center gap-1 text-white/80 hover:text-white bg-black/20 rounded-full px-3 py-1.5 text-sm backdrop-blur-sm"
          >
            <ChevronLeft size={16} />
            {t(language, 'back')}
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleLike(condiment.id)}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${isLiked ? 'bg-red-500/80 text-white' : 'bg-black/20 text-white/80 hover:bg-red-500/60'}`}
            >
              <Heart size={18} className={isLiked ? 'fill-white' : ''} />
            </button>
            <button
              onClick={() => onToggleBookmark(condiment.id)}
              className={`p-2 rounded-full backdrop-blur-sm transition-colors ${isBookmarked ? 'bg-[#c17f3a]/80 text-white' : 'bg-black/20 text-white/80 hover:bg-[#c17f3a]/60'}`}
            >
              <Bookmark size={18} className={isBookmarked ? 'fill-white' : ''} />
            </button>
            <button
              onClick={() => {
                setTranslateContent({ title: condiment.name, text: condiment.description });
                setShowTranslate(true);
              }}
              className="p-2 rounded-full bg-black/20 text-white/80 hover:bg-black/40 backdrop-blur-sm transition-colors"
            >
              <Globe size={18} />
            </button>
          </div>
        </div>

        {/* Bottom info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <div className="flex items-end justify-between gap-2">
            <div>
              <span className="inline-block px-2 py-0.5 border border-[#c17f3a] text-[#e8d5b0] text-[10px] rounded mb-2">
                {t(language, CATEGORY_KEYS[condiment.category])}
              </span>
              <h2 className="text-2xl font-bold text-white leading-tight">{condiment.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                <MapPin size={12} className="text-[#c17f3a]" />
                <span className="text-sm text-[#e8d5b0]">{condiment.origin}</span>
              </div>
            </div>
            <div className="flex flex-col items-center bg-black/30 backdrop-blur-sm rounded-xl px-3 py-2">
              <div className="flex items-center gap-0.5 mb-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} size={12} className={i < condiment.repeatRating ? 'text-[#c17f3a] fill-[#c17f3a]' : 'text-white/20'} />
                ))}
              </div>
              <span className="text-lg font-bold text-white">{condiment.repeatRating.toFixed(1)}</span>
              <span className="text-[9px] text-[#e8d5b0]">{t(language, 'ratingShort')}</span>
            </div>
          </div>
        </div>

        {/* Thumbnail strip */}
        {condiment.dishImageUrl && (
          <div className="absolute right-4 bottom-20 flex flex-col gap-1.5">
            {[condiment.imageUrl, condiment.dishImageUrl].filter(Boolean).map((url, i) => (
              <button
                key={i}
                onClick={() => setSelectedImage(url!)}
                className={`w-10 h-10 rounded-lg overflow-hidden border-2 transition-all ${selectedImage === url ? 'border-[#c17f3a]' : 'border-white/30'}`}
              >
                <img src={url!} alt="" className="w-full h-full object-contain bg-white p-0.5" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-5 py-5 space-y-5">

          {/* Description */}
          <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#e2d5c0] bg-[#faf7f2]">
              <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">{t(language, 'description')}</span>
            </div>
            <p className="px-4 py-3 text-sm text-[#3d1f00] leading-relaxed">{condiment.description}</p>
          </div>

          {/* Recommended dishes — prominent */}
          {condiment.recommendedDishes.length > 0 && (
            <div className="bg-[#3d1f00] rounded-2xl overflow-hidden">
              <div className="px-4 py-3 flex items-center gap-2 border-b border-white/10">
                <Utensils size={14} className="text-[#c17f3a]" />
                <span className="text-xs font-bold text-white tracking-wider">{t(language, 'recommendedDishes')}</span>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {condiment.recommendedDishes.map((dish, i) => (
                  <span key={i} className="px-3 py-1.5 bg-white/10 text-[#e8d5b0] text-sm rounded-lg border border-white/10 font-medium">
                    {dish}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Pairing condiments */}
          {condiment.pairingCondiments && condiment.pairingCondiments.length > 0 && (
            <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
              <div className="px-4 py-2 border-b border-[#e2d5c0] bg-[#faf7f2] flex items-center gap-2">
                <Sparkles size={13} className="text-[#c17f3a]" />
                <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">
                  {t(language, 'pairsWellWith')}
                </span>
              </div>
              <div className="px-4 py-3 flex flex-wrap gap-2">
                {condiment.pairingCondiments.map((name, i) => (
                  <span key={i} className="px-3 py-1.5 bg-[#fdf5ea] border border-[#e8d5b0] rounded-lg text-sm text-[#7c4a1e] font-medium">
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Taste highlights + radar */}
          <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#e2d5c0] bg-[#faf7f2] flex items-center gap-2">
              <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">{t(language, 'tasteProfile')}</span>
            </div>
            <div className="px-4 pt-3 pb-1 flex flex-wrap gap-1.5">
              {topTastes.map(([key, val]) => (
                <span key={key} className="flex items-center gap-1 px-2.5 py-1 bg-[#fdf5ea] border border-[#e8d5b0] rounded-full text-xs text-[#7c4a1e] font-medium">
                  {tasteLabels[key]}
                  <span className="font-bold text-[#c17f3a]">{val}</span>
                </span>
              ))}
            </div>
            <div className="px-4 pb-3">
              <TasteRadarChart tasteProfile={condiment.tasteProfile} size="medium" language={language} />
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-xl border border-[#e2d5c0] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <ShoppingBag size={12} className="text-[#c17f3a]" />
                <span className="text-[10px] font-bold text-[#7c4a1e] uppercase tracking-wide">{t(language, 'purchaseLocation')}</span>
              </div>
              <p className="text-sm font-medium text-[#3d1f00]">{t(language, PURCHASE_LOCATION_KEYS[condiment.purchaseLocation])}</p>
            </div>
            <div className="bg-white rounded-xl border border-[#e2d5c0] p-3">
              <div className="flex items-center gap-1.5 mb-1">
                <MapPin size={12} className="text-[#c17f3a]" />
                <span className="text-[10px] font-bold text-[#7c4a1e] uppercase tracking-wide">{t(language, 'origin')}</span>
              </div>
              <p className="text-sm font-medium text-[#3d1f00]">{condiment.origin}</p>
            </div>
          </div>

          {/* Dish photo */}
          {condiment.dishImageUrl && (
            <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
              <div className="px-4 py-2 border-b border-[#e2d5c0] bg-[#faf7f2]">
                <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">{t(language, 'dishPhoto')}</span>
              </div>
              <div className="aspect-video">
                <img src={condiment.dishImageUrl} alt="dish" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          {/* Posted by */}
          <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
            <div className="px-4 py-2 border-b border-[#e2d5c0] bg-[#faf7f2] flex items-center gap-2">
              <User size={12} className="text-[#c17f3a]" />
              <span className="text-[10px] font-bold text-[#7c4a1e] tracking-widest uppercase">{t(language, 'postedBy')}</span>
            </div>
            <div className="px-4 py-3">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-[#f5ede0] rounded-full flex items-center justify-center text-[#7c4a1e] font-bold text-sm">
                  {condiment.postedBy.nickname[0]}
                </div>
                <div>
                  <p className="text-sm font-bold text-[#3d1f00]">{condiment.postedBy.nickname}</p>
                  <p className="text-[10px] text-[#a07850]">{new Date(condiment.createdAt).toLocaleDateString(locale)}</p>
                </div>
              </div>
              {condiment.postedBy.tasteBadges.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {condiment.postedBy.tasteBadges.map((badge, i) => (
                    <span key={i} className="px-2 py-0.5 bg-[#f5ede0] text-[#7c4a1e] text-[10px] rounded-full border border-[#e2d5c0]">
                      {badge}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-2xl border border-[#e2d5c0] overflow-hidden">
            <Comments condimentId={condiment.id} currentUser={currentUser ?? null} />
          </div>

          <div className="h-4" />
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
    </div>
  );
}
