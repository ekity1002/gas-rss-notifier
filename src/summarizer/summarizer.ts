import { ArticleRecord, RSSArticle, ArticleSummaryStructured } from '../types';

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
  private reasoningEffort: string;
  private endpoint: string;

  constructor(apiKey: string, model: string = 'gpt-4o-mini', reasoningEffort: string = 'minimal') {
    this.apiKey = apiKey;
    this.model = model;
    this.reasoningEffort = reasoningEffort;
    this.endpoint = 'https://api.openai.com/v1/chat/completions';
  }

  /**
   * OpenAI APIを使って記事を要約
   */
  public summarize(article: RSSArticle | ArticleRecord, maxLength: number = 200): string {
    try {
      const prompt = this.buildPrompt(article);
      const structuredData = this.callOpenAI(prompt);

      // 構造化データをarticleに保存（ArticleRecordの場合のみ）
      if ('structuredSummary' in article) {
        (article as ArticleRecord).structuredSummary = structuredData;
      }

      return this.formatSummary(structuredData);
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
    return `あなたはSNSマーケティングの専門家です。

# 弊社について
弊社は日本のSNSマーケティング企業で、以下のようなクライアントのSNSアカウントを運営しています：
- カメラメーカー
- 国内の官公庁及び自治体
- その他、地方創生やプロモーションに力を入れている組織

# タスク
以下の記事を分析して、要約とSNS運営への影響を箇条書きで出力してください。

## 記事情報
タイトル: ${article.title}
内容: ${article.description}

## 出力内容
1. **記事の重要なポイント**（2-4個の箇条書き）
   - 記事の核心となる情報を簡潔にまとめる

2. **SNS運営への影響ポイント**（1-3個の箇条書き）
   - カメラメーカー、官公庁、自治体のSNS運営という文脈で分析
   - 地方創生やプロモーション施策にどう活用できるか
   - 実務的で具体的なアクションやヒントを提示

# 注意事項
- 各箇条書き項目は簡潔に（1-2文程度）
- 具体的で実務的な内容を重視
- 日本語で出力`;
  }

  /**
   * OpenAI APIを呼び出す（Structured Output対応）
   */
  private callOpenAI(prompt: string): ArticleSummaryStructured {
    // Structured Output用のJSON Schema定義
    const jsonSchema = {
      type: 'object',
      properties: {
        summary: {
          type: 'object',
          properties: {
            keyPoints: {
              type: 'array',
              description: '記事の重要なポイント（2-4個）',
              items: { type: 'string' },
            },
          },
          required: ['keyPoints'],
          additionalProperties: false,
        },
        snsImpact: {
          type: 'object',
          properties: {
            impacts: {
              type: 'array',
              description: 'SNS運営への影響（1-3個）',
              items: { type: 'string' },
            },
          },
          required: ['impacts'],
          additionalProperties: false,
        },
      },
      required: ['summary', 'snsImpact'],
      additionalProperties: false,
    };

    // GPT-5系推論モデル用の最適なパラメータ設定
    // - reasoning_effort: 設定値に応じて推論レベルを調整
    // - max_completion_tokens: 推論トークン + 出力トークンの合計上限
    // - response_format: Structured Outputでスキーマ定義
    const payload: any = {
      model: this.model,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_completion_tokens: 4000,
      reasoning_effort: this.reasoningEffort,
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'article_summary',
          schema: jsonSchema,
          strict: true,
        },
      },
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
      console.warn('reasoning_effort:', payload.reasoning_effort);
      throw new Error('OpenAI APIから有効なコンテンツが返されませんでした。推論モデルの場合、max_completion_tokensを増やしてください。');
    }

    // Structured OutputなのでJSONとしてパース
    const structuredData: ArticleSummaryStructured = JSON.parse(content);
    return structuredData;
  }

  /**
   * 構造化データをフォーマット（後方互換性のためのテキスト形式）
   */
  private formatSummary(structuredData: ArticleSummaryStructured): string {
    // 構造化データをテキスト形式に変換（後方互換性のため）
    const summaryText = structuredData.summary.keyPoints
      .map((point, index) => `${index + 1}. ${point}`)
      .join('\n');

    const impactText = structuredData.snsImpact.impacts
      .map((impact, index) => `${index + 1}. ${impact}`)
      .join('\n');

    return `【要約】\n${summaryText}\n\n💡SNS運営に影響しそうなポイント\n${impactText}`;
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
