import { describe, it, expect } from 'vitest';
import { SimpleSummarizer } from '../src/summarizer/summarizer';
import type { RSSArticle } from '../src/types';

describe('SimpleSummarizer', () => {
  describe('summarize', () => {
    it('should return short description as-is', () => {
      const summarizer = new SimpleSummarizer();
      const article: RSSArticle = {
        id: '1',
        title: 'Test Article',
        link: 'https://example.com/1',
        pubDate: new Date(),
        description: 'This is a short description.',
      };

      const summary = summarizer.summarize(article, 200);

      expect(summary).toBe('This is a short description.');
    });

    it('should truncate long description', () => {
      const summarizer = new SimpleSummarizer();
      const longDescription =
        'This is a very long description that exceeds the maximum length. ' +
        'It contains multiple sentences and should be truncated properly. ' +
        'The summarizer should handle this gracefully and add ellipsis at the end. ' +
        'This is more text to make it even longer. ' +
        'And more text here as well.';

      const article: RSSArticle = {
        id: '1',
        title: 'Test Article',
        link: 'https://example.com/1',
        pubDate: new Date(),
        description: longDescription,
      };

      const summary = summarizer.summarize(article, 100);

      expect(summary.length).toBeLessThanOrEqual(104); // 100 + '...'
      expect(summary.includes('...') || summary.endsWith('.')).toBe(true);
    });

    it('should clean up newlines and multiple spaces', () => {
      const summarizer = new SimpleSummarizer();
      const messyDescription = 'This  has   multiple   spaces.\n\nAnd newlines.\n\n\nLots of them.';

      const article: RSSArticle = {
        id: '1',
        title: 'Test Article',
        link: 'https://example.com/1',
        pubDate: new Date(),
        description: messyDescription,
      };

      const summary = summarizer.summarize(article, 200);

      expect(summary).not.toContain('\n');
      expect(summary).not.toContain('  ');
    });

    it('should handle empty description', () => {
      const summarizer = new SimpleSummarizer();
      const article: RSSArticle = {
        id: '1',
        title: 'Test Article',
        link: 'https://example.com/1',
        pubDate: new Date(),
        description: '',
      };

      const summary = summarizer.summarize(article, 200);

      expect(summary).toBe('');
    });

    it('should truncate Japanese text properly', () => {
      const summarizer = new SimpleSummarizer();
      const japaneseDescription =
        'これは日本語の長い説明文です。複数の文が含まれています。' +
        'この要約機能は日本語にも対応しています。' +
        'さらに多くのテキストがここに続きます。' +
        'もっと長い文章にするために追加のテキストを入れています。';

      const article: RSSArticle = {
        id: '1',
        title: 'Japanese Article',
        link: 'https://example.com/1',
        pubDate: new Date(),
        description: japaneseDescription,
      };

      const summary = summarizer.summarize(article, 50);

      expect(summary.length).toBeLessThanOrEqual(54); // 50 + '...'
    });
  });

  describe('summarizeBatch', () => {
    it('should summarize multiple articles in batch', () => {
      const summarizer = new SimpleSummarizer();
      const articles: RSSArticle[] = [
        {
          id: '1',
          title: 'Article 1',
          link: 'https://example.com/1',
          pubDate: new Date(),
          description: 'Description 1',
        },
        {
          id: '2',
          title: 'Article 2',
          link: 'https://example.com/2',
          pubDate: new Date(),
          description: 'Description 2',
        },
        {
          id: '3',
          title: 'Article 3',
          link: 'https://example.com/3',
          pubDate: new Date(),
          description: 'Description 3',
        },
      ];

      const summaries = summarizer.summarizeBatch(articles, 200);

      expect(summaries.size).toBe(3);
      expect(summaries.has('1')).toBe(true);
      expect(summaries.has('2')).toBe(true);
      expect(summaries.has('3')).toBe(true);
      expect(summaries.get('1')).toBe('Description 1');
      expect(summaries.get('2')).toBe('Description 2');
      expect(summaries.get('3')).toBe('Description 3');
    });
  });
});
