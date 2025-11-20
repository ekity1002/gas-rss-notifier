import { describe, it, expect } from 'vitest';
import { ArticleFilter } from '../src/filter/filter';
import type { RSSArticle } from '../src/types';

describe('ArticleFilter', () => {
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

  describe('filterArticles', () => {
    it('should filter articles by keywords', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['instagram', 'facebook', 'tiktok'];

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 0, // 日付フィルタなし
      });

      expect(filtered).toHaveLength(3);
      expect(filtered.map(a => a.id)).toContain('1');
      expect(filtered.map(a => a.id)).toContain('2');
      expect(filtered.map(a => a.id)).toContain('4');
    });

    it('should filter articles by date', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();

      const filtered = filter.filterArticles(articles, {
        keywords: [],
        maxAgeDays: 7,
      });

      expect(filtered).toHaveLength(4);
      expect(filtered.some(a => a.id === '5')).toBe(false);
    });

    it('should filter articles by both keywords and date', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['marketing'];

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 3,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should return all articles when keywords are empty', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();

      const filtered = filter.filterArticles(articles, {
        keywords: [],
        maxAgeDays: 0,
      });

      expect(filtered).toHaveLength(articles.length);
    });

    it('should return empty array when no articles match keywords', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['nonexistent', 'keyword'];

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 0,
      });

      expect(filtered).toHaveLength(0);
    });

    it('should be case-insensitive for keyword matching', () => {
      const filter = new ArticleFilter();
      const articles = createTestArticles();
      const keywords = ['INSTAGRAM']; // 大文字

      const filtered = filter.filterArticles(articles, {
        keywords,
        maxAgeDays: 0,
      });

      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });

    it('should support word boundary matching with \\b notation', () => {
      const filter = new ArticleFilter();
      const now = new Date();
      const articles: RSSArticle[] = [
        {
          id: '1',
          title: 'X platform updates features',
          link: 'https://example.com/1',
          pubDate: now,
          description: 'The X social network announced new features.',
        },
        {
          id: '2',
          title: 'Experience the new design',
          link: 'https://example.com/2',
          pubDate: now,
          description: 'Users can experience new features on the platform.',
        },
        {
          id: '3',
          title: 'Explore marketing tools',
          link: 'https://example.com/3',
          pubDate: now,
          description: 'Explore new marketing tools for your business.',
        },
        {
          id: '4',
          title: 'Post on X gets viral',
          link: 'https://example.com/4',
          pubDate: now,
          description: 'A post on X went viral yesterday.',
        },
      ];

      // \\bX\\b で単語境界マッチング
      const filtered = filter.filterArticles(articles, {
        keywords: ['\\bX\\b'],
        maxAgeDays: 0,
      });

      // "X"が独立した単語として現れる記事のみマッチ
      expect(filtered).toHaveLength(2);
      expect(filtered.map(a => a.id)).toContain('1'); // "X platform"
      expect(filtered.map(a => a.id)).toContain('4'); // "on X"
      expect(filtered.map(a => a.id)).not.toContain('2'); // "Experience"
      expect(filtered.map(a => a.id)).not.toContain('3'); // "Explore"
    });

    it('should match X without word boundary as partial match', () => {
      const filter = new ArticleFilter();
      const now = new Date();
      const articles: RSSArticle[] = [
        {
          id: '1',
          title: 'Experience the platform',
          link: 'https://example.com/1',
          pubDate: now,
          description: 'Experience new features.',
        },
        {
          id: '2',
          title: 'Post on X',
          link: 'https://example.com/2',
          pubDate: now,
          description: 'A viral post.',
        },
      ];

      // 通常の"x"は部分一致（experienceにもマッチ）
      const filtered = filter.filterArticles(articles, {
        keywords: ['x'],
        maxAgeDays: 0,
      });

      expect(filtered).toHaveLength(2); // 両方マッチ
    });

    it('should support multiple keywords with mixed word boundary matching', () => {
      const filter = new ArticleFilter();
      const now = new Date();
      const articles: RSSArticle[] = [
        {
          id: '1',
          title: 'X and Instagram update',
          link: 'https://example.com/1',
          pubDate: now,
          description: 'Both X and Instagram released updates.',
        },
        {
          id: '2',
          title: 'Experience Instagram features',
          link: 'https://example.com/2',
          pubDate: now,
          description: 'Try Instagram new features.',
        },
        {
          id: '3',
          title: 'Facebook news',
          link: 'https://example.com/3',
          pubDate: now,
          description: 'Facebook announces changes.',
        },
      ];

      // \\bX\\bとinstagramを組み合わせ
      const filtered = filter.filterArticles(articles, {
        keywords: ['\\bX\\b', 'instagram'],
        maxAgeDays: 0,
      });

      expect(filtered).toHaveLength(2);
      expect(filtered.map(a => a.id)).toContain('1'); // X and Instagram
      expect(filtered.map(a => a.id)).toContain('2'); // Instagram
      expect(filtered.map(a => a.id)).not.toContain('3'); // Facebook
    });
  });

  describe('getFilterSummary', () => {
    it('should generate summary message', () => {
      const filter = new ArticleFilter();
      const summary = filter.getFilterSummary(10, 5, {
        keywords: ['test', 'keyword'],
        maxAgeDays: 7,
      });

      expect(summary).toContain('10件');
      expect(summary).toContain('5件');
      expect(summary).toContain('test, keyword');
      expect(summary).toContain('過去7日以内');
    });
  });
});
