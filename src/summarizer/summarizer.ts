import { RSSArticle, ArticleRecord } from '../types';

/**
 * 要約生成の基底インターフェース
 * 将来的にLLM APIベースの要約に差し替え可能
 */
export interface ISummarizer {
  summarize(article: RSSArticle | ArticleRecord, maxLength: number): string;
}

/**
 * ルールベース要約クラス（初期実装）
 * 説明文を短縮して要約とする
 */
export class SimpleSummarizer implements ISummarizer {
  /**
   * 記事を要約
   */
  public summarize(article: RSSArticle | ArticleRecord, maxLength: number = 200): string {
    const description = article.description || '';

    // 改行や連続スペースを整理
    const cleaned = description
      .replace(/\n+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleaned.length <= maxLength) {
      return cleaned;
    }

    // 最大長でカット（文末が不自然にならないよう調整）
    const truncated = cleaned.substring(0, maxLength);
    const lastPeriod = truncated.lastIndexOf('。');
    const lastPeriodEn = truncated.lastIndexOf('. ');
    const lastSpace = truncated.lastIndexOf(' ');

    // 句点があればそこで切る
    if (lastPeriod > maxLength * 0.7) {
      return truncated.substring(0, lastPeriod + 1);
    } else if (lastPeriodEn > maxLength * 0.7) {
      return truncated.substring(0, lastPeriodEn + 1);
    } else if (lastSpace > maxLength * 0.7) {
      return truncated.substring(0, lastSpace) + '...';
    } else {
      return truncated + '...';
    }
  }

  /**
   * 複数記事を一括要約
   */
  public summarizeBatch(articles: (RSSArticle | ArticleRecord)[], maxLength: number = 200): Map<string, string> {
    const summaries = new Map<string, string>();

    for (const article of articles) {
      const summary = this.summarize(article, maxLength);
      summaries.set(article.id, summary);
    }

    return summaries;
  }
}

/**
 * LLM要約クラス（将来実装用のスケルトン）
 * Gemini APIやOpenAI APIを使った要約を実装する想定
 */
export class LLMSummarizer implements ISummarizer {
  private apiKey: string;
  private endpoint: string;

  constructor(apiKey: string, endpoint: string = '') {
    this.apiKey = apiKey;
    this.endpoint = endpoint;
  }

  /**
   * LLMを使って記事を要約（未実装）
   */
  public summarize(article: RSSArticle | ArticleRecord, maxLength: number = 200): string {
    // TODO: LLM APIを呼び出して要約を生成
    // 例: Gemini API, OpenAI API, Claude APIなど

    console.warn('LLMSummarizer is not implemented yet. Falling back to SimpleSummarizer.');
    const simpleSummarizer = new SimpleSummarizer();
    return simpleSummarizer.summarize(article, maxLength);
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(article: RSSArticle | ArticleRecord): string {
    return `以下の記事を日本語で${200}文字程度で要約してください。

タイトル: ${article.title}
内容: ${article.description}

要約:`;
  }
}

/**
 * 要約生成のファクトリクラス
 */
export class SummarizerFactory {
  /**
   * 要約生成インスタンスを作成
   */
  public static create(type: 'simple' | 'llm' = 'simple', apiKey?: string): ISummarizer {
    if (type === 'llm' && apiKey) {
      return new LLMSummarizer(apiKey);
    } else {
      return new SimpleSummarizer();
    }
  }
}
