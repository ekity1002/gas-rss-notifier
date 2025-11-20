import { ArticleRecord, SlackMessage } from '../types';

/**
 * Slack通知クラス
 */
export class SlackNotifier {
  private webhookUrl: string;

  constructor(webhookUrl: string) {
    this.webhookUrl = webhookUrl;
  }

  /**
   * 記事をSlackに通知
   */
  public notifyArticles(articles: ArticleRecord[]): void {
    if (!this.webhookUrl) {
      console.error('Slack Webhook URLが設定されていません');
      throw new Error('Slack Webhook URLが設定されていません');
    }

    if (articles.length === 0) {
      console.log('通知する記事がありません');
      return;
    }

    try {
      // 記事ごとに通知を送信
      for (const article of articles) {
        const message = this.buildMessage(article);
        this.sendMessage(message);

        // API制限を考慮して少し待機
        Utilities.sleep(500);
      }

      console.log(`${articles.length}件の記事をSlackに通知しました`);
    } catch (error) {
      console.error('Slack通知エラー:', error);
      throw new Error(`Slack通知に失敗しました: ${error}`);
    }
  }

  /**
   * Slackメッセージを構築（Structured Output対応）
   */
  private buildMessage(article: ArticleRecord): SlackMessage {
    const blocks = [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '📰 新着ニュース',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*<${article.link}|${article.title}>*`,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `📅 ${this.formatDate(article.pubDate)}`,
          },
        ],
      },
    ];

    // 構造化要約がある場合は、テンプレートで整形して追加
    if (article.structuredSummary) {
      const { summary, snsImpact } = article.structuredSummary;

      // 要約セクション
      const summaryText = summary.keyPoints
        .map(point => `• ${point}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*📝 要約*\n${summaryText}`,
        },
      });

      // SNS運営への影響セクション
      const impactText = snsImpact.impacts
        .map(impact => `• ${impact}`)
        .join('\n');

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*💡 SNS運営に影響しそうなポイント*\n${impactText}`,
        },
      });
    } else if (article.summary) {
      // 後方互換性: 旧形式の要約がある場合
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*要約:*\n${article.summary}`,
        },
      });
    } else if (article.description) {
      // 要約がない場合は記事の説明を表示
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*説明:*\n${this.truncate(article.description, 300)}`,
        },
      });
    }

    blocks.push({
      type: 'divider',
    });

    return {
      text: `新着ニュース: ${article.title}`,
      blocks: blocks,
    };
  }

  /**
   * Slackにメッセージを送信（GAS依存）
   */
  private sendMessage(message: SlackMessage): void {
    const options: GoogleAppsScript.URL_Fetch.URLFetchRequestOptions = {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(message),
      muteHttpExceptions: true,
    };

    const response = UrlFetchApp.fetch(this.webhookUrl, options);
    const statusCode = response.getResponseCode();

    if (statusCode !== 200) {
      throw new Error(`Slack API returned status ${statusCode}: ${response.getContentText()}`);
    }
  }

  /**
   * 日付をフォーマット
   */
  private formatDate(date: Date): string {
    const d = date instanceof Date ? date : new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${year}/${month}/${day} ${hours}:${minutes}`;
  }

  /**
   * テキストを指定文字数で切り詰め
   */
  private truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + '...';
  }

  /**
   * サマリーメッセージを送信
   */
  public sendSummaryMessage(totalArticles: number, filteredArticles: number, notifiedArticles: number): void {
    if (!this.webhookUrl) {
      return;
    }

    const message: SlackMessage = {
      text: `RSS通知実行完了`,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `*📊 RSS通知実行結果*\n\n` +
                  `• 取得記事数: ${totalArticles}件\n` +
                  `• フィルタ後: ${filteredArticles}件\n` +
                  `• 通知済み: ${notifiedArticles}件`,
          },
        },
      ],
    };

    try {
      this.sendMessage(message);
    } catch (error) {
      console.error('サマリー通知エラー:', error);
    }
  }

  /**
   * エラーメッセージを送信
   */
  public sendErrorMessage(errorMessage: string): void {
    if (!this.webhookUrl) {
      console.warn('エラー通知用Webhook URLが設定されていません');
      return;
    }

    const message: SlackMessage = {
      text: '🚨 RSS通知システムでエラーが発生しました',
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: '🚨 RSS通知システムエラー',
            emoji: true,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: errorMessage,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: '⚠️ この問題を解決するまで、RSS通知が正常に動作しない可能性があります。',
            },
          ],
        },
        {
          type: 'divider',
        },
      ],
    };

    try {
      this.sendMessage(message);
    } catch (error) {
      console.error('エラー通知の送信に失敗:', error);
    }
  }

  /**
   * Webhook URLの有効性をチェック
   */
  public validateWebhookUrl(): boolean {
    return this.webhookUrl && this.webhookUrl.startsWith('https://hooks.slack.com/');
  }
}
