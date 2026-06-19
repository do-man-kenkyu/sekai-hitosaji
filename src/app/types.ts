export type TasteBadge =
  | '辛党'
  | '甘党'
  | '塩味好き'
  | '酸味好き'
  | '苦味好き'
  | '旨味好き'
  | '舌が肥えている'
  | 'グルメ'
  | '健康志向'
  | '伝統派'
  | '冒険派'
  | '万能型'
  | 'スパイスマニア'
  | '発酵食品好き'
  | '無添加派'
  | 'オーガニック志向'
  | '減塩派'
  | '糖質控えめ'
  | '和食派'
  | '洋食派'
  | '中華好き'
  | 'エスニック好き'
  | '本格派'
  | '時短重視'
  | 'コスパ重視'
  | '高級志向'
  | '地産地消'
  | '希少品コレクター'
  | '調味料オタク'
  | '料理好き'
  | '素材重視'
  | '香り重視'
  | '色彩重視'
  | '食感重視'
  | 'ベジタリアン対応'
  | 'ヴィーガン対応'
  | 'ハラル対応';

export interface User {
  id: string;
  nickname: string;
  email: string;
  age: number;
  prefecture: string;
  city: string;
  gender: '男性' | '女性' | 'その他' | '回答しない';
  tasteBadges: TasteBadge[];
}

export interface TasteProfile {
  sweetness: number;   // 甘味 0-5
  sourness: number;    // 酸味 0-5
  bitterness: number;  // 苦味 0-5
  umami: number;       // 旨味 0-5
  saltiness: number;   // 塩味 0-5
  richness: number;    // 濃厚さ 0-5
  aroma: number;       // 香り 0-5
}

export type PurchaseLocation =
  | 'スーパー'
  | 'コンビニ'
  | '道の駅'
  | '専門店'
  | 'オンライン'
  | 'デパート'
  | 'その他';

export interface Condiment {
  id: string;
  name: string;
  category: string;
  description: string;
  origin: string;
  recommendedDishes: string[];
  pairingCondiments?: string[]; // 相性のよい調味料（任意）
  repeatRating: number; // リピートしたいか 1-5
  purchaseLocation: PurchaseLocation;
  tasteProfile: TasteProfile;
  imageUrl: string; // 必須
  dishImageUrl?: string; // 料理の画像（任意）
  postedBy: {
    userId: string;
    nickname: string;
    tasteBadges: TasteBadge[];
  };
  createdAt: string;
}

export interface AggregatedCondiment {
  name: string;
  category: string;
  origin: string;
  averageRepeatRating: number;
  postCount: number;
  posts: Condiment[];
  averageTasteProfile: TasteProfile;
  representativeImage: string;
}

export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県',
  '岐阜県', '静岡県', '愛知県', '三重県',
  '滋賀県', '京都府', '大阪府', '兵庫県', '奈良県', '和歌山県',
  '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県',
  '福岡県', '佐賀県', '長崎県', '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県',
  '海外'
] as const;
