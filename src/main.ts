import { ConfigManager } from './config';
import { RSSFetcher } from './rss/fetcher';
import { ArticleRepository } from './spreadsheet/repository';
import { ArticleFilter } from './filter/filter';
import { SimpleSummarizer, LLMSummarizer, ISummarizer } from './summarizer/summarizer';
import { SlackNotifier } from './notification/slack';

/**
 * メイン実行関数
 * 時間トリガーまたは手動実行で呼び出される
 */
function main(): void {
  console.log('RSS通知処理を開始します...');

  try {
    // 1. 設定を読み込む
    const configManager = new ConfigManager();
    const config = configManager.loadConfig();

    console.log(`RSS Feed URL: ${config.rssFeedUrl}`);
    console.log(`Filter Keywords: ${config.filterKeywords.join(', ')}`);

    // 2. 各モジュールを初期化
    const rssFetcher = new RSSFetcher();
    const articleRepository = new ArticleRepository(
      configManager.getSpreadsheet(),
      config.sheetName
    );
    const articleFilter = new ArticleFilter();

    // 設定に応じて要約エンジンを選択
    let summarizer: ISummarizer;
    if (config.summaryType === 'openai' && config.openaiApiKey) {
      console.log(`要約エンジン: OpenAI (${config.openaiModel})`);
      summarizer = new LLMSummarizer(config.openaiApiKey, config.openaiModel);
    } else {
      if (config.summaryType === 'openai' && !config.openaiApiKey) {
        console.warn('OpenAI API Keyが設定されていません。SimpleSummarizerを使用します。');
      }
      console.log('要約エンジン: SimpleSummarizer');
      summarizer = new SimpleSummarizer();
    }

    const slackNotifier = new SlackNotifier(config.slackWebhookUrl);

    // Slack Webhook URLの検証
    if (!slackNotifier.validateWebhookUrl()) {
      throw new Error('Slack Webhook URLが正しく設定されていません');
    }

    // 3. RSSから記事を取得
    console.log('RSSフィードから記事を取得中...');
    const articles = rssFetcher.fetchArticles(config.rssFeedUrl);
    console.log(`${articles.length}件の記事を取得しました`);

    if (articles.length === 0) {
      console.log('取得できた記事がありません');
      return;
    }

    // 4. スプレッドシートに保存（重複チェック）
    console.log('記事をスプレッドシートに保存中...');
    articleRepository.saveArticles(articles);

    // 5. 未通知の記事を取得
    console.log('未通知の記事を取得中...');
    const unnotifiedArticles = articleRepository.getUnnotifiedArticles();
    console.log(`${unnotifiedArticles.length}件の未通知記事があります`);

    if (unnotifiedArticles.length === 0) {
      console.log('通知する記事がありません');
      return;
    }

    // 6. 記事をフィルタリング
    console.log('記事をフィルタリング中...');
    const filteredArticles = articleFilter.filterArticles(unnotifiedArticles, {
      keywords: config.filterKeywords,
      maxAgeDays: config.maxArticleAgeDays,
    });
    console.log(`${filteredArticles.length}件の記事がフィルタを通過しました`);

    if (filteredArticles.length === 0) {
      console.log('フィルタ条件に一致する記事がありません');
      return;
    }

    // 7. 要約を生成
    if (config.summaryEnabled) {
      console.log('記事の要約を生成中...');
      for (const article of filteredArticles) {
        const summary = summarizer.summarize(article, config.summaryMaxLength);
        article.summary = summary;
        articleRepository.saveSummary(article.id, summary);
      }
    }

    // 8. Slackに通知
    console.log('Slackに通知中...');
    slackNotifier.notifyArticles(filteredArticles);

    // 9. 記事を通知済みにマーク
    const notifiedIds = filteredArticles.map(a => a.id);
    articleRepository.markAsNotified(notifiedIds);

    console.log('RSS通知処理が正常に完了しました');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : '';

    console.error('エラーが発生しました:', errorMessage);
    if (errorStack) {
      console.error('スタックトレース:', errorStack);
    }

    // エラーをSlackに通知（エラー通知用Webhook URLが設定されている場合のみ）
    try {
      const configManager = new ConfigManager();
      const config = configManager.loadConfig();

      if (config.errorSlackWebhookUrl) {
        // エラー通知専用のWebhook URLを使用
        const errorNotifier = new SlackNotifier(config.errorSlackWebhookUrl);

        // 詳細なエラー情報を構築
        const detailedError = `**エラーメッセージ:**\n${errorMessage}\n\n**発生時刻:**\n${new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' })}${errorStack ? `\n\n**スタックトレース:**\n\`\`\`\n${errorStack.substring(0, 500)}\n\`\`\`` : ''}`;

        errorNotifier.sendErrorMessage(detailedError);
        console.log('エラー通知をSlackに送信しました');
      } else {
        console.log('エラー通知用Webhook URLが設定されていないため、Slack通知をスキップします');
      }
    } catch (notifyError) {
      console.error('エラー通知の送信に失敗しました:', notifyError);
    }

    throw error;
  }
}

/**
 * 初期セットアップ関数
 * 初回実行時に設定シートを作成する
 */
function setupInitial(): void {
  console.log('初期セットアップを開始します...');

  try {
    const configManager = new ConfigManager();
    const config = configManager.loadConfig();

    console.log('設定シートが作成されました');
    console.log('スプレッドシートIDをメモしてください:', config.spreadsheetId);
    console.log('次のステップ:');
    console.log('1. 設定シートでSlack Webhook URLを設定してください');
    console.log('2. 必要に応じてフィルタキーワードを調整してください');
    console.log('3. main()関数を実行して動作を確認してください');
    console.log('4. 問題なければ時間トリガーを設定してください');
  } catch (error) {
    console.error('初期セットアップエラー:', error);
    throw error;
  }
}

/**
 * テスト実行関数
 * RSS取得のみをテスト
 */
function testFetchRSS(): void {
  console.log('RSS取得テストを開始します...');

  try {
    const configManager = new ConfigManager();
    const config = configManager.loadConfig();

    const rssFetcher = new RSSFetcher();
    const articles = rssFetcher.fetchArticles(config.rssFeedUrl);

    console.log(`${articles.length}件の記事を取得しました:`);
    articles.slice(0, 5).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
      console.log(`   公開日: ${article.pubDate}`);
      console.log(`   リンク: ${article.link}`);
      console.log('');
    });
  } catch (error) {
    console.error('RSS取得テストエラー:', error);
    throw error;
  }
}

/**
 * フィルタテスト関数
 */
function testFilter(): void {
  console.log('フィルタテストを開始します...');

  try {
    const configManager = new ConfigManager();
    const config = configManager.loadConfig();

    const rssFetcher = new RSSFetcher();
    const articles = rssFetcher.fetchArticles(config.rssFeedUrl);

    const articleFilter = new ArticleFilter();
    const filteredArticles = articleFilter.filterArticles(articles, {
      keywords: config.filterKeywords,
      maxAgeDays: config.maxArticleAgeDays,
    });

    console.log(`元の記事数: ${articles.length}`);
    console.log(`フィルタ後: ${filteredArticles.length}`);
    console.log(`フィルタキーワード: ${config.filterKeywords.join(', ')}`);

    console.log('\nフィルタされた記事:');
    filteredArticles.slice(0, 5).forEach((article, index) => {
      console.log(`${index + 1}. ${article.title}`);
    });
  } catch (error) {
    console.error('フィルタテストエラー:', error);
    throw error;
  }
}

// GASのグローバル関数として公開
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).main = main;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).setupInitial = setupInitial;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).testFetchRSS = testFetchRSS;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).testFilter = testFilter;
