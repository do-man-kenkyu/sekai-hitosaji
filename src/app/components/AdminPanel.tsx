import { useState, useEffect, useRef } from 'react';
import { X, Users, User as UserIcon, BarChart3, Search, Package, Mail, Newspaper, Pencil, Trash2, Loader2, FileText, Image as ImageIcon, Download, ChevronDown, MapPin } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { User, Condiment } from '../types';
import { Language, t } from '../i18n/translations';
import { getMonthlySearchStats } from '../searchLog';
import { fetchInquiries, Inquiry } from '../../lib/inquiries';
import { fetchAllUsers, fetchCondiments, fetchAllLikeCounts } from '../../lib/database';
import { downloadCsv, timestampedFileName, formatDateTime } from '../utils/csv';
import {
  fetchTrendArticles, insertTrendArticle, updateTrendArticle, deleteTrendArticle,
  isTableMissing, isColumnMissing, isBodyRequiredInDb, TrendArticle, TrendArticleInput,
} from '../../lib/trendArticles';
import { uploadArticlePdf, uploadArticleImage } from '../../lib/storage';

const EMPTY_ARTICLE: TrendArticleInput = {
  title: '', body: '', imageUrl: '', linkUrl: '', linkLabel: '', pdfUrl: '', published: true,
};

interface AdminPanelProps {
  users: User[];
  condiments: Condiment[];
  onClose: () => void;
  language: Language;
}

type Tab = 'stats' | 'condiments' | 'search' | 'inquiries' | 'articles';

export function AdminPanel({ users, condiments, onClose, language }: AdminPanelProps) {
  const [tab, setTab] = useState<Tab>('stats');
  const [showUserList, setShowUserList] = useState(false);
  // グラフ下の詳細表の開閉と、グラフで選んだ区分
  const [ageDetailOpen, setAgeDetailOpen] = useState(false);
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string | null>(null);
  const [prefDetailOpen, setPrefDetailOpen] = useState(false);
  const [selectedPrefecture, setSelectedPrefecture] = useState<string | null>(null);
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [inquiriesLoading, setInquiriesLoading] = useState(false);

  // 運営からのお知らせ記事
  const [articles, setArticles] = useState<TrendArticle[]>([]);
  const [articlesLoading, setArticlesLoading] = useState(false);
  const [articleForm, setArticleForm] = useState<TrendArticleInput>(EMPTY_ARTICLE);
  const [editingArticleId, setEditingArticleId] = useState<string | null>(null);
  const [articleSaving, setArticleSaving] = useState(false);
  const [articleError, setArticleError] = useState('');
  const [pdfUploading, setPdfUploading] = useState(false);
  const [imageUploading, setImageUploading] = useState(false);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 同じファイルを選び直せるよう、input の値は毎回空に戻す
    e.target.value = '';
    if (!file) return;
    setImageUploading(true);
    setArticleError('');
    try {
      const url = await uploadArticleImage(file);
      setArticleForm(prev => ({ ...prev, imageUrl: url }));
    } catch (err: any) {
      console.error('画像のアップロードに失敗:', err);
      setArticleError(err?.message ?? '画像のアップロードに失敗しました');
    } finally {
      setImageUploading(false);
    }
  };

  const handlePdfSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // 同じファイルを選び直せるよう、input の値は毎回空に戻す
    e.target.value = '';
    if (!file) return;
    setPdfUploading(true);
    setArticleError('');
    try {
      const url = await uploadArticlePdf(file);
      setArticleForm(prev => ({ ...prev, pdfUrl: url }));
    } catch (err: any) {
      console.error('PDFのアップロードに失敗:', err);
      setArticleError(err?.message ?? 'PDFのアップロードに失敗しました');
    } finally {
      setPdfUploading(false);
    }
  };

  useEffect(() => {
    if (tab !== 'articles') return;
    setArticlesLoading(true);
    setArticleError('');
    fetchTrendArticles()
      .then(setArticles)
      .catch(err => {
        console.error('お知らせの取得に失敗:', err);
        setArticleError(isTableMissing(err) ? t(language, 'articleTableMissing') : String(err.message ?? err));
      })
      .finally(() => setArticlesLoading(false));
  }, [tab, language]);

  const resetArticleForm = () => {
    setArticleForm(EMPTY_ARTICLE);
    setEditingArticleId(null);
    setArticleError('');
  };

  const handleArticleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    // 必須はタイトルのみ。本文・画像・リンク・PDFはすべて任意。
    if (!articleForm.title.trim()) return;
    setArticleSaving(true);
    setArticleError('');
    try {
      if (editingArticleId) {
        const updated = await updateTrendArticle(editingArticleId, articleForm);
        setArticles(prev => prev.map(a => (a.id === updated.id ? updated : a)));
      } else {
        const created = await insertTrendArticle(articleForm);
        setArticles(prev => [created, ...prev]);
      }
      resetArticleForm();
    } catch (err: any) {
      console.error('お知らせの保存に失敗:', err);
      setArticleError(
        isTableMissing(err) ? t(language, 'articleTableMissing')
          : isColumnMissing(err) ? t(language, 'articlePdfColumnMissing')
          : isBodyRequiredInDb(err) ? t(language, 'articleBodyNotNullSql')
          : t(language, 'articleSaveFailed')
      );
    } finally {
      setArticleSaving(false);
    }
  };

  // 編集ボタンを押したとき、入力欄は一覧より上にあって画面外のことが多い。
  // そのままだと「押しても何も起きない」ように見えるので、入力欄まで送る。
  const articleFormRef = useRef<HTMLFormElement>(null);

  const handleArticleEdit = (article: TrendArticle) => {
    articleFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setEditingArticleId(article.id);
    setArticleForm({
      title: article.title,
      body: article.body,
      imageUrl: article.imageUrl ?? '',
      linkUrl: article.linkUrl ?? '',
      linkLabel: article.linkLabel ?? '',
      pdfUrl: article.pdfUrl ?? '',
      published: article.published,
    });
  };

  // ===== CSVダウンロード =====
  // どのボタンも、押した時点で Supabase から取り直す。画面を開いたままでも
  // そのあとに増えた投稿・登録が必ず含まれるようにするため。
  const [downloading, setDownloading] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState('');

  const runDownload = async (key: string, build: () => Promise<{ name: string; rows: (string | number | null)[][] }>) => {
    setDownloading(key);
    setDownloadError('');
    try {
      const { name, rows } = await build();
      downloadCsv(timestampedFileName(name), rows);
    } catch (err) {
      console.error('ダウンロードに失敗:', err);
      setDownloadError(t(language, 'downloadFailed'));
    } finally {
      setDownloading(null);
    }
  };

  const downloadUsers = () => runDownload('users', async () => {
    const latest = await fetchAllUsers();
    const rows: (string | number | null)[][] = [
      ['ニックネーム', '氏名', '生年月日', '年齢', '性別', '都道府県', '市区町村', '味覚バッジ', 'ユーザーID'],
      ...latest.map(u => [
        u.nickname, u.fullName ?? '', u.birthdate ?? '', u.age || '',
        u.gender, u.prefecture, u.city, u.tasteBadges.join('・'), u.id,
      ]),
    ];
    return { name: 'ユーザー一覧', rows };
  });

  const downloadCondiments = () => runDownload('condiments', async () => {
    const [latest, likeCounts] = await Promise.all([fetchCondiments(), fetchAllLikeCounts()]);
    const rows: (string | number | null)[][] = [
      ['投稿日時', '調味料名', 'カテゴリ', '産地', 'リピート評価', 'いいね数', '購入場所',
        '甘味', '酸味', '苦味', '旨味', '塩味', '濃厚さ', '香り',
        'おすすめ料理', '投稿者', '投稿者ID', '説明'],
      ...latest.map(c => [
        formatDateTime(c.createdAt), c.name, c.category, c.origin,
        c.repeatRating, likeCounts[c.id] ?? 0, c.purchaseLocation,
        c.tasteProfile.sweetness, c.tasteProfile.sourness, c.tasteProfile.bitterness,
        c.tasteProfile.umami, c.tasteProfile.saltiness, c.tasteProfile.richness, c.tasteProfile.aroma,
        c.recommendedDishes.join('・'), c.postedBy.nickname, c.postedBy.userId, c.description,
      ]),
    ];
    return { name: '投稿一覧', rows };
  });

  const downloadInquiries = () => runDownload('inquiries', async () => {
    const latest = await fetchInquiries();
    const rows: (string | number | null)[][] = [
      ['受信日時', '件名', 'お名前', 'メールアドレス', '本文', 'ユーザーID'],
      ...latest.map(i => [
        formatDateTime(i.createdAt), i.subject, i.name, i.email, i.message, i.userId ?? '',
      ]),
    ];
    return { name: 'お問い合わせ', rows };
  });

  const downloadSearches = () => runDownload('search', async () => {
    const rows: (string | number | null)[][] = [['月', '検索キーワード', '回数']];
    getMonthlySearchStats().forEach(month => {
      month.terms.forEach(term => rows.push([month.month, term.term, term.count]));
    });
    return { name: '検索キーワード', rows };
  });

  // 各タブの見出し横に置くダウンロードボタン
  const DownloadButton = ({ onClick, busyKey }: { onClick: () => void; busyKey: string }) => (
    <button
      onClick={onClick}
      disabled={downloading !== null}
      title={t(language, 'downloadHint')}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[#c17f3a] text-[#7c4a1e] hover:bg-[#fdf5ea] flex-shrink-0"
    >
      {downloading === busyKey
        ? <><Loader2 size={13} className="animate-spin" />{t(language, 'downloadPreparing')}</>
        : <><Download size={13} />{t(language, 'downloadCsv')}</>}
    </button>
  );

  const handleArticleDelete = async (id: string) => {
    if (!window.confirm(t(language, 'articleDeleteConfirm'))) return;
    try {
      await deleteTrendArticle(id);
      setArticles(prev => prev.filter(a => a.id !== id));
      if (editingArticleId === id) resetArticleForm();
    } catch (err) {
      console.error('お知らせの削除に失敗:', err);
    }
  };

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

  // 年代別の人数。平均だけでは偏りが分からないため分布で見せる。
  // 生年月日が無いユーザー（法人アカウント等）は「未登録」にまとめる。
  const unsetLabel = language === 'ja' ? '未登録' : 'Not set';
  const ageGroups = [
    { label: language === 'ja' ? '〜19歳' : '-19', min: 0, max: 19 },
    { label: language === 'ja' ? '20代' : '20s', min: 20, max: 29 },
    { label: language === 'ja' ? '30代' : '30s', min: 30, max: 39 },
    { label: language === 'ja' ? '40代' : '40s', min: 40, max: 49 },
    { label: language === 'ja' ? '50代' : '50s', min: 50, max: 59 },
    { label: language === 'ja' ? '60歳〜' : '60+', min: 60, max: Infinity },
  ];
  const ageData = [
    ...ageGroups.map(g => {
      const members = users.filter(u => u.birthdate && u.age >= g.min && u.age <= g.max);
      return { label: g.label, count: members.length, unset: false, members };
    }),
    (() => {
      const members = users.filter(u => !u.birthdate);
      return { label: unsetLabel, count: members.length, unset: true, members };
    })(),
  ];

  // 都道府県別の人数（多い順）
  const prefectureGroups = Object.entries(
    users.reduce((acc, user) => {
      const key = user.prefecture || unsetLabel;
      if (!acc[key]) acc[key] = [];
      acc[key].push(user);
      return acc;
    }, {} as Record<string, User[]>)
  ).sort(([, a], [, b]) => b.length - a.length);
  const maxPrefectureCount = prefectureGroups.length > 0 ? prefectureGroups[0][1].length : 0;

  const percentOf = (count: number) =>
    users.length > 0 ? `${Math.round((count / users.length) * 1000) / 10}%` : '—';
  const personUnit = language === 'ja' ? '人' : '';

  // 市区町村ごとの人数（例: 神戸市 3人、姫路市 1人）
  const cityBreakdown = (members: User[]) =>
    Object.entries(
      members.reduce((acc, u) => {
        const key = u.city || unsetLabel;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .sort(([, a], [, b]) => b - a)
      .map(([city, n]) => `${city} ${n}${personUnit}`)
      .join(language === 'ja' ? '、' : ', ');

  // グラフの下に開く詳細表。選んだ区分があればその区分だけを出す。
  const renderDetail = (
    rows: { key: string; members: User[]; unset: boolean }[],
    selected: string | null,
    onClearSelection: () => void,
    showCities: boolean,
  ) => {
    const visible = selected ? rows.filter(r => r.key === selected) : rows.filter(r => r.members.length > 0);
    return (
      <div className="mt-3 border-t border-[#e2d5c0] pt-3">
        {selected && (
          <div className="flex items-center justify-between mb-2 text-sm">
            <span className="text-[#7c4a1e]">
              {language === 'ja' ? `「${selected}」の詳細` : `Details: ${selected}`}
            </span>
            <button type="button" onClick={onClearSelection} className="text-[#c17f3a] underline underline-offset-2">
              {language === 'ja' ? 'すべて表示' : 'Show all'}
            </button>
          </div>
        )}
        {visible.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">
            {language === 'ja' ? '該当するユーザーはいません' : 'No users'}
          </p>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
            {visible.map(row => (
              <div key={row.key} className="text-sm">
                <div className="flex items-baseline justify-between gap-2 mb-1">
                  <span className={`font-medium ${row.unset ? 'text-gray-500' : 'text-[#3d1f00]'}`}>{row.key}</span>
                  <span className="text-[#5c3d20]">
                    <span className="font-bold">{row.members.length}{personUnit}</span>
                    <span className="text-[#a07850] ml-1.5">({percentOf(row.members.length)})</span>
                  </span>
                </div>
                {showCities && row.members.length > 0 && (
                  <p className="text-xs text-[#a07850] mb-1">{cityBreakdown(row.members)}</p>
                )}
                <div className="flex flex-wrap gap-1">
                  {row.members.map(u => (
                    <span key={u.id} className="px-2 py-0.5 bg-[#fdf5ea] border border-[#e2d5c0] text-[#5c3d20] text-xs rounded-full">
                      {u.nickname}
                      <span className="text-[#a07850] ml-1">
                        {showCities
                          ? (u.birthdate ? `${u.age}${language === 'ja' ? '歳' : ''}` : '')
                          : (u.prefecture || '')}
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // 「詳しく見る」ボタン（グラフの下に置く）
  const renderDetailToggle = (open: boolean, onToggle: () => void) => (
    <button
      type="button"
      onClick={onToggle}
      className="mt-3 w-full flex items-center justify-center gap-1 py-2 text-sm text-[#7c4a1e] border border-[#e2d5c0] rounded-lg hover:bg-[#fdf5ea] hover:border-[#c17f3a] transition-colors"
    >
      {open ? (language === 'ja' ? '詳細を閉じる' : 'Hide details') : (language === 'ja' ? '詳しく見る' : 'View details')}
      <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
  );

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
    { key: 'articles', label: t(language, 'trendArticles'), icon: <Newspaper size={15} /> },
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
          {downloadError && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
              {downloadError}
            </p>
          )}

          {tab === 'stats' && (
            <>
              <div className="flex items-center justify-between gap-2 mb-3">
                <p className="text-sm text-gray-500">
                  {language === 'ja' ? 'ユーザー情報を一覧で保存できます。' : 'Save the user list.'}
                </p>
                <DownloadButton onClick={downloadUsers} busyKey="users" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-blue-900 mb-1">{t(language, 'totalUsers')}</h3>
                  <p className="text-3xl font-bold text-blue-600">{users.length}</p>
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

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 items-start">
                {/* 年代別の人数 */}
                <div className="bg-white border border-[#e2d5c0] rounded-lg p-4">
                  <h3 className="font-medium text-[#3d1f00] mb-3">
                    {language === 'ja' ? '年代別のユーザー数' : 'Users by age group'}
                  </h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={ageData} margin={{ top: 20, right: 8, left: -20, bottom: 0 }}>
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#5c3d20' }} tickLine={false} axisLine={{ stroke: '#e2d5c0' }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#a07850' }} tickLine={false} axisLine={false} />
                        <Tooltip
                          cursor={{ fill: '#fdf5ea' }}
                          formatter={(value: number) => [`${value}${language === 'ja' ? '人' : ''}`, language === 'ja' ? '人数' : 'Users']}
                        />
                        <Bar
                          dataKey="count"
                          radius={[4, 4, 0, 0]}
                          cursor="pointer"
                          onClick={(entry: any) => {
                            // 棒を押すと、その年代の詳細を下に開く
                            const label = entry?.label ?? entry?.payload?.label;
                            if (!label) return;
                            setSelectedAgeGroup(label);
                            setAgeDetailOpen(true);
                          }}
                        >
                          {ageData.map(d => (
                            <Cell
                              key={d.label}
                              fill={d.unset ? '#d6cbb8' : '#7c4a1e'}
                              fillOpacity={selectedAgeGroup && ageDetailOpen && selectedAgeGroup !== d.label ? 0.35 : 1}
                            />
                          ))}
                          <LabelList dataKey="count" position="top" style={{ fontSize: 12, fill: '#3d1f00' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {renderDetailToggle(ageDetailOpen, () => {
                    setAgeDetailOpen(v => !v);
                    setSelectedAgeGroup(null);
                  })}
                  {ageDetailOpen && renderDetail(
                    ageData.map(d => ({ key: d.label, members: d.members, unset: d.unset })),
                    selectedAgeGroup,
                    () => setSelectedAgeGroup(null),
                    false,
                  )}
                </div>

                {/* 都道府県別の人数 */}
                <div className="bg-white border border-[#e2d5c0] rounded-lg p-4">
                  <h3 className="font-medium text-[#3d1f00] mb-3 flex items-center gap-1.5">
                    <MapPin size={16} className="text-[#c17f3a]" />
                    {language === 'ja' ? '地域別のユーザー数' : 'Users by prefecture'}
                  </h3>
                  {prefectureGroups.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">
                      {language === 'ja' ? '登録ユーザーがいません' : 'No registered users'}
                    </p>
                  ) : (
                    <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
                      {prefectureGroups.map(([prefecture, members]) => {
                        const dimmed = prefDetailOpen && selectedPrefecture !== null && selectedPrefecture !== prefecture;
                        return (
                          // 行を押すと、その都道府県の詳細を下に開く
                          <button
                            key={prefecture}
                            type="button"
                            onClick={() => { setSelectedPrefecture(prefecture); setPrefDetailOpen(true); }}
                            className={`w-full flex items-center gap-2 text-sm rounded px-1 py-0.5 hover:bg-[#fdf5ea] transition-opacity ${dimmed ? 'opacity-40' : ''}`}
                          >
                            <span className="w-20 flex-shrink-0 text-left text-[#5c3d20] truncate">{prefecture}</span>
                            <div className="flex-1 h-4 bg-[#fdf5ea] rounded">
                              <div
                                className={`h-4 rounded ${prefecture === unsetLabel ? 'bg-[#d6cbb8]' : 'bg-[#c17f3a]'}`}
                                style={{ width: `${(members.length / maxPrefectureCount) * 100}%` }}
                              />
                            </div>
                            <span className="w-10 text-right font-medium text-[#3d1f00]">
                              {members.length}{personUnit}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {prefectureGroups.length > 0 && renderDetailToggle(prefDetailOpen, () => {
                    setPrefDetailOpen(v => !v);
                    setSelectedPrefecture(null);
                  })}
                  {prefDetailOpen && renderDetail(
                    prefectureGroups.map(([prefecture, members]) => ({ key: prefecture, members, unset: prefecture === unsetLabel })),
                    selectedPrefecture,
                    () => setSelectedPrefecture(null),
                    true,
                  )}
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

              {/* ユーザー一覧は長くなるので、押したときだけ開く */}
              <button
                type="button"
                onClick={() => setShowUserList(v => !v)}
                className="w-full flex items-center justify-between gap-2 px-4 py-3 mb-4 bg-[#fdf5ea] border border-[#e2d5c0] rounded-lg text-[#3d1f00] hover:border-[#c17f3a] transition-colors"
              >
                <span className="font-medium flex items-center gap-2">
                  <UserIcon size={20} />
                  {t(language, 'userList')} ({users.length}{language === 'ja' ? '人' : ''})
                </span>
                <span className="flex items-center gap-1 text-sm text-[#7c4a1e]">
                  {showUserList
                    ? (language === 'ja' ? '閉じる' : 'Hide')
                    : (language === 'ja' ? '開いて見る' : 'Show')}
                  <ChevronDown size={18} className={`transition-transform ${showUserList ? 'rotate-180' : ''}`} />
                </span>
              </button>
              {showUserList && (<>
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
              </>)}
            </>
          )}

          {/* ── 調味料別投稿者タブ ── */}
          {tab === 'condiments' && (
            <>
              <div className="flex justify-end mb-3">
                <DownloadButton onClick={downloadCondiments} busyKey="condiments" />
              </div>
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
              <div className="flex justify-end mb-3">
                <DownloadButton onClick={downloadSearches} busyKey="search" />
              </div>
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
              <div className="flex justify-end mb-3">
                <DownloadButton onClick={downloadInquiries} busyKey="inquiries" />
              </div>
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

          {tab === 'articles' && (
            <>
              <h3 className="font-semibold text-[#3d1f00] mb-3 flex items-center gap-2">
                <Newspaper size={16} className="text-[#c17f3a]" />
                {t(language, 'trendArticles')}
              </h3>

              {articleError && (
                <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">
                  {articleError}
                </p>
              )}

              {/* 投稿・編集フォーム */}
              <form
                ref={articleFormRef}
                onSubmit={handleArticleSave}
                className={`rounded-lg p-4 mb-5 space-y-3 ${
                  editingArticleId
                    ? 'border-2 border-[#c17f3a] bg-[#fdf5ea]'
                    : 'border border-[#e2d5c0] bg-[#fdf5ea]'
                }`}
              >
                <p className="text-sm font-semibold text-[#3d1f00]">
                  {editingArticleId
                    ? `${t(language, 'articleEdit')}：${articleForm.title || ''}`
                    : t(language, 'articleNew')}
                </p>
                {/* タイトル（必須） */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-[#5c3d20] mb-1">
                    {t(language, 'articleTitle')}
                    <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded">
                      {t(language, 'fieldRequired')}
                    </span>
                  </label>
                  <input
                    value={articleForm.title}
                    onChange={e => setArticleForm({ ...articleForm, title: e.target.value })}
                    maxLength={120}
                    required
                    className="w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#c17f3a]"
                  />
                </div>

                {/* 本文（任意） */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-[#5c3d20] mb-1">
                    {t(language, 'articleBody')}
                    <span className="text-[10px] bg-[#f5ede0] text-[#a07850] px-1.5 py-0.5 rounded">
                      {t(language, 'fieldOptional')}
                    </span>
                  </label>
                  <textarea
                    value={articleForm.body}
                    onChange={e => setArticleForm({ ...articleForm, body: e.target.value })}
                    maxLength={5000}
                    rows={5}
                    className="w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#c17f3a] resize-y"
                  />
                </div>

                {/* 画像（任意・ファイルを選んでアップロード） */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-[#5c3d20] mb-1">
                    {t(language, 'articleImage')}
                    <span className="text-[10px] bg-[#f5ede0] text-[#a07850] px-1.5 py-0.5 rounded">
                      {t(language, 'fieldOptional')}
                    </span>
                  </label>
                  {articleForm.imageUrl ? (
                    <div className="flex items-center gap-3 bg-white border border-[#e2d5c0] rounded-lg p-2">
                      <img
                        src={articleForm.imageUrl}
                        alt={t(language, 'articleImageAttached')}
                        className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                      />
                      <span className="flex-1 text-sm text-[#5c3d20] truncate">
                        {t(language, 'articleImageAttached')}
                      </span>
                      <button
                        type="button"
                        onClick={() => setArticleForm({ ...articleForm, imageUrl: '' })}
                        className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        {t(language, 'articlePdfRemove')}
                      </button>
                    </div>
                  ) : (
                    <label className="inline-flex items-center gap-2 text-sm text-[#5c3d20] cursor-pointer">
                      <span className="px-3 py-1.5 bg-white border border-[#e2d5c0] rounded-lg hover:border-[#c17f3a] flex items-center gap-1.5">
                        {imageUploading
                          ? <><Loader2 size={14} className="animate-spin" />{t(language, 'articlePdfUploading')}</>
                          : <><ImageIcon size={14} className="text-[#c17f3a]" />{t(language, 'articleImage')}</>}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        disabled={imageUploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                {/* リンクURL（任意） */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs text-[#5c3d20] mb-1">
                    {t(language, 'articleLinkUrl')}
                    <span className="text-[10px] bg-[#f5ede0] text-[#a07850] px-1.5 py-0.5 rounded">
                      {t(language, 'fieldOptional')}
                    </span>
                  </label>
                  <input
                    value={articleForm.linkUrl ?? ''}
                    onChange={e => setArticleForm({ ...articleForm, linkUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#c17f3a]"
                  />
                  {/* リンクを入れたときだけ、その説明を書く欄を出す */}
                  {articleForm.linkUrl?.trim() && (
                    <input
                      value={articleForm.linkLabel ?? ''}
                      onChange={e => setArticleForm({ ...articleForm, linkLabel: e.target.value })}
                      placeholder={t(language, 'articleLinkLabel')}
                      maxLength={120}
                      className="mt-2 w-full border border-[#e2d5c0] rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-[#c17f3a]"
                    />
                  )}
                </div>
                {/* PDF添付 */}
                <div>
                  {articleForm.pdfUrl ? (
                    <div className="flex items-center gap-2 text-sm text-[#5c3d20] bg-white border border-[#e2d5c0] rounded-lg px-3 py-2">
                      <FileText size={15} className="text-[#c17f3a] flex-shrink-0" />
                      <a
                        href={articleForm.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 truncate text-[#7c4a1e] hover:underline"
                      >
                        {t(language, 'articlePdfAttached')}
                      </a>
                      <button
                        type="button"
                        onClick={() => setArticleForm({ ...articleForm, pdfUrl: '' })}
                        className="text-xs text-red-400 hover:text-red-600 flex-shrink-0"
                      >
                        {t(language, 'articlePdfRemove')}
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-sm text-[#5c3d20] cursor-pointer">
                      <span className="px-3 py-1.5 bg-white border border-[#e2d5c0] rounded-lg hover:border-[#c17f3a] flex items-center gap-1.5">
                        {pdfUploading
                          ? <><Loader2 size={14} className="animate-spin" />{t(language, 'articlePdfUploading')}</>
                          : <><FileText size={14} className="text-[#c17f3a]" />{t(language, 'articlePdf')}</>}
                      </span>
                      <input
                        type="file"
                        accept="application/pdf"
                        onChange={handlePdfSelect}
                        disabled={pdfUploading}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <label className="flex items-center gap-2 text-sm text-[#5c3d20]">
                  <input
                    type="checkbox"
                    checked={articleForm.published}
                    onChange={e => setArticleForm({ ...articleForm, published: e.target.checked })}
                    className="accent-[#7c4a1e]"
                  />
                  {t(language, 'articlePublished')}
                </label>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={articleSaving || pdfUploading || imageUploading || !articleForm.title.trim()}
                    className="bg-[#7c4a1e] hover:bg-[#3d1f00] text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1.5"
                  >
                    {articleSaving && <Loader2 size={14} className="animate-spin" />}
                    {t(language, 'articleSave')}
                  </button>
                  {editingArticleId && (
                    <button
                      type="button"
                      onClick={resetArticleForm}
                      className="px-4 py-2 rounded-lg text-sm border border-[#e2d5c0] text-[#7c4a1e] hover:bg-white"
                    >
                      {t(language, 'articleCancel')}
                    </button>
                  )}
                </div>
              </form>

              {/* 既存の記事一覧 */}
              {articlesLoading ? (
                <div className="flex justify-center py-6"><Loader2 className="animate-spin text-gray-400" /></div>
              ) : articles.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">{t(language, 'trendArticlesEmpty')}</p>
              ) : (
                <div className="space-y-3">
                  {articles.map(article => (
                    <div key={article.id} className="border border-[#e2d5c0] rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="font-semibold text-[#3d1f00] flex-1">{article.title}</h4>
                        {!article.published && (
                          <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex-shrink-0">
                            {t(language, 'articleDraft')}
                          </span>
                        )}
                        <button
                          onClick={() => handleArticleEdit(article)}
                          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-[#c17f3a] text-[#7c4a1e] hover:bg-[#fdf5ea] flex-shrink-0"
                        >
                          <Pencil size={13} />{t(language, 'articleEdit')}
                        </button>
                        <button
                          onClick={() => handleArticleDelete(article.id)}
                          className="text-red-400 hover:text-red-600 flex-shrink-0"
                          aria-label={t(language, 'articleDelete')}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <p className="text-xs text-gray-400 mb-2">
                        {new Date(article.createdAt).toLocaleString(language === 'ja' ? 'ja-JP' : 'en-US')}
                      </p>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">{article.body}</p>
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
