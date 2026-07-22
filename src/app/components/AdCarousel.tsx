import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { Language, t } from '../i18n/translations';
import { withBase } from '../assetPath';

interface Ad {
  id: string;
  title: string;
  sponsor: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
  bgColor: string;
}

// 広告データ。実際の広告主が決まったらここを差し替えてください。
const ADS: Ad[] = [
  {
    id: 'ad-1',
    title: '全国の醤油蔵から直送',
    sponsor: '醤油の里',
    description: '厳選された蔵元の本醸造醤油をお届け',
    imageUrl: '/condiments/05_a.jpg',
    linkUrl: '#',
    bgColor: '#3d1f00',
  },
  {
    id: 'ad-2',
    title: '天然塩の専門店',
    sponsor: 'Solco',
    description: '日本各地の海からとれたこだわりの塩',
    imageUrl: '/condiments/10_a.jpeg',
    linkUrl: '#',
    bgColor: '#5c3d20',
  },
  {
    id: 'ad-3',
    title: '調味料選手権 受賞商品特集',
    sponsor: '道満調味料研究所',
    description: '受賞歴のある逸品をまとめてチェック',
    imageUrl: '/condiments/13_a.jpg',
    linkUrl: '#',
    bgColor: '#7c4a1e',
  },
];

interface AdCarouselProps {
  language: Language;
}

export function AdCarousel({ language }: AdCarouselProps) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex(i => (i + 1) % ADS.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const go = (dir: number) => {
    setIndex(i => (i + dir + ADS.length) % ADS.length);
  };

  const ad = ADS[index];

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-bold text-[#a07850] tracking-widest uppercase">
          {t(language, 'sponsored')}
        </span>
        <div className="flex-1 h-px bg-[#e2d5c0]" />
      </div>

      <div className="relative rounded-2xl overflow-hidden border border-[#e2d5c0] shadow-sm">
        <a
          href={ad.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block group"
          style={{ backgroundColor: ad.bgColor }}
        >
          <div className="flex items-center h-28 sm:h-32">
            {/* Image */}
            <div className="h-full w-28 sm:w-40 flex-shrink-0 bg-white flex items-center justify-center p-1.5">
              <img src={withBase(ad.imageUrl)} alt={ad.title} className="w-full h-full object-contain" />
            </div>
            {/* Text */}
            <div className="flex-1 px-4 py-3 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span className="px-1.5 py-0.5 bg-white/20 text-white/90 text-[10px] rounded">
                  {ad.sponsor}
                </span>
              </div>
              <h3 className="text-white font-bold text-sm sm:text-base leading-tight mb-1 truncate">
                {ad.title}
              </h3>
              <p className="text-white/70 text-xs line-clamp-2">{ad.description}</p>
              <span className="inline-flex items-center gap-1 text-[#e8d5b0] text-[10px] mt-1.5 group-hover:text-white transition-colors">
                {t(language, 'learnMore')}
                <ExternalLink size={10} />
              </span>
            </div>
          </div>
        </a>

        {/* Arrows */}
        <button
          onClick={(e) => { e.preventDefault(); go(-1); }}
          className="absolute left-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="previous"
        >
          <ChevronLeft size={16} />
        </button>
        <button
          onClick={(e) => { e.preventDefault(); go(1); }}
          className="absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 bg-black/30 hover:bg-black/50 rounded-full flex items-center justify-center text-white transition-colors"
          aria-label="next"
        >
          <ChevronRight size={16} />
        </button>

        {/* Dots */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex gap-1.5">
          {ADS.map((_, i) => (
            <button
              key={i}
              onClick={(e) => { e.preventDefault(); setIndex(i); }}
              className={`w-1.5 h-1.5 rounded-full transition-colors ${i === index ? 'bg-white' : 'bg-white/40'}`}
              aria-label={`slide ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
