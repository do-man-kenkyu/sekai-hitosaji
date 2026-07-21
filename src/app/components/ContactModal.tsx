import { useState } from 'react';
import { X, Mail, Loader2, CheckCircle2 } from 'lucide-react';
import { insertInquiry } from '../../lib/inquiries';
import { sendInquiryNotification } from '../../lib/emailNotify';
import { User } from '../types';
import { Language, t } from '../i18n/translations';

interface Props {
  onClose: () => void;
  language: Language;
  currentUser: User | null;
}

export function ContactModal({ onClose, language, currentUser }: Props) {
  const [name, setName] = useState(currentUser?.nickname ?? '');
  const [email, setEmail] = useState(currentUser?.email ?? '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim(),
        message: message.trim(),
      };
      await insertInquiry({ ...payload, userId: currentUser?.id });
      setSent(true);
      // 通知メール送信は失敗してもお問い合わせ自体は保存済みなので致命的エラーにしない
      sendInquiryNotification(payload).catch(err => console.error('通知メール送信失敗:', err));
    } catch (err: any) {
      setError(err?.message || t(language, 'contactFailed'));
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
        <div className="flex items-center justify-between p-6 border-b border-[#e2d5c0]">
          <h2 className="text-xl font-bold text-[#3d1f00] flex items-center gap-2">
            <Mail size={20} className="text-[#c17f3a]" />
            {t(language, 'contactTitle')}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>

        {sent ? (
          <div className="p-8 flex flex-col items-center text-center gap-3">
            <CheckCircle2 size={40} className="text-green-500" />
            <p className="text-[#3d1f00] font-semibold">{t(language, 'contactSuccess')}</p>
            <button
              onClick={onClose}
              className="mt-2 px-6 py-2.5 bg-[#7c4a1e] text-white rounded-lg hover:bg-[#3d1f00] transition-colors text-sm font-medium"
            >
              {t(language, 'close')}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg p-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold mb-1 text-[#3d1f00]">
                {t(language, 'yourName')} <span className="text-orange-500">*</span>
              </label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)}
                className="w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c17f3a]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-[#3d1f00]">
                {t(language, 'yourEmail')} <span className="text-orange-500">*</span>
              </label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c17f3a]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-[#3d1f00]">
                {t(language, 'contactSubject')} <span className="text-orange-500">*</span>
              </label>
              <input
                type="text" value={subject} onChange={e => setSubject(e.target.value)}
                className="w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c17f3a]"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-1 text-[#3d1f00]">
                {t(language, 'contactMessage')} <span className="text-orange-500">*</span>
              </label>
              <textarea
                value={message} onChange={e => setMessage(e.target.value)}
                rows={5} maxLength={2000}
                className="w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#c17f3a] resize-none"
                required
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full bg-[#7c4a1e] hover:bg-[#3d1f00] disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {t(language, 'send')}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
