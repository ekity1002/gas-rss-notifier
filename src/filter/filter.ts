import { RSSArticle, ArticleRecord, FilterCriteria } from '../types';

/**
 * 記事フィルタクラス
 * キーワードや公開日時でフィルタリング
 */
export class ArticleFilter {
  /**
   * 記事をフィルタリング
   */
  public filterArticles(articles: RSSArticle[] | ArticleRecord[], criteria: FilterCriteria): (RSSArticle | ArticleRecord)[] {
    let filtered = articles;

    // キーワードフィルタ
    if (criteria.keywords && criteria.keywords.length > 0) {
      filtered = this.filterByKeywords(filtered, criteria.keywords);
    }

    // 公開日フィルタ
    if (criteria.maxAgeDays > 0) {
      filtered = this.filterByDate(filtered, criteria.maxAgeDays);
    }

    return filtered;
  }

  /**
   * キーワードでフィルタリング
   */
  private filterByKeywords(articles: (RSSArticle | ArticleRecord)[], keywords: string[]): (RSSArticle | ArticleRecord)[] {
    if (keywords.length === 0) {
      return articles;
    }

    // キーワードを小文字に変換
    const lowerKeywords = keywords.map(k => k.toLowerCase().trim());

    return articles.filter(article => {
      const searchText = `${article.title} ${article.description}`.toLowerCase();

      // いずれかのキーワードにマッチすればOK
      return lowerKeywords.some(keyword => {
        if (keyword.includes(' ')) {
          // スペースを含むキーワードはフレーズマッチ
          return searchText.includes(keyword);
        } else {
          // 単語としてマッチ（部分一致）
          return searchText.includes(keyword);
        }
      });
    });
  }

  /**
   * 公開日でフィルタリング
   */
  private filterByDate(articles: (RSSArticle | ArticleRecord)[], maxAgeDays: number): (RSSArticle | ArticleRecord)[] {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - maxAgeDays * 24 * 60 * 60 * 1000);

    return articles.filter(article => {
      const pubDate = article.pubDate instanceof Date ? article.pubDate : new Date(article.pubDate);
      return pubDate >= cutoffDate;
    });
  }

  /**
   * フィルタ結果のサマリーを取得
   */
  public getFilterSummary(originalCount: number, filteredCount: number, criteria: FilterCriteria): string {
    const lines: string[] = [];
    lines.push(`記事フィルタリング結果: ${originalCount}件 → ${filteredCount}件`);

    if (criteria.keywords && criteria.keywords.length > 0) {
      lines.push(`キーワード: ${criteria.keywords.join(', ')}`);
    }

    if (criteria.maxAgeDays > 0) {
      lines.push(`期間: 過去${criteria.maxAgeDays}日以内`);
    }

    return lines.join('\n');
  }
}
