import { testArticleFilter } from './filter.test';
import { testSimpleSummarizer } from './summarizer.test';

/**
 * 全テストを実行
 */
function runAllTests(): void {
  console.log('====================================');
  console.log('テストを開始します...');
  console.log('====================================');

  const startTime = new Date().getTime();

  try {
    // フィルタのテスト
    testArticleFilter();

    // 要約のテスト
    testSimpleSummarizer();

    const endTime = new Date().getTime();
    const duration = ((endTime - startTime) / 1000).toFixed(2);

    console.log('\n====================================');
    console.log(`全てのテストが完了しました (${duration}秒)`);
    console.log('====================================');
  } catch (error) {
    console.error('\nテスト実行中にエラーが発生しました:', error);
    throw error;
  }
}

// GASのグローバル関数として公開
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(global as any).runAllTests = runAllTests;
