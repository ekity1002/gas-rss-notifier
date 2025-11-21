/**
 * RSS記事の型定義
 */
export interface RSSArticle {
  id: string;           // guid または link
  title: string;        // 記事タイトル
  link: string;         // 記事URL
  pubDate: Date;        // 公開日時
  description: string;  // 説明文
}

/**
 * スプレッドシートに保存する記事データ
 */
export interface ArticleRecord extends RSSArticle {
  notified: boolean;     // 通知済みフラグ
  notifiedAt?: Date;     // 通知日時
  summary?: string;      // 要約（後方互換性のため保持）
  structuredSummary?: ArticleSummaryStructured;  // 構造化要約
}

/**
 * アプリケーション設定
 */
export interface AppConfig {
  // RSS設定
  rssFeedUrl: string;

  // スプレッドシート設定
  spreadsheetId: string;
  sheetName: string;

  // フィルタ設定
  filterKeywords: string[];
  maxArticleAgeDays: number;

  // Slack設定
  slackWebhookUrl: string;
  errorSlackWebhookUrl: string;  // エラー通知用（オプション）

  // 要約設定
  summaryEnabled: boolean;
  summaryMaxLength: number;
  summaryType: 'simple' | 'openai';

  // OpenAI設定
  openaiApiKey: string;
  openaiModel: string;
  openaiReasoningEffort: string;  // 推論レベル（none, minimal, low, medium, high）
}

/**
 * フィルタ条件
 */
export interface FilterCriteria {
  keywords: string[];
  maxAgeDays: number;
}

/**
 * Slack通知メッセージ
 */
export interface SlackMessage {
  text: string;
  blocks?: any[];
}

/**
 * Structured Output: 記事要約の構造化データ
 */
export interface ArticleSummaryStructured {
  summary: {
    keyPoints: string[];  // 記事の重要なポイントを箇条書きで
  };
  newsPoints: {
    points: string[];    // 各役職の観点から見たニュースのポイントを箇条書きで
  };
}
