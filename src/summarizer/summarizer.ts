import { ArticleRecord, RSSArticle } from '../types';

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
 * OpenAI API要約クラス
 * OpenAI APIを使ってSNS運営視点の要約を生成
 */
export class LLMSummarizer implements ISummarizer {
  private apiKey: string;
  private model: string;
  private endpoint: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini') {
    this.apiKey = apiKey;
    this.model = model;
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * OpenAI APIを使って記事を要約
   */
  public summarize(article: RSSArticle | ArticleRecord, maxLength: number = 200): string {
    try {
      const prompt = this.buildPrompt(article);
      const response = this.callOpenAI(prompt);
      return this.formatSummary(article, response);
    } catch (error) {
      console.error('OpenAI API呼び出しエラー:', error);
      // フォールバック: SimpleSummarizerを使用
      console.warn('SimpleSummarizerにフォールバックします');
      const simpleSummarizer = new SimpleSummarizer();
      return simpleSummarizer.summarize(article, maxLength);
    }
  }

  /**
   * プロンプトを構築
   */
  private buildPrompt(article: RSSArticle | ArticleRecord): string {
    return `あなたはSNSマーケティングの専門家です。弊社は、自社メディアのSNSアカウントや、顧客のSNSアカウントを運営しています。
    以下の記事を読んで、指定されたフォーマットで日本語の要約を作成してください。

# 記事情報
タイトル: ${article.title}
URL: ${article.link}
内容: ${article.description}

# 出力フォーマット
以下のフォーマットで出力してください：

{{記事の内容を簡潔に要約。重要なポイントを箇条書きまたは段落形式で記載}}

💡SNS運営に影響しそうなポイント
{{この記事がSNSマーケティングやSNSのアカウント運営にどのような影響を与えるか、実務的な観点から分析}}

# 注意事項
- 要約は具体的で分かりやすく
- SNS運営への影響は実務的な視点で記載。
- 日本語で出力
- URLは出力に含めない（Slack通知で別途表示されるため）`;
  }

  /**
   * OpenAI APIを呼び出す
   */
  private callOpenAI(prompt: string): string {
    // GPT-5系などの新しいモデルではtemperatureパラメータがサポートされない場合があるため、
    // デフォルト値を使用する
    // GPT-5は推論モデルのため、推論トークンと出力トークンの両方を考慮して十分なトークン数を設定
    const payload: any = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: 4000,  // GPT-5の推論トークン消費を考慮して増加
    };

    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(this.endpoint, options);
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      throw new Error(`OpenAI API returned status ${statusCode}: ${response.getContentText()}`);
    }

    const jsonResponse = JSON.parse(response.getContentText());

    if (!jsonResponse.choices || jsonResponse.choices.length === 0) {
      throw new Error('OpenAI APIからの応答が空です');
    }

    const content = jsonResponse.choices[0].message?.content;

    // GPT-5推論モデルの場合、contentが空になることがある
    if (!content || content.trim() === '') {
      console.warn('OpenAI APIのレスポンスcontentが空です。レスポンス全体:', JSON.stringify(jsonResponse));
      console.warn('使用モデル:', this.model);
      console.warn('max_completion_tokens:', payload.max_completion_tokens);
      throw new Error('OpenAI APIから有効なコンテンツが返されませんでした。推論モデルの場合、max_completion_tokensを増やしてください。');
    }

    return content;
  }

  /**
   * 要約をフォーマット
   */
  private formatSummary(article: RSSArticle | ArticleRecord, aiResponse: string): string {
    // AIの応答をそのまま返す（既に指定フォーマットで生成されている）
    return aiResponse.trim();
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
