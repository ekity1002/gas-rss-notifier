import { TestRunner } from './test-framework';
import { SimpleSummarizer } from '../summarizer/summarizer';
import { RSSArticle } from '../types';

/**
 * SimpleSummarizer のテスト
 */
export function testSimpleSummarizer(): void {
  const runner = new TestRunner();

  runner.describe('SimpleSummarizer', () => {
    // テスト1: 短い説明文はそのまま返す
    runner.it('should return short description as-is', () => {
      const summarizer = new SimpleSummarizer();
      const article: RSSArticle = {
        id: '1',
        title: 'Test Article',
        link: 'https://example.com/1',
        pubDate: new Date(),
        description: 'This is a short description.',
      };

      const summary = summarizer.summarize(article, 200);

      runner.assertEqual(
        summary,
        'This is a short description.',
        '短い説明文はそのまま返すべき'
      );
    });

    // テスト2: 長い説明文を切り詰める
    runner.it('should truncate long description', () => {
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

      runner.assertTrue(
        summary.length <= 104, // 100 + '...'
        '要約は最大長以下であるべき'
      );
      runner.assertTrue(
        summary.includes('...') || summary.endsWith('.'),
        '要約は省略記号または句点で終わるべき'
      );
    });

    // テスト3: 改行と連続スペースを整理
    runner.it('should clean up newlines and multiple spaces', () => {
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

      runner.assertFalse(
        summary.includes('\n'),
        '改行が除去されているべき'
      );
      runner.assertFalse(
        summary.includes('  '),
        '連続スペースが1つのスペースになっているべき'
      );
    });

    // テスト4: 複数記事の一括要約
    runner.it('should summarize multiple articles in batch', () => {
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

      runner.assertLength(
        Array.from(summaries.keys()),
        3,
        '3件の要約が生成されるべき'
      );
      runner.assertTrue(
        summaries.has('1'),
        '記事1の要約が含まれるべき'
      );
      runner.assertTrue(
        summaries.has('2'),
        '記事2の要約が含まれるべき'
      );
      runner.assertTrue(
        summaries.has('3'),
        '記事3の要約が含まれるべき'
      );
    });

    // テスト5: 空の説明文
    runner.it('should handle empty description', () => {
      const summarizer = new SimpleSummarizer();
      const article: RSSArticle = {
        id: '1',
        title: 'Test Article',
        link: 'https://example.com/1',
        pubDate: new Date(),
        description: '',
      };

      const summary = summarizer.summarize(article, 200);

      runner.assertEqual(summary, '', '空の説明文は空文字列を返すべき');
    });

    // テスト6: 日本語の文章を適切に切り詰める
    runner.it('should truncate Japanese text properly', () => {
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

      runner.assertTrue(
        summary.length <= 54, // 50 + '...'
        '日本語の要約も最大長以下であるべき'
      );
    });
  });
}
