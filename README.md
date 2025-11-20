# GAS RSS Notifier

Google Apps Script (GAS) を使用して、RSSフィードから情報を取得し、関連性の高い記事をSlackに自動通知するシステムです。

## 特徴

- RSSフィードから記事を自動取得
- キーワードベースのフィルタリング
- 記事の要約生成（日本語対応）
- Slackへの自動通知
- 重複記事の除外
- Google スプレッドシートでの記事管理
- TypeScript実装による型安全性

## システム構成

```
RSS Feed → GAS → Spreadsheet → Filter → Summarizer → Slack
```

- **実行基盤**: Google Apps Script (GAS)
- **データ保存**: Google スプレッドシート
- **通知先**: Slack (Incoming Webhook)
- **開発言語**: TypeScript

## プロジェクト構造

```
gas-rss-notifier/
├── src/
│   ├── config.ts                  # 設定管理
│   ├── types.ts                   # 型定義
│   ├── main.ts                    # メイン実行スクリプト
│   ├── rss/
│   │   └── fetcher.ts            # RSS取得
│   ├── spreadsheet/
│   │   └── repository.ts         # スプレッドシート操作
│   ├── filter/
│   │   └── filter.ts             # 記事フィルタリング
│   ├── summarizer/
│   │   └── summarizer.ts         # 要約生成
│   └── notification/
│       └── slack.ts              # Slack通知
├── .clasp.json                    # clasp設定
├── appsscript.json                # GAS設定
├── tsconfig.json                  # TypeScript設定
├── package.json
└── README.md
```

## セットアップ手順

### 1. 必要な環境

- Node.js (v14以上)
- Google アカウント
- Slack ワークスペース（Incoming Webhook URL）

### 2. プロジェクトのクローン

```bash
git clone <repository-url>
cd gas-rss-notifier
npm install
```

### 3. Google Apps Script の準備

#### 3-1. clasp のインストールとログイン

```bash
npm install -g @google/clasp
clasp login
```

#### 3-2. GASプロジェクトの作成

新しいスプレッドシートにバインドされたGASプロジェクトを作成します：

```bash
clasp create --type sheets --title "RSS Notifier"
```

作成されたスクリプトIDを `.clasp.json` に保存してください。

### 4. コードのデプロイ

```bash
clasp push
```

### 5. Slack Webhook URLの取得

1. Slack ワークスペースで [Incoming Webhooks](https://api.slack.com/messaging/webhooks) を設定
2. 通知先チャンネルを選択してWebhook URLを取得

### 6. OpenAI API Keyの取得（オプション）

OpenAI要約機能を使う場合：

1. [OpenAI Platform](https://platform.openai.com/) でアカウント作成
2. API Keys → Create new secret key で API Key を取得

### 7. 初期設定

1. GASエディタを開く：
   ```bash
   clasp open
   ```

2. `setupInitial` 関数を実行して設定シートを作成

3. **スクリプトプロパティの設定（機密情報）**:

   GASエディタ → ⚙️ プロジェクトの設定 → スクリプト プロパティで以下を追加：

   - `SLACK_WEBHOOK_URL`: Slack Webhook URL
   - `ERROR_SLACK_WEBHOOK_URL`: エラー通知用Webhook URL（オプション）
   - `OPENAI_API_KEY`: OpenAI API Key（オプション）

   または、claspコマンドで設定：
   ```bash
   clasp setting scriptProperty SLACK_WEBHOOK_URL "https://hooks.slack.com/services/..."
   clasp setting scriptProperty OPENAI_API_KEY "sk-..."
   ```

4. **スプレッドシートでの設定**:

   「設定」シートを開き、以下を設定：
   - `FILTER_KEYWORDS`: フィルタリングキーワード（カンマ区切り）
   - `SUMMARY_TYPE`: `openai` または `simple`
   - その他の設定を必要に応じて調整

### 8. 動作確認

#### テスト実行

1. **RSS取得テスト**:
   ```
   GASエディタで testFetchRSS() を実行
   ```

2. **フィルタテスト**:
   ```
   GASエディタで testFilter() を実行
   ```

3. **本番実行テスト**:
   ```
   GASエディタで main() を実行
   ```

### 9. 定期実行の設定

GASエディタで時間トリガーを設定します：

1. GASエディタ → トリガー → トリガーを追加
2. 実行する関数: `main`
3. イベントのソース: `時間主導型`
4. 時間ベースのトリガー: 例）`1日タイマー` `午前9時～10時`

## 設定項目

### スクリプトプロパティ（機密情報）

以下の設定は、GASのスクリプトプロパティで管理します：

| プロパティ名 | 説明 |
|------------|------|
| SLACK_WEBHOOK_URL | SlackのIncoming Webhook URL（記事通知用） |
| ERROR_SLACK_WEBHOOK_URL | エラー通知用Webhook URL（省略時はエラー通知を送信しません） |
| OPENAI_API_KEY | OpenAI API Key（openaiモード時に必須） |

**設定方法**:
- GASエディタ → ⚙️ プロジェクトの設定 → スクリプト プロパティ
- または `clasp setting scriptProperty <KEY> "<VALUE>"`

### スプレッドシート設定

スプレッドシートの「設定」シートで以下の項目を設定できます：

| 設定キー | デフォルト値 | 説明 |
|---------|------------|------|
| RSS_FEED_URL | https://www.socialmediatoday.com/feeds/news/ | RSSフィードのURL |
| SHEET_NAME | 記事一覧 | 記事を保存するシート名 |
| FILTER_KEYWORDS | social media,marketing,... | フィルタリングキーワード（カンマ区切り） |
| MAX_ARTICLE_AGE_DAYS | 7 | 取得する記事の最大経過日数 |
| SUMMARY_ENABLED | true | 要約機能の有効化 |
| SUMMARY_MAX_LENGTH | 200 | 要約の最大文字数（simpleモード時） |
| SUMMARY_TYPE | openai | 要約タイプ（simple/openai） |
| OPENAI_MODEL | gpt-4o-mini | OpenAIモデル名（gpt-4o-mini, gpt-4o等） |
| OPENAI_REASONING_EFFORT | minimal | OpenAI推論レベル（none, minimal, low, medium, high） |

## 機能詳細

### RSS取得

- 指定されたRSSフィードから記事を取得
- XMLパースによる記事情報の抽出
- エラーハンドリングとログ出力

### 記事管理

- スプレッドシートへの記事保存
- 記事IDによる重複チェック
- 通知済みフラグの管理

### フィルタリング

- キーワードマッチング（タイトル・説明文）
- 公開日時による絞り込み
- 柔軟なフィルタ条件設定
- 単語として検索する機能

**キーワードマッチングの種類**:
- **通常の検索**: `instagram` → "Instagram"や"instagram"にマッチ（部分一致）
- **単語として検索**: `\bX\b` → "X"が独立した単語の場合のみマッチ
  - ✅ マッチ: "X platform", "on X", "X and Instagram"
  - ❌ 非マッチ: "Experience", "Explore", "eXample"

**使用例**:
```
FILTER_KEYWORDS: social media,marketing,\bX\b,instagram,tiktok
```
上記の設定で、"X"（旧Twitter）を単語として検索しつつ、"experience"などの単語内の"x"を除外できます。

### 要約生成

**OpenAI API要約（推奨）**:
- OpenAI APIを使ったSNS運営視点の要約生成
- 📝要約: 記事内容を簡潔に要約
- 💡SNS運営に影響しそうなポイント: SNSマーケティングへの影響を分析
- デフォルトモデル: gpt-4o-mini（設定で変更可能）

**シンプル要約（フォールバック）**:
- ルールベースの簡易要約
- 文字数制限と自然な文末処理
- OpenAI APIキーが未設定の場合に自動使用

### Slack通知

- リッチフォーマットによる通知
- 記事タイトル、リンク、要約の表示
- サマリーメッセージとエラー通知

## トラブルシューティング

### RSS取得エラー

- RSSフィードURLが正しいか確認
- URLFetchApp の実行権限を確認

### Slack通知エラー

- Webhook URLが正しいか確認
- Slackの送信制限に注意（1秒に1メッセージ推奨）

### スプレッドシート エラー

- スプレッドシートの編集権限を確認
- シート名が正しいか確認

### 実行時間制限

- GASの実行時間制限は6分/実行
- 大量の記事処理時は処理を分割

## 開発

### ローカル開発

```bash
# コードをローカルにプル
clasp pull

# 編集後、GASにプッシュ
clasp push
```

### ログの確認

```bash
clasp logs
```

または、GASエディタの「実行ログ」から確認できます。

### テストの実行

重要なビジネスロジックに対するユニットテストが用意されています。

#### ローカル環境でテスト（推奨）

vitestを使用して、高速にテストを実行できます：

```bash
# 依存パッケージをインストール
npm install

# テストを実行
npm test

# watchモードでテストを実行（開発時）
npm run test:watch

# カバレッジレポートを生成
npm run test:coverage
```

実行例：

```
✓ __tests__/filter.test.ts (7 tests) 12ms
✓ __tests__/summarizer.test.ts (6 tests) 8ms

Test Files  2 passed (2)
Tests  13 passed (13)
Duration  235ms
```

## 拡張機能（今後の実装予定）

- [ ] LLM APIによる高度な要約（Gemini、OpenAI）
- [ ] 複数RSSフィード対応
- [ ] 記事のスコアリング機能
- [ ] Slackへのスレッド投稿
- [ ] AWS Lambda版への移植

## ライセンス

MIT License

## 参考資料

- [Google Apps Script Documentation](https://developers.google.com/apps-script)
- [Slack Incoming Webhooks](https://api.slack.com/messaging/webhooks)
- [clasp - Command Line Apps Script Projects](https://github.com/google/clasp)
