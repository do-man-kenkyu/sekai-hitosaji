export type Language = 'ja' | 'en';

export const translations = {
  ja: {
    // Header
    siteTitle: '🧂 世界のひとさじ',
    admin: '管理者',
    userRegistration: 'ユーザー登録',
    addCondiment: '調味料を追加',
    search: '調味料を検索...',
    all: 'すべて',

    // Categories
    soySauce: '醤油',
    miso: '味噌',
    salt: '塩',
    sugar: '砂糖',
    vinegar: '酢',
    oil: '油',
    spice: 'スパイス',
    sauce: 'ソース',
    other: 'その他',

    // Purchase Locations
    supermarket: 'スーパー',
    convenience: 'コンビニ',
    roadStation: '道の駅',
    specialty: '専門店',
    online: 'オンライン',
    department: 'デパート',
    otherLocation: 'その他',

    // Common
    close: '閉じる',
    register: '登録',
    add: '追加',
    cancel: 'キャンセル',
    browseByCategory: 'カテゴリから探す',
    myPage: 'マイページ',
    profile: 'プロフィール',
    location: '居住地',
    yourPosts: 'あなたの投稿',
    translate: '翻訳',
    aiChat: 'AIチャット',
    chatAssistant: '調味料アシスタント',
    send: '送信',

    // Stats
    totalPosts: '全{count}件の投稿',
    totalTypes: '{count}種類の調味料',
    noResults: '条件に一致する調味料が見つかりませんでした',
    noCondiments: 'まだ調味料が登録されていません',
    firstCondiment: '最初の調味料を追加',

    // User Posts
    userPosts: '{nickname} さんの投稿',
    totalPostsCount: '全{count}件の投稿',
    avgRepeatRating: '平均リピート度',
    topCategories: 'よく投稿するカテゴリ',
    postList: '投稿一覧',
    noPosts: 'まだ投稿がありません',
    postedDate: '投稿日',
    origin: '産地',
    items: '{count}件',

    // Condiment Reviews
    condimentReviews: '{name} のレビュー',
    postsCount: '投稿数',
    posts: '件',
    averageRating: '平均リピート度',
    averageTaste: '平均味覚プロファイル',
    allReviews: 'すべてのレビュー',

    // Condiment Detail
    repeatRating: 'リピート度',
    purchaseLocation: '購入場所',
    recommendedDishes: 'おすすめ料理',
    tasteProfile: '味覚プロファイル',
    description: '説明',
    condimentImage: '調味料の画像',
    dishImage: '料理の画像',
    postedBy: '投稿者',

    // Add Condiment Form
    addCondimentTitle: '新しい調味料を追加',
    condimentName: '調味料名',
    category: 'カテゴリ',
    selectCategory: 'カテゴリを選択',
    condimentDescription: '説明',
    originPrefecture: '産地（都道府県）',
    selectPrefecture: '都道府県を選択',
    overseas: '海外',
    purchaseLocationLabel: '購入場所',
    selectPurchaseLocation: '購入場所を選択',
    repeatRatingLabel: 'リピート度 (1-5)',
    condimentImageLabel: '調味料の画像（必須）',
    uploadImage: '画像をアップロード',
    searchImage: '画像を検索',
    dishImageLabel: '料理の画像（任意）',
    recommendedDishesLabel: 'おすすめ料理（カンマ区切り）',
    recommendedDishesPlaceholder: '例: 刺身, 煮物, 炒め物',
    tasteProfileLabel: '味覚プロファイル',
    sweetness: '甘味',
    sourness: '酸味',
    bitterness: '苦味',
    umami: '旨味',
    saltiness: '塩味',
    richness: '濃厚さ',
    aroma: '香り',
    imageSearchPlaceholder: '画像を検索...',
    searching: '検索中...',

    // User Registration
    userRegistrationTitle: 'ユーザー登録',
    nickname: 'ニックネーム',
    age: '年齢',
    gender: '性別',
    male: '男性',
    female: '女性',
    otherGender: 'その他',
    noAnswer: '回答しない',
    prefecture: '都道府県',
    city: '市区町村',
    tasteBadges: '味覚バッジ（複数選択可）',

    // Admin Panel
    adminPanelTitle: '管理者パネル',
    statistics: '統計情報',
    totalUsers: '総ユーザー数',
    totalCondimentsCount: '総調味料投稿数',
    userList: 'ユーザー一覧',

    // Alerts
    needRegistration: '調味料を投稿するにはユーザー登録が必要です',
    fillAllFields: 'すべてのフィールドを入力してください',
  },
  en: {
    // Header
    siteTitle: '🧂 World of Spoonful',
    admin: 'Admin',
    userRegistration: 'Sign Up',
    addCondiment: 'Add Condiment',
    search: 'Search condiments...',
    all: 'All',

    // Categories
    soySauce: 'Soy Sauce',
    miso: 'Miso',
    salt: 'Salt',
    sugar: 'Sugar',
    vinegar: 'Vinegar',
    oil: 'Oil',
    spice: 'Spice',
    sauce: 'Sauce',
    other: 'Other',

    // Purchase Locations
    supermarket: 'Supermarket',
    convenience: 'Convenience Store',
    roadStation: 'Road Station',
    specialty: 'Specialty Store',
    online: 'Online',
    department: 'Department Store',
    otherLocation: 'Other',

    // Common
    close: 'Close',
    register: 'Register',
    add: 'Add',
    cancel: 'Cancel',
    browseByCategory: 'Browse by Category',
    myPage: 'My Page',
    profile: 'Profile',
    location: 'Location',
    yourPosts: 'Your Posts',
    translate: 'Translate',
    aiChat: 'AI Chat',
    chatAssistant: 'Condiment Assistant',
    send: 'Send',

    // Stats
    totalPosts: '{count} total posts',
    totalTypes: '{count} types of condiments',
    noResults: 'No condiments match your criteria',
    noCondiments: 'No condiments registered yet',
    firstCondiment: 'Add the first condiment',

    // User Posts
    userPosts: 'Posts by {nickname}',
    totalPostsCount: '{count} total posts',
    avgRepeatRating: 'Avg Repeat Rating',
    topCategories: 'Top Categories',
    postList: 'Post List',
    noPosts: 'No posts yet',
    postedDate: 'Posted',
    origin: 'Origin',
    items: '{count} items',

    // Condiment Reviews
    condimentReviews: 'Reviews for {name}',
    postsCount: 'Posts',
    posts: 'posts',
    averageRating: 'Avg Repeat Rating',
    averageTaste: 'Average Taste Profile',
    allReviews: 'All Reviews',

    // Condiment Detail
    repeatRating: 'Repeat Rating',
    purchaseLocation: 'Purchase Location',
    recommendedDishes: 'Recommended Dishes',
    tasteProfile: 'Taste Profile',
    description: 'Description',
    condimentImage: 'Condiment Image',
    dishImage: 'Dish Image',
    postedBy: 'Posted by',

    // Add Condiment Form
    addCondimentTitle: 'Add New Condiment',
    condimentName: 'Condiment Name',
    category: 'Category',
    selectCategory: 'Select category',
    condimentDescription: 'Description',
    originPrefecture: 'Origin (Prefecture)',
    selectPrefecture: 'Select prefecture',
    overseas: 'Overseas',
    purchaseLocationLabel: 'Purchase Location',
    selectPurchaseLocation: 'Select purchase location',
    repeatRatingLabel: 'Repeat Rating (1-5)',
    condimentImageLabel: 'Condiment Image (Required)',
    uploadImage: 'Upload Image',
    searchImage: 'Search Image',
    dishImageLabel: 'Dish Image (Optional)',
    recommendedDishesLabel: 'Recommended Dishes (comma-separated)',
    recommendedDishesPlaceholder: 'e.g., Sashimi, Stew, Stir-fry',
    tasteProfileLabel: 'Taste Profile',
    sweetness: 'Sweetness',
    sourness: 'Sourness',
    bitterness: 'Bitterness',
    umami: 'Umami',
    saltiness: 'Saltiness',
    richness: 'Richness',
    aroma: 'Aroma',
    imageSearchPlaceholder: 'Search images...',
    searching: 'Searching...',

    // User Registration
    userRegistrationTitle: 'User Registration',
    nickname: 'Nickname',
    age: 'Age',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    otherGender: 'Other',
    noAnswer: 'Prefer not to say',
    prefecture: 'Prefecture',
    city: 'City',
    tasteBadges: 'Taste Badges (multiple selection)',

    // Admin Panel
    adminPanelTitle: 'Admin Panel',
    statistics: 'Statistics',
    totalUsers: 'Total Users',
    totalCondimentsCount: 'Total Condiment Posts',
    userList: 'User List',

    // Alerts
    needRegistration: 'You need to register to post condiments',
    fillAllFields: 'Please fill in all fields',
  }
};

export function t(lang: Language, key: keyof typeof translations.ja, params?: Record<string, string | number>): string {
  let text = translations[lang][key] || translations.ja[key];

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      text = text.replace(`{${key}}`, String(value));
    });
  }

  return text;
}

export const CATEGORY_KEYS: Record<string, keyof typeof translations.ja> = {
  'すべて': 'all',
  '醤油': 'soySauce',
  '味噌': 'miso',
  '塩': 'salt',
  '砂糖': 'sugar',
  '酢': 'vinegar',
  '油': 'oil',
  'スパイス': 'spice',
  'ソース': 'sauce',
  'その他': 'other',
};

export const PURCHASE_LOCATION_KEYS: Record<string, keyof typeof translations.ja> = {
  'スーパー': 'supermarket',
  'コンビニ': 'convenience',
  '道の駅': 'roadStation',
  '専門店': 'specialty',
  'オンライン': 'online',
  'デパート': 'department',
  'その他': 'otherLocation',
};
