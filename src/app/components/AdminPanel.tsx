import { X, Users, User as UserIcon } from 'lucide-react';
import { User } from '../types';
import { Language, t } from '../i18n/translations';

interface AdminPanelProps {
  users: User[];
  onClose: () => void;
  language: Language;
}

export function AdminPanel({ users, onClose, language }: AdminPanelProps) {
  const genderCounts = users.reduce((acc, user) => {
    acc[user.gender] = (acc[user.gender] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const avgAge = users.length > 0
    ? (users.reduce((sum, user) => sum + user.age, 0) / users.length).toFixed(1)
    : 0;

  const badgeCounts = users.reduce((acc, user) => {
    user.tasteBadges.forEach(badge => {
      acc[badge] = (acc[badge] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topBadges = Object.entries(badgeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <Users size={24} className="text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold">{t(language, 'adminPanelTitle')}</h2>
              <p className="text-sm text-gray-500">{t(language, 'statistics')}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-1">{t(language, 'totalUsers')}</h3>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-1">{t(language, 'age')}</h3>
              <p className="text-3xl font-bold text-green-600">{avgAge}{language === 'ja' ? '歳' : ' yrs'}</p>
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
                  <div className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full mb-1">
                    {badge}
                  </div>
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
                    <td className="px-4 py-3 text-sm">{user.age}{language === 'ja' ? '歳' : ''}</td>
                    <td className="px-4 py-3 text-sm">{user.gender}</td>
                    <td className="px-4 py-3 text-sm">{user.prefecture}</td>
                    <td className="px-4 py-3 text-sm">{user.city}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {user.tasteBadges.map((badge, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full"
                          >
                            {badge}
                          </span>
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
        </div>
      </div>
    </div>
  );
}
