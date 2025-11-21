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
    return `あなたはSNSマーケティングとビジネス分析の専門家です。

# TCCについて
TCCは日本最大級のクリエイターコミュニティ（延べ450万人超のフォロワー）を運営し、信頼されたキュレーションとブランドセーフティを強みとする企業です。主なクライアントはカメラメーカー、官公庁、自治体で、地方創生やプロモーション、ナイトタイムエコノミーなどに強みを持っています。

# 主要な役職と注目すべき観点
## 1. 企画営業職マネージャー
TCCの「信頼資本」と「ブランドセーフティ」をクライアントに提供し、収益の安定化を図る立場。
- **ブランドセーフティと信用リスク**: UGCの権利問題、倫理的違反、AI生成コンテンツの動向など
- **競合と市場機会**: 観光公害やオーバーツーリズムに関する規制・炎上事例を、撮影マナー対策ソリューションに変える機会
- **コンテンツ調達コストの構造変化**: クリエイターの金銭的報酬への要求、競合の収益化強化、非金銭的報酬モデルの優位性

## 2. SNS運営・分析部署マネージャー
450万人超のフォロワーの品質と活性度を守り、効率的な仕組み化を推進する責任者。
- **コミュニティの質的維持**: 誹謗中傷や「毒性」の増加傾向、自己排除機能の維持
- **アルゴリズムとリーチの変化**: SNSのアルゴリズム変更、機能追加、リーチ確保の仕組み化
- **コンテンツの形式と競合**: 動画・ライブ配信の台頭、写真コンテンツの価値維持、競合のキュレーション方法

## 3. マーケティングマネージャー
TCCのソリューションを市場に浸透させ、特に強みを持つニッチ領域の専門性を訴求する責任者。
- **時間軸マーケティングのトレンド**: ナイトタイムエコノミー、朝観光、関連テクノロジー
- **グローバル市場とインバウンド戦略**: 海外DMO、インバウンド向けサービス、世界中のクリエイターへのアプローチ
- **社会貢献と企業理念の可視化**: SDGs/CSR、「寛容な世界の実現」、文化財保護・環境保全と商業活動の融合

# タスク
以下の記事を分析して、要約とニュースのポイントを箇条書きで出力してください。

## 記事情報
タイトル: ${article.title}
内容: ${article.description}

## 出力内容
1. **記事の重要なポイント**（2-4個の箇条書き）
   - 記事の核心となる情報を簡潔にまとめる

2. **ニュースのポイント**（2-4個の箇条書き）
   - 上記3つの役職の観点から、このニュースで注目すべきポイントを分析
   - どの役職にとって重要か（複数可）を明確にする
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
        newsPoints: {
          type: 'object',
          properties: {
            points: {
              type: 'array',
              description: '各役職の観点から見たニュースのポイント（2-4個）',
              items: { type: 'string' },
            },
          },
          required: ['points'],
          additionalProperties: false,
        },
      },
      required: ['summary', 'newsPoints'],
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

    const newsPointsText = structuredData.newsPoints.points
      .map((point, index) => `${index + 1}. ${point}`)
      .join('\n');

    return `【要約】\n${summaryText}\n\n💡ニュースのポイント\n${newsPointsText}`;
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
