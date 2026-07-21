# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) へのガイダンスを提供します。

## コマンド

```bash
pnpm dev        # 開発サーバー起動 (http://localhost:5173)
pnpm build      # 本番ビルド
```

lint・テストのスクリプトは未設定。

## 環境変数

`.env` ファイルが必要：

```
VITE_SUPABASE_URL=https://nevibbruoyfflqdwlqaa.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_P2BsX2LUlEd1mdYIXcCS1A_AbP7Cr76
```

これが存在しない場合、Supabase クライアントがモジュール読み込み時に `throw` するため、アプリが真っ白になる（コンソールエラーも出ない）。

お問い合わせフォームの通知メール送信（[EmailJS](https://www.emailjs.com/)）には以下が必要（未設定でも問い合わせ自体はSupabaseに保存され、コンソール警告が出るだけでアプリは動く）：

```
VITE_EMAILJS_SERVICE_ID=
VITE_EMAILJS_TEMPLATE_ID=
VITE_EMAILJS_PUBLIC_KEY=
```

## アーキテクチャ

### 状態管理
アプリ全体の状態は `src/app/App.tsx`（約1400行の単一コンポーネント）に集約されている。ルーターは使用していない。画面遷移は状態フラグによる条件付きレンダリングで実現。

主な状態フラグ：
- `activeTab`: `'home' | 'search' | 'trends' | 'ranking'`
- `showNavMenu`: PC用ハンバーガーメニューの開閉
- `showLoginModal`, `showMyPage`, `showChat`, `showCombination`, `showAddForm`
- `selectedCondiment`: CondimentDetail 表示用
- `selectedAggregated`: CondimentReviews 表示用

### バックエンド（Supabase）

| ファイル | 役割 |
|---|---|
| `src/lib/supabase.ts` | クライアントのシングルトン |
| `src/lib/auth.ts` | `signUp` / `signIn` / `signOut` / `getProfile` / `updateProfile` |
| `src/lib/database.ts` | 調味料 CRUD、いいね・ブックマーク、`fetchAllLikeCounts()` |
| `src/lib/storage.ts` | `condiment-images` バケットへの画像アップロード |
| `src/lib/database.types.ts` | DB スキーマに対応した TypeScript 型 |
| `supabase_schema.sql` | RLS ポリシー・トリガーを含む完全なスキーマ定義（新規プロジェクト時は Supabase SQL Editor で実行する） |

### データフロー
1. マウント時に `App.tsx` が `supabase.auth.getSession()` と `fetchCondiments()` を呼ぶ
2. Supabase DB に調味料がなければインメモリのサンプルデータ（12件）にフォールバック
3. `onAuthStateChange` で `currentUser` を同期
4. `NotificationBell.tsx` では Supabase Realtime チャンネルでプッシュ通知を受信

### サンプルデータ（App.tsx インライン）
Supabase から取得できない場合のフォールバック用。12種の世界調味料：
ゆず胡椒・ハリッサ・コチュジャン・西京白味噌・タヒニ・ナンプラー・バルサミコ酢・塩麹・四川花椒・エキストラバージンオリーブオイル・ラー油・ぬちまーす

### コンポーネント一覧（`src/app/components/`）

| ファイル | 役割 |
|---|---|
| `CondimentCard.tsx` | 調味料カード（和モダンデザイン、ベージュ/ブラウン系） |
| `CondimentDetail.tsx` | 調味料詳細ページ（ヒーロー画像・レーダーチャート・コメント） |
| `CondimentReviews.tsx` | 投稿一覧モーダル（和モダン、投稿写真をトップ大表示） |
| `CategoryGrid.tsx` | カテゴリ選択グリッド（和モダン、絵文字アイコン） |
| `ChatPage.tsx` | AIチャット（サイト掲載調味料データ優先・詳細ページへ遷移） |
| `RankingPage.tsx` | いいねランキングページ |
| `TrendsPage.tsx` | トレンドページ |
| `UserRegistration.tsx` | 新規登録（Step1:利用規約同意 → Step2:プロフィール入力） |
| `LoginModal.tsx` | ログインモーダル |
| `AddCondimentForm.tsx` | 調味料投稿フォーム |
| `MyPage.tsx` | マイページ |
| `AdminPanel.tsx` | 管理パネル |
| `CombinationPage.tsx` | 調味料組み合わせページ |
| `TasteRadarChart.tsx` | 味覚レーダーチャート |
| `Comments.tsx` | コメント・返信機能 |
| `NotificationBell.tsx` | 通知ベル（Realtime） |
| `TranslateModal.tsx` | 翻訳モーダル |

### デザインシステム（和モダン）
全コンポーネントを以下のカラーパレットで統一：

| 変数 | カラーコード | 用途 |
|---|---|---|
| 深ブラウン | `#3d1f00` | ヘッダー背景・ヒーロー背景・ボタン |
| ミッドブラウン | `#7c4a1e` | アクセント・ボタン・アイコン |
| アンバー/ゴールド | `#c17f3a` | ハイライト・星・ボーダー |
| ウォームベージュ | `#e2d5c0` | ボーダー・区切り線 |
| クリーム背景 | `#faf7f2` | ページ背景 |
| ライトクリーム | `#fdf5ea` | カード背景・セクション背景 |

### 多言語対応
7言語対応：`ja` / `en` / `zh` / `ko` / `fr` / `es` / `vi`
文字列は `src/app/i18n/translations.ts` の `t(language, key)` を通す。
言語切替は header の `<select>` ドロップダウン（フラグ絵文字付き）。

### ナビゲーション構造
- **スマホ（SP）**: 下部固定タブバー（ホーム・検索・ランキング・マイページ）
- **PC（sm:）**: ハンバーガーボタン → ドロップダウンメニュー（ホーム・調味料一覧・トレンド・ランキング・AIチャット・マイページ・投稿する・組み合わせ）
- ランキングへのショートカット：SP検索バー横にトロフィーボタンを配置

### パーソナライズ
`preferredCategories`（useMemo）でいいね・ブックマーク済み調味料のカテゴリをスコアリング（いいね+2、ブックマーク+1）し、ホームの調味料表示順に反映。

### AIチャット（ChatPage.tsx）の動作優先順位
1. サイト掲載調味料の名前が含まれる → サイトデータで回答 + 詳細ページカード表示（タップでページ遷移）
2. 内蔵知識ベース（醤油・みりん・ごま油・豆板醤など）に該当 → 知識ベースで回答
3. 目的別（辛い・旨味・発酵など）キーワード → サイトデータから絞り込み
4. 人気・おすすめ → サイトデータのリピート評価順
5. 上記なし → 汎用フォールバック

### Tailwind CSS
Tailwind CSS v4（`@tailwindcss/vite`）を使用。`tailwind.config.js` は存在せず、設定は `src/styles/index.css` で行う。

### 利用規約
`UserRegistration.tsx` は Step1（利用規約全文表示・同意チェック）→ Step2（プロフィール入力）の2ステップ構成。規約への同意なしでは Step2 に進めない。
