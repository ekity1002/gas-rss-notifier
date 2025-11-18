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

### 6. 初期設定

1. GASエディタを開く：
   ```bash
   clasp open
   ```

2. `setupInitial` 関数を実行して設定シートを作成

3. スプレッドシートで「設定」シートを開き、以下を設定：
   - `SLACK_WEBHOOK_URL`: Slack Webhook URL
   - `FILTER_KEYWORDS`: フィルタリングキーワード（カンマ区切り）
   - その他の設定を必要に応じて調整

### 7. 動作確認

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

### 8. 定期実行の設定

GASエディタで時間トリガーを設定します：

1. GASエディタ → トリガー → トリガーを追加
2. 実行する関数: `main`
3. イベントのソース: `時間主導型`
4. 時間ベースのトリガー: 例）`1日タイマー` `午前9時～10時`

## 設定項目

スプレッドシートの「設定」シートで以下の項目を設定できます：

| 設定キー | デフォルト値 | 説明 |
|---------|------------|------|
| RSS_FEED_URL | https://www.socialmediatoday.com/feeds/news/ | RSSフィードのURL |
| SHEET_NAME | 記事一覧 | 記事を保存するシート名 |
| FILTER_KEYWORDS | social media,marketing,... | フィルタリングキーワード（カンマ区切り） |
| MAX_ARTICLE_AGE_DAYS | 7 | 取得する記事の最大経過日数 |
| SLACK_WEBHOOK_URL | (空) | SlackのIncoming Webhook URL |
| SUMMARY_ENABLED | true | 要約機能の有効化 |
| SUMMARY_MAX_LENGTH | 200 | 要約の最大文字数 |

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

### 要約生成

- ルールベースの要約（初期実装）
- 文字数制限と自然な文末処理
- LLM API対応の拡張可能な設計

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
