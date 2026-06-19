import { Droplet, Coffee, Sparkles, Candy, Soup, FlaskConical, Flame, Layers, MoreHorizontal } from 'lucide-react';
import { Language, t, CATEGORY_KEYS } from '../i18n/translations';

interface CategoryGridProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  language: Language;
}

const categoryIcons: Record<string, any> = {
  '醤油': Droplet,
  '味噌': Coffee,
  '塩': Sparkles,
  '砂糖': Candy,
  '酢': Soup,
  '油': Droplet,
  'スパイス': Flame,
  'ソース': FlaskConical,
  'その他': MoreHorizontal,
};

const categoryColors: Record<string, string> = {
  '醤油': 'from-amber-100 to-amber-200 border-amber-300 text-amber-800',
  '味噌': 'from-yellow-100 to-yellow-200 border-yellow-300 text-yellow-800',
  '塩': 'from-gray-100 to-gray-200 border-gray-300 text-gray-800',
  '砂糖': 'from-pink-100 to-pink-200 border-pink-300 text-pink-800',
  '酢': 'from-lime-100 to-lime-200 border-lime-300 text-lime-800',
  '油': 'from-orange-100 to-orange-200 border-orange-300 text-orange-800',
  'スパイス': 'from-red-100 to-red-200 border-red-300 text-red-800',
  'ソース': 'from-purple-100 to-purple-200 border-purple-300 text-purple-800',
  'その他': 'from-indigo-100 to-indigo-200 border-indigo-300 text-indigo-800',
};

export function CategoryGrid({ selectedCategory, onSelectCategory, language }: CategoryGridProps) {
  const categories = ['醤油', '味噌', '塩', '砂糖', '酢', '油', 'スパイス', 'ソース', 'その他'];

  return (
    <div className="mb-8 bg-white">
      <h2 className="text-xl font-semibold mb-4">
        {t(language, 'browseByCategory')}
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        <button
          onClick={() => onSelectCategory('すべて')}
          className={`p-4 rounded-lg border-2 transition-all ${
            selectedCategory === 'すべて'
              ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-lg scale-105'
              : 'bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 text-blue-800 hover:shadow-md hover:scale-105'
          }`}
        >
          <div className="flex flex-col items-center gap-2">
            <Layers size={32} />
            <span className="font-medium text-sm">{t(language, 'all')}</span>
          </div>
        </button>

        {categories.map((category) => {
          const Icon = categoryIcons[category];
          const isSelected = selectedCategory === category;

          return (
            <button
              key={category}
              onClick={() => onSelectCategory(category)}
              className={`p-4 rounded-lg border-2 transition-all ${
                isSelected
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 border-blue-600 text-white shadow-lg scale-105'
                  : `bg-gradient-to-br ${categoryColors[category]} border-2 hover:shadow-md hover:scale-105`
              }`}
            >
              <div className="flex flex-col items-center gap-2">
                <Icon size={32} />
                <span className="font-medium text-sm">{t(language, CATEGORY_KEYS[category])}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
