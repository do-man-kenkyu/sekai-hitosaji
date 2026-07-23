import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Loader2, RefreshCw, Check } from 'lucide-react';
import { signIn, signUp, resendConfirmationEmail } from '../../lib/auth';
import { PREFECTURES } from '../types';
import { getTermsSections, getPrivacySections, CONTACT_EMAIL } from '../legalContent';
import { Language, t } from '../i18n/translations';

const TASTE_BADGES = [
  '辛党','甘党','塩味好き','酸味好き','苦味好き','旨味好き',
  'グルメ','健康志向','伝統派','冒険派','万能型',
  'スパイスマニア','発酵食品好き','無添加派',
  '減塩派','糖質控えめ','和食派','洋食派','中華好き','エスニック好き',
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
  language?: Language;
}

export function LoginModal({ onClose, onSuccess, language = 'ja' }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ログイン用
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 登録用
  const [nickname, setNickname] = useState('');
  const [fullName, setFullName] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [gender, setGender] = useState('回答しない');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [resendState, setResendState] = useState<'idle' | 'sending' | 'sent'>('idle');

  const handleResend = async () => {
    setResendState('sending');
    try {
      await resendConfirmationEmail(email);
      setResendState('sent');
    } catch {
      setResendState('idle');
    }
  };

  const toggleBadge = (badge: string) => {
    setSelectedBadges(prev =>
      prev.includes(badge) ? prev.filter(b => b !== badge) : [...prev, badge]
    );
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(email, password);
      onSuccess();
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials'
        ? 'メールアドレスまたはパスワードが正しくありません'
        : (err?.message || err?.error_description || 'ログインに失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!nickname.trim()) { setError('ニックネームを入力してください'); return; }
    if (!fullName.trim()) { setError('氏名を入力してください'); return; }
    if (!birthdate) { setError('生年月日を入力してください'); return; }
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return; }
    if (!agreedToTerms) { setError('利用規約に同意してください'); return; }
    setLoading(true);
    try {
      const { needsEmailConfirmation } = await signUp({
        email, password, nickname,
        fullName: fullName.trim(),
        birthdate,
        gender, prefecture, city,
        taste_badges: selectedBadges,
      });
      if (needsEmailConfirmation) {
        // メール確認待ち: 確認メール送信済みの画面を表示する
        setSignupDone(true);
      } else {
        // メール確認が無効な場合はそのままログイン完了
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message === 'User already registered'
        ? 'このメールアドレスは既に登録されています'
        : (err?.message || err?.error_description || '登録に失敗しました'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-bold">
            {mode === 'login' ? 'ログイン' : 'ユーザー登録'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {signupDone ? (
          <div className="p-8 flex flex-col items-center text-center gap-4">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center">
              <Mail size={28} className="text-green-500" />
            </div>
            <div>
              <p className="text-lg font-bold text-[#3d1f00] mb-1">確認メールを送信しました</p>
              <p className="text-sm text-gray-600">
                <span className="font-medium text-[#7c4a1e]">{email}</span> 宛にメールをお送りしました。
                メール内のリンクをクリックすると登録が完了し、そのままログイン状態になります。
              </p>
            </div>
            <p className="text-xs text-gray-400">
              メールが届かない場合は、迷惑メールフォルダもご確認ください。
            </p>
            {resendState === 'sent' ? (
              <p className="w-full flex items-center justify-center gap-1.5 py-2.5 text-sm text-green-600 font-medium">
                <Check size={16} />
                確認メールを再送しました
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resendState === 'sending'}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 border border-[#c17f3a] text-[#7c4a1e] rounded-xl hover:bg-[#fdf5ea] disabled:opacity-50 transition-colors text-sm font-medium"
              >
                {resendState === 'sending'
                  ? <Loader2 size={16} className="animate-spin" />
                  : <RefreshCw size={16} />}
                確認メールを再送する
              </button>
            )}
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              閉じる
            </button>
          </div>
        ) : (
        <>
        <div className="flex border-b">
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'login' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}
            onClick={() => { setMode('login'); setError(''); }}
          >
            ログイン
          </button>
          <button
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${mode === 'signup' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500'}`}
            onClick={() => { setMode('signup'); setError(''); }}
          >
            新規登録
          </button>
        </div>

        <form onSubmit={mode === 'login' ? handleLogin : handleSignUp} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
              {error}
            </div>
          )}

          {mode === 'signup' && (
            <>
              <div>
                <label className="block text-sm font-semibold mb-1">ニックネーム <span className="text-orange-500">*</span></label>
                <input
                  type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                  placeholder="例: 調味料マスター"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">氏名 <span className="text-orange-500">*</span></label>
                <input
                  type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                  placeholder="例: 山田 太郎"
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">管理者のみが確認できます。登録後の変更はできません。</p>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-semibold mb-1">メールアドレス <span className="text-orange-500">*</span></label>
            <div className="relative">
              <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border rounded-lg pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-1">パスワード <span className="text-orange-500">*</span></label>
            <div className="relative">
              <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'signup' ? '6文字以上' : 'パスワード'}
                className="w-full border rounded-lg pl-9 pr-10 py-2 text-sm focus:outline-none focus:border-orange-400"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {mode === 'signup' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">生年月日 <span className="text-orange-500">*</span></label>
                  <input type="date" value={birthdate} onChange={e => setBirthdate(e.target.value)}
                    max={new Date().toISOString().slice(0, 10)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">年齢は自動計算されます。登録後の変更はできません。</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">性別</label>
                  <select value={gender} onChange={e => setGender(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                    <option>回答しない</option>
                    <option>男性</option>
                    <option>女性</option>
                    <option>その他</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold mb-1">都道府県</label>
                  <select value={prefecture} onChange={e => setPrefecture(e.target.value)}
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400">
                    <option value="">選択</option>
                    {PREFECTURES.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">市区町村</label>
                  <input type="text" value={city} onChange={e => setCity(e.target.value)}
                    placeholder="例: 渋谷区"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2">味覚バッジ（複数選択可）</label>
                <div className="grid grid-cols-3 gap-2">
                  {TASTE_BADGES.map(badge => (
                    <button
                      key={badge} type="button"
                      onClick={() => toggleBadge(badge)}
                      className={`py-2 px-2 rounded-full text-xs border transition-all ${
                        selectedBadges.includes(badge)
                          ? 'bg-orange-500 border-orange-500 text-white'
                          : 'border-gray-200 text-gray-600 hover:border-orange-300'
                      }`}
                    >
                      {badge}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">{t(language, 'terms')}・{t(language, 'privacyPolicy')}</label>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto space-y-3 bg-gray-50 text-xs text-gray-700 leading-relaxed">
                  <p className="font-bold text-gray-800 text-sm border-b pb-1">■ {t(language, 'terms')}</p>
                  {getTermsSections(language).map(({ title, body, list, contact }) => (
                    <div key={title}>
                      <p className="font-bold text-gray-800 mb-1">{title}</p>
                      {body && <p>{body}</p>}
                      {list && (
                        <ol className="list-decimal list-inside space-y-0.5">
                          {list.map((item, i) => <li key={i}>{item}</li>)}
                        </ol>
                      )}
                      {contact && (
                        <p className="mt-1 text-gray-500">【{t(language, 'contactWindow')}】{CONTACT_EMAIL}</p>
                      )}
                    </div>
                  ))}
                  <p className="font-bold text-gray-800 text-sm border-b pb-1 pt-2">■ {t(language, 'privacyPolicy')}</p>
                  {getPrivacySections(language).map(({ title, body, list, contact }) => (
                    <div key={title}>
                      <p className="font-bold text-gray-800 mb-1">{title}</p>
                      {body && <p>{body}</p>}
                      {list && (
                        <ol className="list-decimal list-inside space-y-0.5">
                          {list.map((item, i) => <li key={i}>{item}</li>)}
                        </ol>
                      )}
                      {contact && (
                        <p className="mt-1 text-gray-500">【{t(language, 'contactWindow')}】{CONTACT_EMAIL}</p>
                      )}
                    </div>
                  ))}
                </div>
                <label className="flex items-start gap-2 mt-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={agreedToTerms}
                    onChange={e => setAgreedToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-orange-500 flex-shrink-0"
                  />
                  <span className="text-sm text-gray-700">
                    上記の利用規約およびプライバシーポリシーに同意します <span className="text-orange-500">*</span>
                  </span>
                </label>
              </div>
            </>
          )}

          <button
            type="submit" disabled={loading || (mode === 'signup' && !agreedToTerms)}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
        </>
        )}
      </div>
    </div>
  );
}
