import { AppConfig } from './types';

/**
 * 設定管理クラス
 * スプレッドシートの「設定」シートから設定を読み込む
 */
export class ConfigManager {
  private config: AppConfig | null = null;
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;

  constructor(spreadsheetId?: string) {
    if (spreadsheetId) {
      this.spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    } else {
      // スプレッドシートIDが指定されていない場合は、アクティブなスプレッドシートを使用
      const activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
      if (!activeSpreadsheet) {
        throw new Error('スプレッドシートが見つかりません。spreadsheetIdを指定するか、スプレッドシートにバインドされたスクリプトから実行してください。');
      }
      this.spreadsheet = activeSpreadsheet;
    }
  }

  /**
   * 設定を読み込む
   */
  public loadConfig(): AppConfig {
    if (this.config) {
      return this.config;
    }

    const configSheet = this.getOrCreateConfigSheet();
    const data = configSheet.getDataRange().getValues();

    const configMap: { [key: string]: string } = {};
    for (let i = 1; i < data.length; i++) {
      const key = data[i][0];
      const value = data[i][1];
      if (key && value !== undefined && value !== null) {
        configMap[key] = String(value);
      }
    }

    this.config = {
      rssFeedUrl: configMap['RSS_FEED_URL'] || 'https://www.socialmediatoday.com/feeds/news/',
      spreadsheetId: this.spreadsheet.getId(),
      sheetName: configMap['SHEET_NAME'] || '記事一覧',
      filterKeywords: configMap['FILTER_KEYWORDS'] ? configMap['FILTER_KEYWORDS'].split(',').map(k => k.trim()) : [],
      maxArticleAgeDays: parseInt(configMap['MAX_ARTICLE_AGE_DAYS'] || '7', 10),
      slackWebhookUrl: configMap['SLACK_WEBHOOK_URL'] || '',
      summaryEnabled: configMap['SUMMARY_ENABLED'] === 'true',
      summaryMaxLength: parseInt(configMap['SUMMARY_MAX_LENGTH'] || '200', 10),
    };

    return this.config;
  }

  /**
   * 設定シートを取得または作成
   */
  private getOrCreateConfigSheet(): GoogleAppsScript.Spreadsheet.Sheet {
    let configSheet = this.spreadsheet.getSheetByName('設定');

    if (!configSheet) {
      configSheet = this.spreadsheet.insertSheet('設定');
      this.initializeConfigSheet(configSheet);
    }

    return configSheet;
  }

  /**
   * 設定シートを初期化
   */
  private initializeConfigSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    const headers = [['設定キー', '設定値', '説明']];
    const defaultConfig = [
      ['RSS_FEED_URL', 'https://www.socialmediatoday.com/feeds/news/', 'RSSフィードのURL'],
      ['SHEET_NAME', '記事一覧', '記事を保存するシート名'],
      ['FILTER_KEYWORDS', 'social media,marketing,instagram,facebook,twitter,tiktok', 'フィルタリングキーワード（カンマ区切り）'],
      ['MAX_ARTICLE_AGE_DAYS', '7', '取得する記事の最大経過日数'],
      ['SLACK_WEBHOOK_URL', '', 'SlackのIncoming Webhook URL'],
      ['SUMMARY_ENABLED', 'true', '要約機能の有効化（true/false）'],
      ['SUMMARY_MAX_LENGTH', '200', '要約の最大文字数'],
    ];

    sheet.getRange(1, 1, 1, 3).setValues(headers);
    sheet.getRange(2, 1, defaultConfig.length, 3).setValues(defaultConfig);

    // ヘッダー行を太字にする
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold');

    // 列幅を調整
    sheet.setColumnWidth(1, 200);
    sheet.setColumnWidth(2, 300);
    sheet.setColumnWidth(3, 350);
  }

  /**
   * スプレッドシートIDを取得
   */
  public getSpreadsheetId(): string {
    return this.spreadsheet.getId();
  }

  /**
   * スプレッドシートを取得
   */
  public getSpreadsheet(): GoogleAppsScript.Spreadsheet.Spreadsheet {
    return this.spreadsheet;
  }
}
