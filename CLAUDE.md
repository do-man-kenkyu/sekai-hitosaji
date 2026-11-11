# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) へのガイダンスを提供します。

## コマンド

```bash
pnpm dev        # 開発サーバー起動 (http://localhost:5173)
pnpm build      # 本番ビルド
```

lint・テストのスクリプトは未設定。

### デプロイ
`main` ブランチへの push で `.github/workflows/deploy.yml` が GitHub Pages にデプロイする。本番は `/sekai-hitosaji/` のサブパスで配信されるため、`vite.config.ts` は `build` 時のみ `base: '/sekai-hitosaji/'` を設定している。`public/` 配下の画像パスは `src/app/assetPath.ts` の `withBase()` を通すこと。

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
アプリ全体の状態は `src/app/App.tsx`（約1650行の単一コンポーネント）に集約されている。ルーターは使用していない。画面遷移は状態フラグによる条件付きレンダリングで実現。

主な状態フラグ：
- `activeTab`: `'home' | 'search' | 'trends' | 'ranking'`
- `showNavMenu`: PC用ハンバーガーメニューの開閉
- `showLoginModal`, `showUserRegistration`, `showMyPage`, `showChat`, `showCombination`, `showAddForm`, `showAdminPanel`, `showContact`
- `showLegal`: `'terms' | 'privacy' | null`（LegalModal 表示用）
- `editingCondiment`: 投稿の編集対象
- `shareModalName`: ShareModal 表示用
- `selectedCondiment`: CondimentDetail 表示用
- `selectedAggregated`: CondimentReviews 表示用
- `selectedUserPosts`: UserPosts（特定ユーザーの投稿一覧）表示用
- `filterCategory` / `filterOrigin` / `filterPurchase`: 一覧の絞り込み（産地・購入場所バッジから設定）

### バックエンド（Supabase）

| ファイル | 役割 |
|---|---|
| `src/lib/supabase.ts` | クライアントのシングルトン |
| `src/lib/auth.ts` | `signUp` / `signIn` / `signOut` / `getProfile` / `updateProfile` |
| `src/lib/database.ts` | 調味料 CRUD、いいね・ブックマーク、`fetchAllLikeCounts()` |
| `src/lib/storage.ts` | `condiment-images` バケットへの画像アップロード |
| `src/lib/inquiries.ts` | お問い合わせの保存・取得（`inquiries` テーブル） |
| `src/lib/emailNotify.ts` | お問い合わせ時の EmailJS 通知メール送信 |
| `src/lib/trendArticles.ts` | トレンド欄の運営お知らせ記事 CRUD（PDF添付対応。テーブル・列が未作成でも落ちないよう判定関数あり） |
| `src/lib/database.types.ts` | DB スキーマに対応した TypeScript 型 |
| `supabase_schema.sql` | RLS ポリシー・トリガーを含む完全なスキーマ定義（新規プロジェクト時は Supabase SQL Editor で実行する） |

#### SQL マイグレーション（リポジトリ直下）
`supabase_schema.sql` 以外は既存プロジェクトに対する差分スクリプトで、いずれも Supabase SQL Editor で一度だけ実行する。

| ファイル | 内容 |
|---|---|
| `supabase_seed_condiments.sql` | 調味料22件の登録 |
| `supabase_add_pairing_column.sql` | `condiments` に「相性のよい調味料」列を追加 |
| `supabase_split_private_profile.sql` | 年齢・性別・居住地を非公開テーブルへ分離 |
| `supabase_add_fullname_birthdate.sql` | 氏名（管理者のみ閲覧）・生年月日を追加 |
| `supabase_migrate_profile_all.sql` | 上記プロフィール構造（`profile_private` / `profile_admin_only`）への一括移行 |
| `supabase_fix_profile_trigger.sql` | 新規登録時にプロフィールが反映されない不具合の修正 |
| `supabase_add_inquiries_table.sql` | お問い合わせテーブル追加 |
| `supabase_add_trend_articles.sql` / `supabase_update_trend_articles.sql` / `supabase_add_article_pdf.sql` / `supabase_make_article_body_optional.sql` | トレンドお知らせ記事テーブルの作成・更新・PDF添付・本文任意化 |
| `supabase_update_repo_url.sql` | リポジトリ移管に伴う `image_url` 一括置換 |
| `supabase_change_dohman_email.sql` | 「道満調味料研究所」アカウントのログインメール変更 |

### その他のユーティリティ（`src/app/`）

| ファイル | 役割 |
|---|---|
| `admin.ts` | 管理者メール一覧 `ADMIN_EMAILS` と `isAdmin()` |
| `idleLogout.ts` | 1時間無操作で自動ログアウト（最終操作時刻を localStorage に保持） |
| `chatHistory.ts` | AIチャット履歴を sessionStorage に保持（ログアウト時に破棄） |
| `searchLog.ts` | 検索キーワードを月別に localStorage へ記録し管理パネルで集計 |
| `translate.ts` | ユーザー投稿文の翻訳（Google 翻訳の非公式エンドポイント、モジュール内キャッシュ） |
| `legalContent.ts` | 利用規約・プライバシーポリシー本文（ja/en） |
| `categoryImages.ts` | カテゴリ代表画像と絵文字フォールバック |
| `assetPath.ts` | `withBase()`（GitHub Pages の base パス付与） |
| `types.ts` | 共通型定義 |
| `utils/` | `age.ts`（年齢算出）・`aggregateCondiments.ts`（同名調味料の集約）・`csv.ts`（CSV出力） |

### データフロー
1. マウント時に `App.tsx` が `supabase.auth.getSession()` と `fetchCondiments()` を呼ぶ
2. Supabase DB から取得できない・空の場合は localStorage（`condimentsVersion` が `4.3` のもの）→ インメモリのサンプルデータ（22件）の順にフォールバック
3. `onAuthStateChange` で `currentUser` を同期
4. `NotificationBell.tsx` では Supabase Realtime チャンネルでプッシュ通知を受信

### サンプルデータ（App.tsx インライン）
Supabase から取得できない場合のフォールバック用。道満調味料研究所の掲載商品22件（id: `dm-001`〜）：
みどりのラー油・薫る焦がし醤油・離宮の食べる七味・心のぽん酢醤油・生きてる醤油・北海道の鰹節香るだし醤油・底引きたまり・ひしほ・赤ぽん酢・伊達の旨塩・笹川流れの塩・深層海塩ハマネ焼塩・マスターネ。木桶醤油・いしる・トマトバ塩・ジンジャーママ しょうが生ふりかけ・卵かけごはんにかける醤油・卵に醤油・きくらげラー油・しろたまり・玉子ごはん専用昆布醤油・みんなのニラ醤油

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
| `AdminPanel.tsx` | 管理パネル（年代別・地域別ユーザー数グラフ、区分ごとのユーザー一覧、検索ログ、お問い合わせ、お知らせ記事管理） |
| `CombinationPage.tsx` | 調味料組み合わせページ |
| `TasteRadarChart.tsx` | 味覚レーダーチャート |
| `Comments.tsx` | コメント・返信機能 |
| `NotificationBell.tsx` | 通知ベル（Realtime） |
| `TranslateModal.tsx` | 翻訳モーダル |
| `AdCarousel.tsx` | 広告カルーセル |
| `CategoryIllustration.tsx` | カテゴリごとの手描き風SVGイラスト |
| `CondimentMap.tsx` | 産地マップ（Leaflet、都道府県庁所在地の座標で表示） |
| `ContactModal.tsx` | お問い合わせフォーム（Supabase保存 + EmailJS通知） |
| `LegalModal.tsx` | 利用規約・プライバシーポリシー閲覧モーダル |
| `PdfInline.tsx` | お知らせ記事のPDFインライン表示（pdfjs-dist、最大10ページ） |
| `ShareModal.tsx` | 調味料のシェア |
| `UserPosts.tsx` | 特定ユーザーの投稿一覧 |

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
7言語分の型・翻訳キーを持つ：`ja` / `en` / `zh` / `ko` / `fr` / `es` / `vi`
ただし現在は `App.tsx` の `LANGUAGE_OPTIONS` で **`ja` と `en` のみ有効**（他は `enabled: false`）。
文字列は `src/app/i18n/translations.ts` の `t(language, key)` を通す。
言語切替は header の `<select>` ドロップダウン（フラグ絵文字付き）。

### ナビゲーション構造
- **スマホ（SP）**: 下部固定タブバー（ホーム・検索・ランキング・マイページ）
- **PC（sm:）**: ハンバーガーボタン → ドロップダウンメニュー（ホーム・調味料一覧・トレンド・AIチャット・組み合わせ・お問い合わせ・利用規約・プライバシーポリシー など）
- 管理者（`isAdmin`）ログイン時はヘッダーに管理パネルボタンが出る
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
