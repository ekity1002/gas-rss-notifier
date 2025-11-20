# セットアップガイド

このガイドでは、GAS RSS Notifierの詳細なセットアップ手順を説明します。

## 前提条件

- Node.js v14以上がインストールされていること
- Googleアカウントを持っていること
- Slackワークスペースの管理者権限またはIncoming Webhook作成権限があること

## ステップ1: プロジェクトのセットアップ

### 1-1. リポジトリのクローン

```bash
git clone <repository-url>
cd gas-rss-notifier
```

### 1-2. 依存パッケージのインストール

```bash
npm install
```

## ステップ2: Google Apps Script の設定

### 2-1. clasp のインストール

claspは、ローカルでGASプロジェクトを管理するためのツールです。

```bash
npm install -g @google/clasp
```

### 2-2. Google アカウントでログイン

```bash
clasp login
```

ブラウザが開き、Googleアカウントの認証が求められます。

### 2-3. GASプロジェクトの作成

スプレッドシートにバインドされたGASプロジェクトを新規作成します：

```bash
clasp create --type sheets --title "RSS Notifier"
```

実行すると、以下のような出力が表示されます：

```
Created new Google Sheet: https://docs.google.com/spreadsheets/d/XXXXX...
Created new Google Sheets Add-on script: https://script.google.com/d/YYYYY.../edit
```

### 2-4. スクリプトIDの確認

`.clasp.json` ファイルが自動生成され、スクリプトIDが記録されます：

```json
{
  "scriptId": "YYYYY...",
  "rootDir": "./src"
}
```

## ステップ3: Slack Webhook URL の取得

### 3-1. Slack App の作成

1. [Slack API](https://api.slack.com/apps) にアクセス
2. 「Create New App」をクリック
3. 「From scratch」を選択
4. App Name: `RSS Notifier` (任意)
5. ワークスペースを選択して「Create App」

### 3-2. Incoming Webhook の有効化

1. 左メニューから「Incoming Webhooks」を選択
2. 「Activate Incoming Webhooks」をオンにする
3. 「Add New Webhook to Workspace」をクリック
4. 通知先チャンネルを選択（例: `#news`, `#rss-feeds`）
5. 「許可する」をクリック

### 3-3. Webhook URL をコピー

表示されたWebhook URL（`https://hooks.slack.com/services/...`）をコピーして保存します。

## ステップ4: OpenAI API Key の取得

### 4-1. OpenAI アカウントの作成

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. 「Sign up」でアカウントを作成（既存アカウントがある場合はログイン）

### 4-2. API Key の生成

1. ダッシュボード → 左メニュー「API keys」を選択
2. 「Create new secret key」をクリック
3. Key名を入力（例: `gas-rss-notifier`）
4. 「Create secret key」をクリック
5. 表示されたAPI Key（`sk-...`）をコピーして安全に保存
   - ⚠️ この画面を閉じると二度と表示されません

### 4-3. 課金設定（必要に応じて）

- OpenAI APIは従量課金制です
- 新規アカウントには無料クレジットが付与される場合があります
- Billing → Payment methods で支払い方法を設定

**推奨モデルの料金（2024年時点）**:
- `gpt-4o-mini`: 入力 $0.15 / 1M tokens、出力 $0.60 / 1M tokens（最安）
- `gpt-4o`: 入力 $2.50 / 1M tokens、出力 $10.00 / 1M tokens

## ステップ5: コードのデプロイ

### 5-1. コードをGASにプッシュ

```bash
clasp push
```

TypeScriptコードがトランスパイルされ、GASプロジェクトにアップロードされます。

### 5-2. GASエディタを開く

```bash
clasp open
```

ブラウザでGASエディタが開きます。

## ステップ6: 初期設定の実行

### 6-1. setupInitial 関数の実行

GASエディタで：

1. 関数選択ドロップダウンから `setupInitial` を選択
2. 「実行」ボタンをクリック
3. 初回実行時、権限の承認が求められます：
   - 「権限を確認」をクリック
   - Googleアカウントを選択
   - 「詳細」→「(プロジェクト名)に移動」をクリック
   - 「許可」をクリック

### 6-2. 実行結果の確認

実行ログに以下のようなメッセージが表示されます：

```
初期セットアップを開始します...
設定シートが作成されました
スプレッドシートIDをメモしてください: XXXXX...
```

## ステップ7: スクリプトプロパティの設定（機密情報）

セキュリティのため、APIキーやWebhook URLはスプレッドシートではなく、GASのスクリプトプロパティに保存します。

### 7-1. GASエディタでスクリプトプロパティを設定（推奨）

1. GASエディタを開く（`clasp open`または手動で開く）
2. 左メニューの「⚙️ プロジェクトの設定」をクリック
3. 下にスクロールして「スクリプト プロパティ」セクションを表示
4. 「スクリプト プロパティを追加」をクリック
5. 以下の3つのプロパティを追加：

| プロパティ | 値 |
|-----------|-----|
| `SLACK_WEBHOOK_URL` | `https://hooks.slack.com/services/...` （ステップ3で取得） |
| `ERROR_SLACK_WEBHOOK_URL` | （省略可）エラー通知用のWebhook URL |
| `OPENAI_API_KEY` | `sk-...` （ステップ4で取得） |

6. 「スクリプト プロパティを保存」をクリック

### 7-2. claspコマンドで設定（代替方法）

ターミナルから以下のコマンドを実行：

```bash
# Slack Webhook URL を設定
clasp setting scriptProperty SLACK_WEBHOOK_URL "https://hooks.slack.com/services/YOUR_WEBHOOK_URL"

# エラー通知用Webhook URL を設定（省略可）
clasp setting scriptProperty ERROR_SLACK_WEBHOOK_URL "https://hooks.slack.com/services/YOUR_ERROR_WEBHOOK_URL"

# OpenAI API Key を設定
clasp setting scriptProperty OPENAI_API_KEY "sk-YOUR_OPENAI_API_KEY"
```

**重要事項**:
- ⚠️ これらの値は絶対にGitにコミットしないでください
- ⚠️ スクリプトプロパティは暗号化されて保存されます
- ⚠️ スプレッドシートには表示されません（セキュリティ向上）

## ステップ8: スプレッドシートでの設定

### 8-1. スプレッドシートを開く

GASエディタから、またはGoogle Driveからスプレッドシートを開きます。

### 8-2. 「設定」シートで設定を編集

以下の設定を入力します：

| 設定キー | 設定する値 | 備考 |
|---------|----------|------|
| RSS_FEED_URL | `https://www.socialmediatoday.com/feeds/news/` | またはお好みのRSS URL |
| FILTER_KEYWORDS | `social media,marketing,\bX\b,instagram` | 関連キーワードをカンマ区切りで（詳細は下記参照） |
| MAX_ARTICLE_AGE_DAYS | `7` | 過去何日分の記事を取得するか |
| SUMMARY_ENABLED | `true` | 要約機能を使うか |
| SUMMARY_TYPE | `openai` | 要約タイプ（`openai`または`simple`） |
| OPENAI_MODEL | `gpt-4o-mini` | 使用するモデル（`gpt-4o-mini`, `gpt-4o`等） |

**注意**: `SLACK_WEBHOOK_URL`、`ERROR_SLACK_WEBHOOK_URL`、`OPENAI_API_KEY`は、スプレッドシートには設定せず、ステップ7で設定したスクリプトプロパティから読み取られます。

**フィルタキーワードの設定方法**:
- **通常のキーワード**: 部分一致で検索されます
  - 例: `instagram` → "Instagram features"や"#instagram"などにマッチ
- **単語境界マッチング**: `\b`で囲むと独立した単語のみマッチします
  - 例: `\bX\b` → "X platform"や"on X"にはマッチしますが、"Experience"や"Explore"にはマッチしません
  - SNSの"X"（旧Twitter）を検索する際に便利です

**設定例**:
```
FILTER_KEYWORDS: social media,marketing,\bX\b,instagram,facebook,tiktok
```

**エラー通知チャネルについて**:
- `ERROR_SLACK_WEBHOOK_URL`を設定すると、システムエラーを別チャネルに通知できます
- 省略した場合は、Slackへのエラー通知は送信されません（ログのみに記録）
- エラー通知には、エラーメッセージ、発生時刻、スタックトレースが含まれます

**要約タイプについて**:
- `openai`: OpenAI APIを使ったSNS運営視点の要約（推奨）
- `simple`: ルールベースの簡易要約（APIキー不要）

## ステップ9: 動作テスト

### 9-1. RSS取得テスト

GASエディタで `testFetchRSS` 関数を実行：

```
RSS取得テストを開始します...
15件の記事を取得しました:
1. [Article Title 1]
   公開日: [Date]
   リンク: [URL]
...
```

### 9-2. フィルタテスト

GASエディタで `testFilter` 関数を実行：

```
フィルタテストを開始します...
元の記事数: 15
フィルタ後: 8
フィルタキーワード: social media,marketing,instagram
```

### 9-3. 本番実行テスト

GASエディタで `main` 関数を実行：

```
RSS通知処理を開始します...
RSSフィードから記事を取得中...
15件の記事を取得しました
記事をスプレッドシートに保存中...
...
Slackに通知中...
RSS通知処理が正常に完了しました
```

Slackの指定チャンネルに通知が届いているか確認してください。

## ステップ10: 定期実行の設定

### 10-1. トリガーの追加

GASエディタで：

1. 左メニューの時計アイコン（トリガー）をクリック
2. 右下の「トリガーを追加」ボタンをクリック
3. 以下のように設定：
   - 実行する関数を選択: `main`
   - 実行するデプロイを選択: `Head`
   - イベントのソースを選択: `時間主導型`
   - 時間ベースのトリガーのタイプを選択: `日付ベースのタイマー`
   - 時刻を選択: `午前9時～10時` （お好みで調整）
4. 「保存」をクリック

### 10-2. トリガーの確認

設定したトリガーが一覧に表示されます。翌日の指定時刻に自動実行されます。

## ステップ11: 運用開始

これで設定は完了です。以下のポイントを確認してください：

### 記事の確認

スプレッドシートの「記事一覧」シートで：
- 取得された記事一覧
- 通知済みフラグ
- 通知日時
- 要約

### Slack通知の確認

指定したSlackチャンネルで：
- 記事タイトルとリンク
- 公開日時
- 要約文
- 実行サマリー

### 設定の調整

必要に応じて「設定」シートで：
- フィルタキーワードの追加・削除
- RSS URLの変更
- 記事取得期間の調整

## トラブルシューティング

### 問題: 「権限がありません」エラー

**解決策**:
1. GASエディタで再度関数を実行
2. 権限の承認を完了する
3. Google アカウントの2段階認証を確認

### 問題: Slack通知が届かない

**解決策**:
1. Webhook URLが正しいか確認
2. Slackのチャンネルが存在するか確認
3. GASの実行ログでエラーを確認

### 問題: RSS取得エラー

**解決策**:
1. RSS URLが正しいか確認
2. RSSフィードが有効か確認（ブラウザで開けるか）
3. GASの外部API制限を確認

### 問題: 記事がフィルタされすぎる

**解決策**:
1. フィルタキーワードを減らす
2. MAX_ARTICLE_AGE_DAYSを増やす
3. testFilter()で結果を確認しながら調整

## 次のステップ

- フィルタキーワードを最適化して関連記事のみを通知
- 複数のRSSフィードを追加（コードの拡張が必要）
- LLM APIを使った高度な要約機能の実装
- AWS Lambda版への移植を検討

## サポート

問題が解決しない場合は、GitHubのIssuesで報告してください。
