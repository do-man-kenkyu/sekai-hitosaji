import { X, Check } from 'lucide-react';
import { Language, t } from '../i18n/translations';

interface ShareModalProps {
  condimentName: string;
  language: Language;
  onClose: () => void;
}

export function ShareModal({ condimentName, language, onClose }: ShareModalProps) {
  // GitHub Pages ではサブパス（/sekai-hitosaji/）配信のため、base を含めた正しいURLを共有する
  const siteUrl = window.location.origin + import.meta.env.BASE_URL;
  const shareText = language === 'ja'
    ? `「${condimentName}」を世界のひとさじに投稿しました！🌏`
    : `I posted "${condimentName}" on A Spoonful of the World! 🌏`;

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}`;
  const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(siteUrl)}&quote=${encodeURIComponent(shareText)}`;
  const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(siteUrl)}&text=${encodeURIComponent(shareText)}`;

  const openShare = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer,width=600,height=500');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
      <div className="bg-[#faf7f2] rounded-2xl max-w-sm w-full shadow-2xl border border-[#e2d5c0] overflow-hidden">
        {/* Header */}
        <div className="bg-[#3d1f00] px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#c17f3a] rounded-full flex items-center justify-center">
              <Check size={18} className="text-white" />
            </div>
            <h2 className="text-sm font-bold text-white">
              {t(language, 'postedSuccess')}
            </h2>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          <p className="text-sm text-[#5c3d20] mb-1 font-medium">
            「{condimentName}」
          </p>
          <p className="text-sm text-[#7c4a1e] mb-5">
            {t(language, 'shareSnsPrompt')}
          </p>

          <div className="space-y-2.5">
            {/* Twitter / X */}
            <button
              onClick={() => openShare(twitterUrl)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-black text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="text-lg font-bold w-6 text-center">𝕏</span>
              <span className="text-sm font-medium">{t(language, 'shareX')}</span>
            </button>

            {/* Facebook */}
            <button
              onClick={() => openShare(facebookUrl)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#1877f2] text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="text-lg font-bold w-6 text-center">f</span>
              <span className="text-sm font-medium">{t(language, 'shareFacebook')}</span>
            </button>

            {/* LINE */}
            <button
              onClick={() => openShare(lineUrl)}
              className="w-full flex items-center gap-3 px-4 py-3 bg-[#06c755] text-white rounded-xl hover:opacity-90 transition-opacity"
            >
              <span className="text-lg font-bold w-6 text-center">L</span>
              <span className="text-sm font-medium">{t(language, 'shareLine')}</span>
            </button>
          </div>

          <button
            onClick={onClose}
            className="w-full mt-4 px-4 py-2.5 text-[#a07850] hover:text-[#3d1f00] text-sm border border-[#e2d5c0] rounded-xl hover:bg-[#f5ede0] transition-colors"
          >
            {t(language, 'closeWithoutSharing')}
          </button>
        </div>
      </div>
    </div>
  );
}
