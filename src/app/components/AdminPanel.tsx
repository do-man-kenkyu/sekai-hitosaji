import { useState, useEffect } from 'react';
import { X, Users, User as UserIcon, BarChart3, Search, Package, Mail } from 'lucide-react';
import { User, Condiment } from '../types';
import { Language, t } from '../i18n/translations';
import { getMonthlySearchStats } from '../searchLog';
import { fetchInquiries, Inquiry } from '../../lib/inquiries';

interface AdminPanelProps {
  users: User[];
  condiments: Condiment[];
  onClose: () => void;
  language: Language;
}

type Tab = 'stats' | 'condiments' | 'search' | 'inquiries';

export function AdminPanel({ users, condiments, onClose, language }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('stats');
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  useEffect(() => {
    if (tab !== 'inquiries') return;
    setInquiriesLoading(true);
    fetchInquiries()
      .then(setInquiries)
      .catch(err => console.error('お問い合わせの取得に失敗:', err))
      .finally(() => setInquiriesLoading(false));
  }, [tab]);

  const genderCounts = users.reduce((acc, user) => {
    acc[user.gender] = (acc[user.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // 生年月日が登録されているユーザーのみで平均年齢を算出する
  const usersWithAge = users.filter(u => u.birthdate);
  const avgAge = usersWithAge.length > 0
    ? (usersWithAge.reduce((sum, user) => sum + user.age, 0) / usersWithAge.length).toFixed(1)
    : '—';

  const badgeCounts = users.reduce((acc, user) => {
    user.tasteBadges.forEach(badge => {
      acc[badge] = (acc[badge] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topBadges = Object.entries(badgeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // ユーザー情報を素早く引くためのマップ（nickname/idで照合）
  const userByNickname = new Map(users.map(u => [u.nickname, u]));
  const searchStats = getMonthlySearchStats();

  const tabs: { key: Tab; label: string; icon: JSX.Element }[] = [
    { key: 'stats', label: language === 'ja' ? '統計' : 'Stats', icon: <BarChart3 size={15} /> },
    { key: 'condiments', label: language === 'ja' ? '調味料別投稿者' : 'By Condiment', icon: <Package size={15} /> },
    { key: 'search', label: language === 'ja' ? '月別検索' : 'Searches', icon: <Search size={15} /> },
    { key: 'inquiries', label: t(language, 'inquiries'), icon: <Mail size={15} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-[#7c4a1e]" />
            <div>
              <h2 className="text-xl font-semibold">{t(language, 'adminPanelTitle')}</h2>
              <p className="text-sm text-gray-500">{language === 'ja' ? '管理者専用' : 'Admins only'}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Tabs */}
        <div className="sticky top-[73px] bg-white border-b px-6 flex gap-1 z-10">
          {tabs.map(tabItem => (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                tab === tabItem.key
                  ? 'border-[#7c4a1e] text-[#7c4a1e]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              {tabItem.icon}
              {tabItem.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {/* ── 統計タブ ── */}
          {tab === 'stats' && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">{t(language, 'totalUsers')}</h3>
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-green-900 mb-1">{t(language, 'age')}</h3>
                  <p className="text-3xl font-bold text-green-600">{avgAge}{avgAge !== '—' && (language === 'ja' ? '歳' : ' yrs')}</p>
                </div>
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-purple-900 mb-2">{t(language, 'gender')}</h3>
                  <div className="space-y-1 text-sm">
                    {Object.entries(genderCounts).map(([gender, count]) => (
                      <div key={gender} className="flex justify-between">
                        <span>{gender}:</span>
                        <span className="font-medium">{count}{language === 'ja' ? '人' : ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h3 className="font-medium text-yellow-900 mb-3">{t(language, 'tasteBadges')} TOP 5</h3>
                <div className="grid grid-cols-5 gap-2">
                  {topBadges.map(([badge, count]) => (
                    <div key={badge} className="text-center">
                      <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full mb-1">{badge}</div>
                      <p className="text-xs text-gray-600">{count}{language === 'ja' ? '人' : ''}</p>
                    </div>
                  ))}
                </div>
              </div>

              <h3 className="font-medium mb-4 flex items-center gap-2">
                <UserIcon size={20} />
                {t(language, 'userList')} ({users.length}{language === 'ja' ? '人' : ''})
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t(language, 'nickname')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{language === 'ja' ? '氏名' : 'Full Name'}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t(language, 'age')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t(language, 'gender')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t(language, 'prefecture')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t(language, 'city')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t(language, 'tasteBadges')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium">{user.nickname}</td>
                        <td className="px-4 py-3 text-sm">{user.fullName || <span className="text-gray-300">未登録</span>}</td>
                        <td className="px-4 py-3 text-sm">{user.birthdate ? `${user.age}${language === 'ja' ? '歳' : ''}` : <span className="text-gray-300">未登録</span>}</td>
                        <td className="px-4 py-3 text-sm">{user.gender}</td>
                        <td className="px-4 py-3 text-sm">{user.prefecture}</td>
                        <td className="px-4 py-3 text-sm">{user.city}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap gap-1">
                            {user.tasteBadges.map((badge, index) => (
                              <span key={index} className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">{badge}</span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {users.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {language === 'ja' ? '登録ユーザーがいません' : 'No registered users'}
                </div>
              )}
            </>
          )}

          {/* ── 調味料別投稿者タブ ── */}
          {tab === 'condiments' && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {language === 'ja'
                  ? '各調味料の投稿者と、その投稿者のユーザー情報を確認できます（管理者のみ）。'
                  : 'View each condiment and its poster\'s user info (admins only).'}
              </p>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b">
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{language === 'ja' ? '調味料' : 'Condiment'}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{language === 'ja' ? 'カテゴリ' : 'Category'}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{t(language, 'nickname')}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{language === 'ja' ? '年齢/性別' : 'Age/Gender'}</th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">{language === 'ja' ? '地域' : 'Location'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {condiments.map(c => {
                      const poster = userByNickname.get(c.postedBy.nickname);
                      return (
                        <tr key={c.id} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium flex items-center gap-2">
                            {c.imageUrl && <img src={c.imageUrl} alt={c.name} className="w-8 h-8 object-contain bg-white rounded border" />}
                            {c.name}
                          </td>
                          <td className="px-4 py-3 text-sm">{c.category}</td>
                          <td className="px-4 py-3 text-sm">{c.postedBy.nickname}</td>
                          <td className="px-4 py-3 text-sm">
                            {poster ? `${poster.birthdate ? `${poster.age}${language === 'ja' ? '歳' : ''}` : '未登録'} / ${poster.gender}` : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            {poster ? `${poster.prefecture} ${poster.city}` : <span className="text-gray-300">—</span>}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {condiments.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  {language === 'ja' ? '調味料がありません' : 'No condiments'}
                </div>
              )}
            </>
          )}

          {/* ── 月別検索タブ ── */}
          {tab === 'search' && (
            <>
              <p className="text-sm text-gray-500 mb-4">
                {language === 'ja'
                  ? 'ユーザーが月ごとに何を検索しているか、上位から表示します。'
                  : 'Top search terms by month.'}
              </p>
              {searchStats.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'ja' ? 'まだ検索データがありません' : 'No search data yet'}
                </div>
              ) : (
                <div className="space-y-6">
                  {searchStats.map(({ month, terms }) => (
                    <div key={month}>
                      <h3 className="font-bold text-[#3d1f00] mb-2 flex items-center gap-2">
                        <Search size={16} className="text-[#c17f3a]" />
                        {month}
                        <span className="text-xs font-normal text-gray-400">
                          （{language === 'ja' ? `${terms.length}種類` : `${terms.length} terms`}）
                        </span>
                      </h3>
                      <div className="space-y-1">
                        {terms.slice(0, 20).map((termItem, i) => (
                          <div key={termItem.term} className="flex items-center gap-3">
                            <span className="w-6 text-right text-sm font-bold text-[#a07850]">{i + 1}</span>
                            <span className="flex-1 text-sm text-gray-800">{termItem.term}</span>
                            <div className="flex items-center gap-2 w-40">
                              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-[#c17f3a]"
                                  style={{ width: `${(termItem.count / terms[0].count) * 100}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-500 w-8 text-right">{termItem.count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── お問い合わせタブ ── */}
          {tab === 'inquiries' && (
            <>
              {inquiriesLoading ? (
                <div className="text-center py-12 text-gray-500">
                  {language === 'ja' ? '読み込み中...' : 'Loading...'}
                </div>
              ) : inquiries.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {t(language, 'noInquiries')}
                </div>
              ) : (
                <div className="space-y-3">
                  {inquiries.map(inquiry => (
                    <div key={inquiry.id} className="border border-[#e2d5c0] rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-semibold text-[#3d1f00]">{inquiry.subject}</h4>
                        <span className="text-xs text-gray-400">
                          {new Date(inquiry.createdAt).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap mb-2">{inquiry.message}</p>
                      <p className="text-xs text-gray-500">{inquiry.name} &lt;{inquiry.email}&gt;</p>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
