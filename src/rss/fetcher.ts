import { RSSArticle } from '../types';

/**
 * RSSフィード取得クラス
 * GAS固有のAPIから分離して、将来的にAWS移植しやすいように設計
 */
export class RSSFetcher {
  /**
   * RSSフィードから記事を取得
   * @param feedUrl RSSフィードのURL
   * @returns 記事の配列
   */
  public fetchArticles(feedUrl: string): RSSArticle[] {
    try {
      const xmlContent = this.fetchXmlContent(feedUrl);
      return this.parseRssFeed(xmlContent);
    } catch (error) {
      console.error('RSS取得エラー:', error);
      throw new Error(`RSSフィードの取得に失敗しました: ${error}`);
    }
  }

  /**
   * URLからXMLコンテンツを取得（GAS依存）
   */
  private fetchXmlContent(url: string): string {
    const response = UrlFetchApp.fetch(url);
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      throw new Error(`HTTP ${statusCode}: RSSフィードの取得に失敗しました`);
    }

    return response.getContentText();
  }

  /**
   * XMLからRSS記事をパース（GAS依存）
   */
  private parseRssFeed(xmlContent: string): RSSArticle[] {
    const document = XmlService.parse(xmlContent);
    const root = document.getRootElement();
    const articles: RSSArticle[] = [];

    // RSSの名前空間を取得
    const namespaces = this.getNamespaces(root);

    // channelを取得
    const channel = root.getChild('channel');
    if (!channel) {
      throw new Error('RSSフィードの形式が不正です: channelが見つかりません');
    }

    // itemを取得
    const items = channel.getChildren('item');

    for (const item of items) {
      try {
        const article = this.parseItem(item, namespaces);
        articles.push(article);
      } catch (error) {
        console.warn('記事のパースに失敗:', error);
        // 個別の記事のエラーはスキップして続行
      }
    }

    return articles;
  }

  /**
   * itemから記事情報を抽出
   */
  private parseItem(item: GoogleAppsScript.XML_Service.Element, namespaces: any): RSSArticle {
    const title = this.getElementText(item, 'title') || '(タイトルなし)';
    const link = this.getElementText(item, 'link') || '';
    const guid = this.getElementText(item, 'guid') || link;
    const description = this.getElementText(item, 'description') || '';
    const pubDateStr = this.getElementText(item, 'pubDate') || '';

    // 公開日時をパース
    let pubDate: Date;
    try {
      pubDate = pubDateStr ? new Date(pubDateStr) : new Date();
    } catch (error) {
      console.warn('日付のパースに失敗:', pubDateStr);
      pubDate = new Date();
    }

    return {
      id: guid,
      title: title,
      link: link,
      pubDate: pubDate,
      description: this.stripHtmlTags(description),
    };
  }

  /**
   * 要素からテキストを取得
   */
  private getElementText(element: GoogleAppsScript.XML_Service.Element, tagName: string): string {
    const child = element.getChild(tagName);
    return child ? child.getText() : '';
  }

  /**
   * 名前空間を取得
   */
  private getNamespaces(root: GoogleAppsScript.XML_Service.Element): any {
    const namespaces: any = {};
    try {
      const namespace = root.getNamespace();
      if (namespace) {
        namespaces.default = namespace;
      }
    } catch (error) {
      // 名前空間が存在しない場合はスキップ
    }
    return namespaces;
  }

  /**
   * HTMLタグを除去
   */
  private stripHtmlTags(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .trim();
  }
}
