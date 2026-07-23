import { X, ScrollText, ShieldCheck } from 'lucide-react';
import {
  getTermsSections,
  getPrivacySections,
  TERMS_LAST_UPDATED,
  PRIVACY_LAST_UPDATED,
  CONTACT_EMAIL,
} from '../legalContent';
import { Language, t } from '../i18n/translations';

interface Props {
  type: 'terms' | 'privacy';
  onClose: () => void;
  language: Language;
}

export function LegalModal({ type, onClose, language }: Props) {
  const isTerms = type === 'terms';
  const sections = isTerms ? getTermsSections(language) : getPrivacySections(language);
  const title = isTerms ? t(language, 'terms') : t(language, 'privacyPolicy');
  const updatedMap = isTerms ? TERMS_LAST_UPDATED : PRIVACY_LAST_UPDATED;
  const lastUpdated = updatedMap[language === 'en' ? 'en' : 'ja'];
  const Icon = isTerms ? ScrollText : ShieldCheck;

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between p-6 border-b border-[#e2d5c0] flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icon size={20} className="text-[#c17f3a]" />
            <div>
              <h2 className="text-xl font-bold text-[#3d1f00]">{title}</h2>
              <p className="text-[10px] text-[#a07850]">{t(language, 'lastUpdated')}：{lastUpdated}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 text-sm text-[#3d1f00] leading-relaxed">
          {sections.map(({ title: sTitle, body, list, contact }) => (
            <div key={sTitle} className="bg-[#fdf9f3] rounded-xl border border-[#e2d5c0] p-4">
              <p className="font-bold text-[#7c4a1e] mb-1.5">{sTitle}</p>
              {body && <p className="text-[#5c3d20]">{body}</p>}
              {list && (
                <ol className="list-decimal list-inside space-y-0.5 text-[#5c3d20]">
                  {list.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
              )}
              {contact && (
                <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 mt-2 border border-[#e8d5b0]">
                  <p className="text-[#a07850] text-xs">{t(language, 'contactWindow')}：</p>
                  <p className="font-medium text-[#3d1f00] text-xs">{CONTACT_EMAIL}</p>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex-shrink-0 p-4 border-t border-[#e2d5c0]">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#7c4a1e] text-white rounded-xl hover:bg-[#3d1f00] transition-colors text-sm font-medium"
          >
            {t(language, 'close')}
          </button>
        </div>
      </div>
    </div>
  );
}
