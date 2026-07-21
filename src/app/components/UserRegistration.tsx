import { useState } from 'react';
import { X, Check, AlertTriangle, Mail, ChevronRight, ScrollText } from 'lucide-react';
import { User, TasteBadge, PREFECTURES } from '../types';
import { Language, t } from '../i18n/translations';

interface UserRegistrationProps {
  onRegister: (user: User) => void;
  onClose: () => void;
  language: Language;
}

const tasteBadgeOptions: TasteBadge[] = [
  '辛党', '甘党', '塩味好き', '酸味好き', '苦味好き', '旨味好き',
  'グルメ', '健康志向', '伝統派', '冒険派', '万能型',
  'スパイスマニア', '発酵食品好き', '無添加派',
  '減塩派', '糖質控えめ', '和食派', '洋食派', '中華好き', 'エスニック好き',
  '本格派', '時短重視', 'コスパ重視', '高級志向', '地産地消', '希少品コレクター',
  '調味料オタク', '料理好き', '素材重視', '香り重視', '色彩重視', '食感重視',
  'ベジタリアン対応', 'ヴィーガン対応', 'ハラル対応'
];

export function UserRegistration({ onRegister, onClose, language }: UserRegistrationProps) {
  const [step, setStep] = useState<'terms' | 'form'>('terms');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    age: '',
    prefecture: '',
    city: '',
    gender: '回答しない' as User['gender']
  });
  const [selectedBadges, setSelectedBadges] = useState<TasteBadge[]>([]);

  const toggleBadge = (badge: TasteBadge) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nickname && formData.email && formData.age && formData.prefecture && formData.city && selectedBadges.length > 0) {
      const user: User = {
        id: Date.now().toString(),
        nickname: formData.nickname,
        email: formData.email,
        age: parseInt(formData.age),
        prefecture: formData.prefecture,
        city: formData.city,
        gender: formData.gender,
        tasteBadges: selectedBadges
      };
      onRegister(user);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-[#faf7f2] rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-[#e2d5c0]">

        {/* Header */}
        <div className="sticky top-0 bg-[#faf7f2] border-b border-[#e2d5c0] px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#7c4a1e] rounded-lg flex items-center justify-center">
              <ScrollText size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#3d1f00]">{t(language, 'userRegistrationTitle')}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <div className={`flex items-center gap-1 text-xs ${step === 'terms' ? 'text-[#7c4a1e] font-semibold' : 'text-[#a07850]'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'terms' ? 'bg-[#7c4a1e] text-white' : 'bg-[#c17f3a] text-white'}`}>
                    {step === 'form' ? <Check size={10} /> : '1'}
                  </div>
                  利用規約
                </div>
                <ChevronRight size={12} className="text-[#c17f3a]" />
                <div className={`flex items-center gap-1 text-xs ${step === 'form' ? 'text-[#7c4a1e] font-semibold' : 'text-[#a07850]'}`}>
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${step === 'form' ? 'bg-[#7c4a1e] text-white' : 'bg-[#e2d5c0] text-[#a07850]'}`}>2</div>
                  プロフィール
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-[#a07850] hover:text-[#3d1f00] hover:bg-[#f0e6d8] rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Terms */}
        {step === 'terms' && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="px-6 pt-5 pb-2">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle size={16} className="text-[#c17f3a]" />
                <span className="text-sm font-bold text-[#3d1f00]">
                  {language === 'ja' ? '利用規約・著作権ポリシー' : 'Terms of Use & Copyright Policy'}
                </span>
                <span className="text-[10px] text-[#a07850] ml-auto">最終更新日：2026年6月12日</span>
              </div>
              <p className="text-xs text-[#7c4a1e] mb-3">
                {language === 'ja'
                  ? '会員登録の前に、以下の利用規約をお読みください。'
                  : 'Please read the following Terms of Use before registering.'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-2 space-y-4 text-xs text-[#3d1f00] leading-relaxed">
              {[
                { title: '第1条（目的）', body: '本サービス「世界のひとさじ」（以下「本サービス」）は、世界各国の調味料に関する情報をユーザーが投稿・共有し、閲覧・検索できるプラットフォームです。ユーザーは本規約に同意の上、本サービスを利用するものとします。' },
                { title: '第2条（投稿コンテンツ）', body: 'ユーザーは、文章、画像、動画、レビューその他の情報（以下「投稿コンテンツ」）を投稿できます。投稿者は、投稿コンテンツについて必要な権利を有し、または適法な利用許諾を得ていることを保証するものとします。' },
                { title: '第3条（禁止事項）', body: null, list: ['他者の著作権、商標権、肖像権、プライバシー権その他の権利を侵害する行為', 'メーカー公式サイト、ECサイト、カタログ、雑誌等から無断転載した画像の投稿', '虚偽または誤解を招く情報の投稿', '誹謗中傷、差別的表現、嫌がらせ行為', '法令または公序良俗に反する行為', 'スパム投稿、広告投稿、営利目的の不正利用', 'システムへの不正アクセス', 'その他、運営者が不適切と判断する行為'] },
                { title: '第4条（投稿コンテンツの利用許諾）', body: 'ユーザーは、投稿コンテンツについて著作権を保持します。ただしユーザーは運営者に対し、本サービスの運営・改善・広報・研究開発・マーケティング分析を目的として、投稿コンテンツを無償かつ非独占的に利用、複製、編集、公開、翻訳できる権利を許諾するものとします。' },
                { title: '第5条（AI生成コンテンツ）', body: 'AI技術により生成された画像または文章を投稿する場合、ユーザーは可能な限りその旨を明示するものとします。AI生成コンテンツについても第三者の権利を侵害しないことを保証するものとします。' },
                { title: '第6条（コンテンツの削除）', body: '運営者は規約違反、権利侵害申告、法令上の要請があった場合、事前通知なく投稿コンテンツを削除または非公開にすることができます。' },
                { title: '第7条（著作権ポリシー）', body: '投稿者は自身が権利を有するコンテンツのみを投稿してください。他サイトからの無断転載、雑誌・書籍のスキャン画像、他者が撮影した画像の無断使用は禁止します。権利侵害を発見した場合は下記窓口へご連絡ください。', contact: true },
                { title: '第8条（免責事項）', body: '掲載情報はユーザー投稿を含みます。原材料、栄養成分、アレルギー情報等については必ずメーカー公式情報をご確認ください。本サービスの情報に基づいて生じた損害について、運営者は責任を負いません。' },
                { title: '第12条（準拠法・管轄）', body: '本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。' },
              ].map(({ title, body, list, contact }) => (
                <div key={title} className="bg-white rounded-xl border border-[#e2d5c0] p-3">
                  <p className="font-bold text-[#7c4a1e] mb-1.5 text-xs">{title}</p>
                  {body && <p className="text-[#5c3d20]">{body}</p>}
                  {list && (
                    <ol className="list-decimal list-inside space-y-0.5 text-[#5c3d20]">
                      {list.map((item, i) => <li key={i}>{item}</li>)}
                    </ol>
                  )}
                  {contact && (
                    <div className="flex items-center gap-2 bg-[#fdf5ea] rounded-lg px-3 py-2 mt-2 border border-[#e8d5b0]">
                      <Mail size={12} className="text-[#c17f3a] flex-shrink-0" />
                      <div>
                        <p className="text-[#a07850] text-[10px]">【権利侵害申告窓口】</p>
                        <p className="font-medium text-[#3d1f00]">copyright@world-condiment.example.com</p>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Agreement */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-[#e2d5c0] bg-[#faf7f2] space-y-3">
              <label className="flex items-start gap-3 cursor-pointer p-3 bg-[#fdf5ea] border border-[#c17f3a] rounded-xl">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-[#7c4a1e] flex-shrink-0"
                />
                <span className="text-sm text-[#3d1f00] font-medium">
                  {language === 'ja'
                    ? '上記の利用規約・著作権ポリシーを読み、内容に同意します。'
                    : 'I have read and agree to the Terms of Use and Copyright Policy above.'}
                </span>
              </label>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-[#e2d5c0] rounded-xl text-[#7c4a1e] hover:bg-[#f5ede0] transition-colors text-sm"
                >
                  {t(language, 'cancel')}
                </button>
                <button
                  type="button"
                  disabled={!agreedToTerms}
                  onClick={() => setStep('form')}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#7c4a1e] text-white rounded-xl hover:bg-[#3d1f00] disabled:bg-[#e2d5c0] disabled:text-[#a07850] disabled:cursor-not-allowed transition-colors text-sm font-medium"
                >
                  {language === 'ja' ? '同意して次へ' : 'Agree & Continue'}
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Registration Form */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto flex flex-col">
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              <div>
                <label className="block text-xs font-bold text-[#7c4a1e] mb-1.5 tracking-wide">{t(language, 'nickname')} *</label>
                <input
                  type="text"
                  required
                  value={formData.nickname}
                  onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#e2d5c0] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-[#3d1f00] text-sm"
                  placeholder={language === 'ja' ? '例: 調味料マスター' : 'e.g., Condiment Master'}
                  maxLength={20}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c4a1e] mb-1.5 tracking-wide">
                  {language === 'ja' ? 'メールアドレス' : 'Email Address'} *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2.5 border border-[#e2d5c0] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-[#3d1f00] text-sm"
                  placeholder="example@email.com"
                />
                <p className="text-[10px] text-[#a07850] mt-1">
                  {language === 'ja' ? '権利侵害申告への対応などの重要なご連絡に使用します。公開されません。' : 'Used for important notices. Not made public.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c4a1e] mb-1.5 tracking-wide">{t(language, 'age')} *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="120"
                    value={formData.age}
                    onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#e2d5c0] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-[#3d1f00] text-sm"
                    placeholder="25"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7c4a1e] mb-1.5 tracking-wide">{t(language, 'gender')} *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as User['gender'] })}
                    className="w-full px-3 py-2.5 border border-[#e2d5c0] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-[#3d1f00] text-sm"
                  >
                    <option value="男性">{t(language, 'male')}</option>
                    <option value="女性">{t(language, 'female')}</option>
                    <option value="その他">{t(language, 'otherGender')}</option>
                    <option value="回答しない">{t(language, 'noAnswer')}</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#7c4a1e] mb-1.5 tracking-wide">{t(language, 'prefecture')} *</label>
                  <select
                    required
                    value={formData.prefecture}
                    onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#e2d5c0] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-[#3d1f00] text-sm"
                  >
                    <option value="">{t(language, 'selectPrefecture')}</option>
                    {PREFECTURES.map(pref => (
                      <option key={pref} value={pref}>{pref}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#7c4a1e] mb-1.5 tracking-wide">{t(language, 'city')} *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[#e2d5c0] bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-[#c17f3a] text-[#3d1f00] text-sm"
                    placeholder={language === 'ja' ? '例: 渋谷区' : 'e.g., Shibuya'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#7c4a1e] mb-2 tracking-wide">{t(language, 'tasteBadges')}</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {tasteBadgeOptions.map(badge => (
                    <button
                      key={badge}
                      type="button"
                      onClick={() => toggleBadge(badge)}
                      className={`px-3 py-2 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-1 border ${
                        selectedBadges.includes(badge)
                          ? 'bg-[#7c4a1e] text-white border-[#7c4a1e]'
                          : 'bg-white text-[#5c3d20] border-[#e2d5c0] hover:border-[#c17f3a] hover:bg-[#fdf5ea]'
                      }`}
                    >
                      {selectedBadges.includes(badge) && <Check size={11} />}
                      {badge}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex-shrink-0 px-6 py-4 border-t border-[#e2d5c0] bg-[#faf7f2] flex gap-3">
              <button
                type="button"
                onClick={() => setStep('terms')}
                className="px-4 py-2.5 border border-[#e2d5c0] rounded-xl text-[#7c4a1e] hover:bg-[#f5ede0] transition-colors text-sm"
              >
                ← 戻る
              </button>
              <button
                type="submit"
                disabled={!formData.nickname || !formData.email || !formData.age || !formData.prefecture || !formData.city || selectedBadges.length === 0}
                className="flex-1 px-4 py-2.5 bg-[#7c4a1e] text-white rounded-xl hover:bg-[#3d1f00] disabled:bg-[#e2d5c0] disabled:text-[#a07850] disabled:cursor-not-allowed transition-colors text-sm font-medium"
              >
                {t(language, 'register')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
