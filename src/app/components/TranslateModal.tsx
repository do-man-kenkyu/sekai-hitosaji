import { useState } from 'react';
import { X, Globe, Loader } from 'lucide-react';
import { Language } from '../i18n/translations';

interface TranslateModalProps {
  text: string;
  title: string;
  onClose: () => void;
  currentLanguage: Language;
}

type TranslationLanguage = 'en' | 'ja' | 'zh' | 'ko' | 'th' | 'vi' | 'ar' | 'de' | 'pt' | 'it' | 'es' | 'fr' | 'ru';

const LANGUAGES: { code: TranslationLanguage; name: string; nativeName: string }[] = [
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'ko', name: 'Korean', nativeName: '한국어' },
  { code: 'th', name: 'Thai', nativeName: 'ไทย' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'fr', name: 'French', nativeName: 'Français' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
];

export function TranslateModal({ text, title, onClose, currentLanguage }: TranslateModalProps) {
  const [selectedLang, setSelectedLang] = useState<TranslationLanguage>('en');
  const [translatedText, setTranslatedText] = useState<string>('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [error, setError] = useState<string>('');

  const handleTranslate = async () => {
    setIsTranslating(true);
    setError('');
    setTranslatedText('');

    try {
      // Using Google Translate widget (free, but limited)
      // Note: This is a demonstration. For production, use proper Google Cloud Translation API
      const sourceLang = currentLanguage === 'ja' ? 'ja' : 'en';
      const targetLang = selectedLang;

      // Create Google Translate URL
      const translateUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;

      const response = await fetch(translateUrl);
      const data = await response.json();

      if (data && data[0] && data[0][0] && data[0][0][0]) {
        const translated = data[0].map((item: any) => item[0]).join('');
        setTranslatedText(translated);
      } else {
        throw new Error('Translation failed');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError(
        currentLanguage === 'ja'
          ? '翻訳に失敗しました。インターネット接続を確認してください。'
          : 'Translation failed. Please check your internet connection.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={24} className="text-blue-500" />
            <h2 className="text-xl font-semibold">
              {currentLanguage === 'ja' ? '翻訳' : 'Translate'}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <h3 className="font-medium mb-2">{title}</h3>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{text}</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              {currentLanguage === 'ja' ? '翻訳先の言語を選択' : 'Select target language'}
            </label>
            <select
              value={selectedLang}
              onChange={(e) => setSelectedLang(e.target.value as TranslationLanguage)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {LANGUAGES.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.nativeName} ({lang.name})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleTranslate}
            disabled={isTranslating}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:bg-gray-300"
          >
            {isTranslating ? (
              <>
                <Loader size={20} className="animate-spin" />
                {currentLanguage === 'ja' ? '翻訳中...' : 'Translating...'}
              </>
            ) : (
              <>
                <Globe size={20} />
                {currentLanguage === 'ja' ? '翻訳する' : 'Translate'}
              </>
            )}
          </button>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {translatedText && (
            <div>
              <h3 className="font-medium mb-2">
                {currentLanguage === 'ja' ? '翻訳結果' : 'Translation Result'}
                <span className="ml-2 text-sm text-gray-500">
                  ({LANGUAGES.find(l => l.code === selectedLang)?.nativeName})
                </span>
              </h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{translatedText}</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                {currentLanguage === 'ja'
                  ? '※ Google翻訳による自動翻訳です'
                  : '※ Automatic translation by Google Translate'}
              </p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              {currentLanguage === 'ja' ? (
                <>
                  <strong>ヒント：</strong> この翻訳機能はGoogle翻訳を使用しています。正確な翻訳のために、元のテキストは明確で簡潔であることが推奨されます。
                </>
              ) : (
                <>
                  <strong>Tip:</strong> This translation feature uses Google Translate. For accurate translations, the original text should be clear and concise.
                </>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
