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
