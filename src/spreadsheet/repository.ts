import { RSSArticle, ArticleRecord } from '../types';

/**
 * スプレッドシート記事リポジトリ
 * 記事の保存・取得・重複管理を行う
 */
export class ArticleRepository {
  private spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet;
  private sheet: GoogleAppsScript.Spreadsheet.Sheet;
  private readonly headers = [
    '記事ID',
    'タイトル',
    'リンク',
    '公開日時',
    '説明文',
    '通知済み',
    '通知日時',
    '要約',
  ];

  constructor(spreadsheet: GoogleAppsScript.Spreadsheet.Spreadsheet, sheetName: string) {
    this.spreadsheet = spreadsheet;
    this.sheet = this.getOrCreateSheet(sheetName);
  }

  /**
   * シートを取得または作成
   */
  private getOrCreateSheet(sheetName: string): GoogleAppsScript.Spreadsheet.Sheet {
    let sheet = this.spreadsheet.getSheetByName(sheetName);

    if (!sheet) {
      sheet = this.spreadsheet.insertSheet(sheetName);
      this.initializeSheet(sheet);
    }

    return sheet;
  }

  /**
   * シートを初期化（ヘッダー行を作成）
   */
  private initializeSheet(sheet: GoogleAppsScript.Spreadsheet.Sheet): void {
    const headerRange = sheet.getRange(1, 1, 1, this.headers.length);
    headerRange.setValues([this.headers]);
    headerRange.setFontWeight('bold');
    headerRange.setBackground('#f0f0f0');

    // 列幅を調整
    sheet.setColumnWidth(1, 150); // 記事ID
    sheet.setColumnWidth(2, 300); // タイトル
    sheet.setColumnWidth(3, 200); // リンク
    sheet.setColumnWidth(4, 150); // 公開日時
    sheet.setColumnWidth(5, 350); // 説明文
    sheet.setColumnWidth(6, 80);  // 通知済み
    sheet.setColumnWidth(7, 150); // 通知日時
    sheet.setColumnWidth(8, 350); // 要約

    // 固定行を設定
    sheet.setFrozenRows(1);
  }

  /**
   * 既存の記事IDを全て取得
   */
  public getExistingArticleIds(): Set<string> {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) {
      return new Set<string>();
    }

    const ids = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();
    return new Set(ids.map(row => String(row[0])).filter(id => id));
  }

  /**
   * 新しい記事を保存
   */
  public saveArticles(articles: RSSArticle[]): void {
    if (articles.length === 0) {
      return;
    }

    const existingIds = this.getExistingArticleIds();
    const newArticles = articles.filter(article => !existingIds.has(article.id));

    if (newArticles.length === 0) {
      console.log('新しい記事はありません');
      return;
    }

    const rows = newArticles.map(article => [
      article.id,
      article.title,
      article.link,
      article.pubDate,
      article.description,
      false, // 通知済みフラグ
      '',    // 通知日時
      '',    // 要約
    ]);

    const lastRow = this.sheet.getLastRow();
    this.sheet.getRange(lastRow + 1, 1, rows.length, this.headers.length).setValues(rows);

    console.log(`${newArticles.length}件の新しい記事を保存しました`);
  }

  /**
   * 未通知の記事を取得
   */
  public getUnnotifiedArticles(): ArticleRecord[] {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) {
      return [];
    }

    const data = this.sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
    const articles: ArticleRecord[] = [];

    for (const row of data) {
      const notified = row[5];
      if (!notified) {
        articles.push({
          id: String(row[0]),
          title: String(row[1]),
          link: String(row[2]),
          pubDate: new Date(row[3]),
          description: String(row[4]),
          notified: false,
          summary: row[7] ? String(row[7]) : undefined,
        });
      }
    }

    return articles;
  }

  /**
   * 記事を通知済みにマーク
   */
  public markAsNotified(articleIds: string[]): void {
    if (articleIds.length === 0) {
      return;
    }

    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) {
      return;
    }

    const data = this.sheet.getRange(2, 1, lastRow - 1, this.headers.length).getValues();
    const now = new Date();
    let updateCount = 0;

    for (let i = 0; i < data.length; i++) {
      const articleId = String(data[i][0]);
      if (articleIds.includes(articleId)) {
        const rowIndex = i + 2; // ヘッダー行が1行目なので+2
        this.sheet.getRange(rowIndex, 6).setValue(true);  // 通知済みフラグ
        this.sheet.getRange(rowIndex, 7).setValue(now);   // 通知日時
        updateCount++;
      }
    }

    console.log(`${updateCount}件の記事を通知済みにマークしました`);
  }

  /**
   * 記事の要約を保存
   */
  public saveSummary(articleId: string, summary: string): void {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) {
      return;
    }

    const ids = this.sheet.getRange(2, 1, lastRow - 1, 1).getValues();

    for (let i = 0; i < ids.length; i++) {
      if (String(ids[i][0]) === articleId) {
        const rowIndex = i + 2;
        this.sheet.getRange(rowIndex, 8).setValue(summary);
        return;
      }
    }
  }

  /**
   * 全記事数を取得
   */
  public getTotalArticleCount(): number {
    const lastRow = this.sheet.getLastRow();
    return Math.max(0, lastRow - 1);
  }

  /**
   * 通知済み記事数を取得
   */
  public getNotifiedArticleCount(): number {
    const lastRow = this.sheet.getLastRow();
    if (lastRow <= 1) {
      return 0;
    }

    const notifiedFlags = this.sheet.getRange(2, 6, lastRow - 1, 1).getValues();
    return notifiedFlags.filter(row => row[0] === true).length;
  }
}
