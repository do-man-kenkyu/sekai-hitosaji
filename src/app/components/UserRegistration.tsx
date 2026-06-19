import { useState } from 'react';
import { X, Check, AlertTriangle, Mail } from 'lucide-react';
import { User, TasteBadge, PREFECTURES } from '../types';
import { Language, t } from '../i18n/translations';

interface UserRegistrationProps {
  onRegister: (user: User) => void;
  onClose: () => void;
  language: Language;
}

const tasteBadgeOptions: TasteBadge[] = [
  '辛党', '甘党', '塩味好き', '酸味好き', '苦味好き', '旨味好き',
  '舌が肥えている', 'グルメ', '健康志向', '伝統派', '冒険派', '万能型',
  'スパイスマニア', '発酵食品好き', '無添加派', 'オーガニック志向',
  '減塩派', '糖質控えめ', '和食派', '洋食派', '中華好き', 'エスニック好き',
  '本格派', '時短重視', 'コスパ重視', '高級志向', '地産地消', '希少品コレクター',
  '調味料オタク', '料理好き', '素材重視', '香り重視', '色彩重視', '食感重視',
  'ベジタリアン対応', 'ヴィーガン対応', 'ハラル対応'
];

export function UserRegistration({ onRegister, onClose, language }: UserRegistrationProps) {
  const [formData, setFormData] = useState({
    nickname: '',
    email: '',
    age: '',
    prefecture: '',
    city: '',
    gender: '回答しない' as User['gender']
  });
  const [selectedBadges, setSelectedBadges] = useState<TasteBadge[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  const toggleBadge = (badge: TasteBadge) => {
    if (selectedBadges.includes(badge)) {
      setSelectedBadges(selectedBadges.filter(b => b !== badge));
    } else {
      setSelectedBadges([...selectedBadges, badge]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.nickname && formData.email && formData.age && formData.prefecture && formData.city && selectedBadges.length > 0 && agreedToTerms) {
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{t(language, 'userRegistrationTitle')}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">{t(language, 'nickname')} *</label>
            <input
              type="text"
              required
              value={formData.nickname}
              onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'ja' ? '例: 調味料マスター' : 'e.g., Condiment Master'}
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              {language === 'ja' ? 'メールアドレス' : 'Email Address'} *
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder={language === 'ja' ? '例: example@email.com' : 'e.g., example@email.com'}
            />
            <p className="text-xs text-gray-500 mt-1">
              {language === 'ja'
                ? '権利侵害申告への対応などの重要なご連絡に使用します。公開されません。'
                : 'Used for important notices such as copyright infringement responses. Not made public.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t(language, 'age')} *</label>
              <input
                type="number"
                required
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="25"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t(language, 'gender')} *</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value as User['gender'] })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="男性">{t(language, 'male')}</option>
                <option value="女性">{t(language, 'female')}</option>
                <option value="その他">{t(language, 'otherGender')}</option>
                <option value="回答しない">{t(language, 'noAnswer')}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">{t(language, 'prefecture')} *</label>
              <select
                required
                value={formData.prefecture}
                onChange={(e) => setFormData({ ...formData, prefecture: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">{t(language, 'selectPrefecture')}</option>
                {PREFECTURES.map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">{t(language, 'city')} *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={language === 'ja' ? '例: 渋谷区' : 'e.g., Shibuya'}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">{t(language, 'tasteBadges')}</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {tasteBadgeOptions.map(badge => (
                <button
                  key={badge}
                  type="button"
                  onClick={() => toggleBadge(badge)}
                  className={`px-3 py-2 rounded-full text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                    selectedBadges.includes(badge)
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {selectedBadges.includes(badge) && <Check size={14} />}
                  {badge}
                </button>
              ))}
            </div>
          </div>

          {/* 利用規約 */}
          <div className="border border-orange-200 rounded-lg overflow-hidden">
            <div className="bg-orange-50 px-4 py-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
              <h3 className="font-semibold text-orange-800 text-sm">
                利用規約・著作権ポリシー
              </h3>
            </div>
            <div className="p-4 space-y-4 text-xs text-gray-700 max-h-64 overflow-y-auto bg-white leading-relaxed">
              <p className="text-gray-400 text-xs">最終更新日：2026年6月12日</p>

              <div>
                <p className="font-bold text-gray-800 mb-1">第1条（目的）</p>
                <p>本サービス「世界の調味料図鑑」（以下「本サービス」）は、世界各国の調味料に関する情報をユーザーが投稿・共有し、閲覧・検索できるプラットフォームです。ユーザーは本規約に同意の上、本サービスを利用するものとします。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第2条（投稿コンテンツ）</p>
                <p>ユーザーは、文章、画像、動画、レビューその他の情報（以下「投稿コンテンツ」）を投稿できます。投稿者は、投稿コンテンツについて必要な権利を有し、または適法な利用許諾を得ていることを保証するものとします。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第3条（禁止事項）</p>
                <p className="mb-1">ユーザーは以下の行為を行ってはなりません。</p>
                <ol className="list-decimal list-inside space-y-0.5 text-gray-600">
                  <li>他者の著作権、商標権、肖像権、プライバシー権その他の権利を侵害する行為</li>
                  <li>メーカー公式サイト、ECサイト、カタログ、雑誌等から無断転載した画像の投稿</li>
                  <li>虚偽または誤解を招く情報の投稿</li>
                  <li>誹謗中傷、差別的表現、嫌がらせ行為</li>
                  <li>法令または公序良俗に反する行為</li>
                  <li>スパム投稿、広告投稿、営利目的の不正利用</li>
                  <li>システムへの不正アクセス</li>
                  <li>その他、運営者が不適切と判断する行為</li>
                </ol>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第4条（投稿コンテンツの利用許諾）</p>
                <p>ユーザーは、投稿コンテンツについて著作権を保持します。ただしユーザーは運営者に対し、本サービスの運営、改善、広報、研究開発、マーケティング分析を目的として、投稿コンテンツを無償かつ非独占的に利用、複製、編集、公開、翻訳できる権利を許諾するものとします。この利用許諾は、ユーザーが投稿コンテンツを削除した後も、本サービス運営上必要な範囲で継続するものとします。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第5条（AI生成コンテンツ）</p>
                <p>AI技術により生成された画像または文章を投稿する場合、ユーザーは可能な限りその旨を明示するものとします。ユーザーはAI生成コンテンツについても第三者の権利を侵害しないことを保証するものとします。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第6条（コンテンツの削除）</p>
                <p className="mb-1">運営者は以下の場合、事前通知なく投稿コンテンツを削除または非公開にすることができます。</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600">
                  <li>本規約に違反した場合</li>
                  <li>権利侵害の申告があった場合</li>
                  <li>法令上の要請があった場合</li>
                  <li>サービス運営上不適切と判断した場合</li>
                </ul>
                <p className="mt-1">運営者は削除理由を説明する義務を負いません。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第7条（著作権ポリシー）</p>
                <p className="font-semibold text-gray-700 mb-0.5">1. 投稿者の責任</p>
                <p className="mb-1">投稿者は自身が権利を有するコンテンツのみを投稿してください。以下は禁止します。</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600 mb-2">
                  <li>他サイトからの画像転載</li>
                  <li>無断コピー</li>
                  <li>雑誌・書籍のスキャン画像</li>
                  <li>他者が撮影した画像の無断使用</li>
                </ul>
                <p className="font-semibold text-gray-700 mb-0.5">2. 権利侵害の申告</p>
                <p className="mb-1">権利侵害を発見した権利者または代理人の方は、以下の情報を添えてご連絡ください。</p>
                <ul className="list-disc list-inside space-y-0.5 text-gray-600 mb-2">
                  <li>権利者名・連絡先</li>
                  <li>対象コンテンツURL</li>
                  <li>権利侵害の内容</li>
                  <li>権利を有することを示す資料</li>
                </ul>
                <div className="flex items-center gap-2 bg-gray-50 rounded px-3 py-2">
                  <Mail size={12} className="text-gray-500 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs">【権利侵害申告窓口】</p>
                    <p className="font-medium text-gray-800">copyright@world-condiment.example.com</p>
                  </div>
                </div>
                <p className="mt-1 text-gray-500">運営者は内容確認後、合理的な期間内に対応します。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第8条（調味料情報に関する免責）</p>
                <p>本サービスに掲載される情報はユーザー投稿を含みます。運営者は情報の正確性、完全性、有用性、最新性を保証しません。原材料、栄養成分、アレルギー情報等については必ずメーカー公式情報をご確認ください。本サービスの情報に基づいて生じた損害について、運営者は責任を負いません。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第9条（サービスの変更・停止）</p>
                <p>運営者は事前通知なく本サービスの内容変更、停止、終了を行うことができます。これにより生じた損害について運営者は責任を負いません。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第10条（免責事項）</p>
                <p>ユーザー間または第三者との間で生じた紛争について、運営者は責任を負いません。ただし、運営者の故意または重大な過失による場合はこの限りではありません。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第11条（利用停止）</p>
                <p>運営者は規約違反が認められた場合、アカウント停止または利用制限を行うことができます。</p>
              </div>

              <div>
                <p className="font-bold text-gray-800 mb-1">第12条（準拠法・管轄）</p>
                <p>本規約は日本法に準拠します。本サービスに関して紛争が生じた場合、運営者所在地を管轄する裁判所を第一審の専属的合意管轄裁判所とします。</p>
              </div>
            </div>

            {/* 同意チェックボックス */}
            <div className="border-t border-orange-200 px-4 py-3 bg-orange-50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
                />
                <span className="text-sm text-orange-900">
                  {language === 'ja'
                    ? '上記の利用規約・著作権に関する注意事項を読み、内容に同意します。'
                    : 'I have read and agree to the Terms of Use and Copyright Notice above.'}
                </span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              {t(language, 'cancel')}
            </button>
            <button
              type="submit"
              disabled={!formData.nickname || !formData.email || !formData.age || !formData.prefecture || !formData.city || selectedBadges.length === 0 || !agreedToTerms}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {t(language, 'register')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
