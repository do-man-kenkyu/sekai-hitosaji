import { useState } from 'react';
import { X, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { signIn, signUp } from '../../lib/auth';
import { PREFECTURES } from '../types';

const TASTE_BADGES = [
  '辛党','甘党','塩味好き','酸味好き','苦味好き','旨味好き',
  'グルメ','健康志向','伝統派','冒険派','万能型',
  'スパイスマニア','発酵食品好き','無添加派',
  '減塩派','糖質控えめ','和食派','洋食派','中華好き','エスニック好き',
];

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export function LoginModal({ onClose, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // ログイン用
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // 登録用
  const [nickname, setNickname] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('回答しない');
  const [prefecture, setPrefecture] = useState('');
  const [city, setCity] = useState('');
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);

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
    if (password.length < 6) { setError('パスワードは6文字以上で入力してください'); return; }
    setLoading(true);
    try {
      await signUp({
        email, password, nickname,
        age: age ? parseInt(age) : undefined,
        gender, prefecture, city,
        taste_badges: selectedBadges,
      });
      onSuccess();
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
            <div>
              <label className="block text-sm font-semibold mb-1">ニックネーム <span className="text-orange-500">*</span></label>
              <input
                type="text" value={nickname} onChange={e => setNickname(e.target.value)}
                placeholder="例: 調味料マスター"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                required
              />
            </div>
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
                  <label className="block text-sm font-semibold mb-1">年齢</label>
                  <input type="number" value={age} onChange={e => setAge(e.target.value)}
                    placeholder="25" min="1" max="120"
                    className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-orange-400"
                  />
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
            </>
          )}

          <button
            type="submit" disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'login' ? 'ログイン' : '登録する'}
          </button>
        </form>
      </div>
    </div>
  );
}
