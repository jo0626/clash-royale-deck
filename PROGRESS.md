# CR Deck Builders 進捗メモ

- 最終更新: 2026-06-06
- 本番: https://crdeckbuilders.com/ （GitHub Pages）
- リポジトリ: rea-fi-lia/clash-royale-deck
- 作者表記: By rea-fi-lia

---

## ページ構成
- `index.html` … デッキ作成ツール（ビルダー）本体
- `strategy.html` … 攻略・人気デッキ（人気デッキ / 分析）
- `support.html` … 支援・寄付
- `contact.html` … リクエスト・お問い合わせ
- `auth.js` … ログイン共通モジュール（Firebase）
- `decks.json` … 人気デッキデータ（GASが自動更新）
- `firestore.rules` … Firestoreセキュリティルール（コンソールに貼る用）
- `gas/Code.gs` … 人気デッキ自動集計スクリプト（GAS）

ヘッダーの共通ナビ: 🛠️デッキ作成 / 🏆攻略 / 💛支援 / ✉️問い合わせ ＋ 👤ログイン

---

## できていること（DONE）

### ビルダー（index.html）
- 全121枚のカード。検索（ひらがな→カタカナ変換・ヨミ対応）、✕クリア（キーボード開閉を保持・大きめ）、Enterでキーボード閉じ。
- タイプタブ: 全て/ユニット/呪文/建物/⚡限界突破/👑ヒーロー/🏆チャンピオン ＋ ❤お気に入り。
  - PC=複数選択 / 携帯=単一選択。未選択＝全て。限界突破・ヒーロー選択時はカード画像もその姿に。
- お気に入り（localStorage）。ハートのポップアニメ（モバイル対応済み）。
- デッキ8枠（0=進化/1=ヒーロー・チャンピオン/2=ワイルド/3-7=通常）、平均コスト、コスト分布バー、テキストコピー、クリア。
- フッター「By rea-fi-lia」を指でなぞるとキラキラ。PC・モバイル両方で常時表示（iOS下部バー対策済み）。
- URL読み込み: `index.html?deck=カード名,...`（スロット順）でデッキを自動セット。

### 攻略・人気デッキ（strategy.html）
- `decks.json` を読み込み、人気デッキを4×2プレビューで表示（進化⚡/ヒーロー👑をビルダーと同じ判定で表示）。
- 「▶ 作成ツールで開く」でワンタップ読み込み。取得失敗時は内蔵デッキにフォールバック。
- 分析ページは準備中。

### 人気デッキ自動更新（GAS）
- `gas/Code.gs` が **パス・オブ・レジェンド世界ランキング上位**プレイヤーの currentDeck を集計 → 頻度上位を `decks.json` 化 → GitHubへ自動コミット。
- 6時間ごとのトリガーで自動実行。
- 公式API直叩き不可のため **RoyaleAPIプロキシ（proxy.royaleapi.dev）** 経由。許可IPは `45.79.218.79`。
- 秘密情報は **GASのスクリプト プロパティ**に保管（CR_TOKEN / GITHUB_TOKEN / GITHUB_REPO / GITHUB_PATH / GITHUB_BRANCH）。
- カード名は英語slug→日本語名の対応表をCode.gsに内蔵。

### SEO等（既存）
- タイトル/description、OGP/Twitter Card、canonical、Search Console登録、サイトマップ、構造化データ(JSON-LD)。

---

## 作業中（IN PROGRESS）— ログイン（Firebase）
- Firebaseプロジェクト: `crdeckbuilders`（Sparkプラン・無料）。
- `auth.js`: メール/パス＋Googleログイン、👤ボタン（全ページ共通）、ユーザードキュメント作成、CRタグ保存。
- Firestore: `users/{uid}` = { email, displayName, crTag, tier, createdAt }。
- ルール: 自分のデータのみ読み書き可。**tierはクライアントから変更不可**（寄付グレードは運営/サーバーのみ更新）。
- Firebase設定の値（apiKey等）は公開用なので `auth.js` に直書きでOK。

### ログイン導入の残タスク
- [ ] Authで メール/パス＋Google を有効化
- [ ] Firestore作成＋ルール公開
- [ ] 承認済みドメインに crdeckbuilders.com 追加
- [ ] auth.js / index.html / strategy.html をデプロイ
- [ ] support.html / contact.html の </body> 直前に `<script type="module" src="auth.js"></script>` 追加
- [ ] ログイン動作確認

---

## これからやりたい（TODO）
- tier（寄付グレード）に応じた**見た目グレード変化**（ブロンズ/シルバー/ゴールド/ダイヤ等）。
- **デッキ保存のクラウド同期**（Firestore、別端末でも復元）。※ローカル保存(localStorage)から拡張。
- **プレイヤータグで「組めるデッキだけ」絞り込み**（GASに `?tag=` で所持カードを返す doGet を追加して併用）。
- **寄付→tier自動付与**（当面は手動でコンソール更新。将来 Ko-fi/Stripe等のWebhook → Cloud Functionで自動化）。
- 分析ページ（コストカーブ・攻防/呪文バランス等）。

---

## メモ / ハマりどころ
- iOSでフッターが消える問題: フッターは `body` 直下（.appの兄弟）に置く。`100dvh`＋`position:fixed; inset:0` の組み合わせが正。`svh`/`visualViewport` 実測に変えると逆に崩れる。
- 絵文字は生成スクリプトで raw string にすると `\U0001…` のまま出るので注意（実体で埋め込む）。
- GAS: トロフィー世界ランキング(`/locations/global/rankings/players`)は空。現行は `/locations/global/pathoflegend/players`。
- CRトークンはコピー時に空白混入・文字化けしやすい（Chromeで折り返し化け→Safari＋右クリックコピーで解決）。Code.gs側でも `[^A-Za-z0-9._-]` を除去する保険あり。
