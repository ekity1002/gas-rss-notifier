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
  summary?: string;      // 要約
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

  // 要約設定
  summaryEnabled: boolean;
  summaryMaxLength: number;
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
