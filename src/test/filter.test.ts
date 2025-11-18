import { TestRunner } from './test-framework';
import { ArticleFilter } from '../filter/filter';
import { RSSArticle } from '../types';

/**
 * ArticleFilter のテスト
 */
export function testArticleFilter(): void {
  const runner = new TestRunner();

  runner.describe('ArticleFilter', () => {
    // テスト用のサンプル記事
    const createTestArticles = (): RSSArticle[] => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      return [
        {
          id: '1',
          title: 'Instagram adds new features for social media marketing',
          link: 'https://example.com/1',
          pubDate: yesterday,
          description: 'Instagram announced new marketing tools for businesses.',
        },
        {
          id: '2',
          title: 'Facebook launches content protection',
          link: 'https://example.com/2',
          pubDate: yesterday,
          description: 'Facebook introduces new features to protect creator content.',
        },
        {
          id: '3',
          title: 'Weather forecast for tomorrow',
          link: 'https://example.com/3',
          pubDate: yesterday,
          description: 'Tomorrow will be sunny with a high of 25 degrees.',
        },
        {
          id: '4',
          title: 'TikTok holiday shopping guide',
          link: 'https://example.com/4',
          pubDate: weekAgo,
          description: 'TikTok shares tips for holiday shopping campaigns.',
        },
        {
          id: '5',
          title: 'Old marketing article from last month',
          link: 'https://example.com/5',
          pubDate: monthAgo,
          description: 'This article about marketing is too old.',
        },
      ];
    };

    // テスト1: キーワードフィルタリング
    runner.it('should filter articles by keywords', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['instagram', 'facebook', 'tiktok'];

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 0, // 日付フィルタなし
      });

      runner.assertLength(filtered, 3, 'キーワードに一致する3件の記事が残るべき');
      runner.assertIncludes(
        filtered.map(a => a.id),
        '1',
        'Instagram記事が含まれるべき'
      );
      runner.assertIncludes(
        filtered.map(a => a.id),
        '2',
        'Facebook記事が含まれるべき'
      );
      runner.assertIncludes(
        filtered.map(a => a.id),
        '4',
        'TikTok記事が含まれるべき'
      );
    });

    // テスト2: 日付フィルタリング
    runner.it('should filter articles by date', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();

      const filtered = filter.filterArticles(articles, {
        keywords: [],
        maxAgeDays: 7,
      });

      runner.assertLength(filtered, 4, '7日以内の記事4件が残るべき');
      runner.assertFalse(
        filtered.some(a => a.id === '5'),
        '30日前の記事は除外されるべき'
      );
    });

    // テスト3: キーワードと日付の複合フィルタ
    runner.it('should filter articles by both keywords and date', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['marketing'];

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 3,
      });

      runner.assertLength(filtered, 1, 'marketing かつ3日以内の記事1件が残るべき');
      runner.assertEqual(filtered[0].id, '1', 'Instagram記事のみが残るべき');
    });

    // テスト4: 空のキーワードリスト
    runner.it('should return all articles when keywords are empty', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();

      const filtered = filter.filterArticles(articles, {
        keywords: [],
        maxAgeDays: 0,
      });

      runner.assertLength(filtered, articles.length, '全ての記事が残るべき');
    });

    // テスト5: マッチしないキーワード
    runner.it('should return empty array when no articles match keywords', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['nonexistent', 'keyword'];

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 0,
      });

      runner.assertLength(filtered, 0, 'マッチする記事がないため空配列になるべき');
    });

    // テスト6: 大文字小文字の区別なし
    runner.it('should be case-insensitive for keyword matching', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['INSTAGRAM']; // 大文字

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 0,
      });

      runner.assertLength(filtered, 1, '大文字小文字を区別せずマッチするべき');
      runner.assertEqual(filtered[0].id, '1');
    });
  });
}
