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

## ステップ4: コードのデプロイ

### 4-1. コードをGASにプッシュ

```bash
clasp push
```

TypeScriptコードがトランスパイルされ、GASプロジェクトにアップロードされます。

### 4-2. GASエディタを開く

```bash
clasp open
```

ブラウザでGASエディタが開きます。

## ステップ5: 初期設定の実行

### 5-1. setupInitial 関数の実行

GASエディタで：

1. 関数選択ドロップダウンから `setupInitial` を選択
2. 「実行」ボタンをクリック
3. 初回実行時、権限の承認が求められます：
   - 「権限を確認」をクリック
   - Googleアカウントを選択
   - 「詳細」→「(プロジェクト名)に移動」をクリック
   - 「許可」をクリック

### 5-2. 実行結果の確認

実行ログに以下のようなメッセージが表示されます：

```
初期セットアップを開始します...
設定シートが作成されました
スプレッドシートIDをメモしてください: XXXXX...
```

## ステップ6: スプレッドシートでの設定

### 6-1. スプレッドシートを開く

GASエディタから、またはGoogle Driveからスプレッドシートを開きます。

### 6-2. 「設定」シートで設定を編集

| 設定キー | 設定する値 | 備考 |
|---------|----------|------|
| SLACK_WEBHOOK_URL | `https://hooks.slack.com/services/...` | ステップ3で取得したURL |
| RSS_FEED_URL | `https://www.socialmediatoday.com/feeds/news/` | またはお好みのRSS URL |
| FILTER_KEYWORDS | `social media,marketing,instagram` | 関連キーワードをカンマ区切りで |
| MAX_ARTICLE_AGE_DAYS | `7` | 過去何日分の記事を取得するか |
| SUMMARY_ENABLED | `true` | 要約機能を使うか |

## ステップ7: 動作テスト

### 7-1. RSS取得テスト

GASエディタで `testFetchRSS` 関数を実行：

```
RSS取得テストを開始します...
15件の記事を取得しました:
1. [Article Title 1]
   公開日: [Date]
   リンク: [URL]
...
```

### 7-2. フィルタテスト

GASエディタで `testFilter` 関数を実行：

```
フィルタテストを開始します...
元の記事数: 15
フィルタ後: 8
フィルタキーワード: social media,marketing,instagram
```

### 7-3. 本番実行テスト

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

## ステップ8: 定期実行の設定

### 8-1. トリガーの追加

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

### 8-2. トリガーの確認

設定したトリガーが一覧に表示されます。翌日の指定時刻に自動実行されます。

## ステップ9: 運用開始

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
