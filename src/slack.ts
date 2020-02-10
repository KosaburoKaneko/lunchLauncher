import { WebClient, WebAPICallResult } from '@slack/web-api';
import { envOf } from './utils';

export type ConversationMembers = WebAPICallResult & {
  members?: string[];
};

export type UserInfo = WebAPICallResult & {
  user: {
    id: string;
    name: string;
    is_bot: boolean;
  };
};

type ConversationsHistory = WebAPICallResult & {
  messages: [
    {
      type: string;
      user: string;
      text: string;
      ts: number;
      bot_id?: string;
    }
  ];
  has_more: boolean;
};

type PermaLink = WebAPICallResult & {
  channel: string;
  permalink: string;
};

export default class LunchLauncher {
  readonly token = envOf('SLACK_BOT_TOKEN');
  readonly slackEndpoint = envOf('SLACK_ENDPOINT');
  readonly channelId = envOf('SLACK_CHANNEL_ID');
  private web = new WebClient(this.token);

  async listMembers(): Promise<ConversationMembers> {
    return await this.web.conversations.members({
      channel: this.channelId
    });
  }

  async sendInvitation(): Promise<void> {
    const result = await this.web.chat.postMessage({
      channel: this.channelId,
      text: `${envOf(
        'LUNCH_TIME'
      )}からランチに出発します！\n参加する方は:o:を、参加しない方は:x:を押してください。`
    });
    if (!result.ok) throw new Error('異常なレスポンスを検知しました。');

    await this.addInitialReaction(result.ts as string);
  }

  async addInitialReaction(ts: string): Promise<void> {
    await this.web.reactions.add({
      channel: this.channelId,
      name: 'o',
      timestamp: ts
    });
    await this.web.reactions.add({
      channel: this.channelId,
      name: 'x',
      timestamp: ts
    });
  }

  // TODO: 戻り型を作る
  async getLatestMessageByBot(): Promise<any> {
    let hasMore = false;
    let cursor;

    do {
      const result = (await this.web.conversations.history({
        channel: this.channelId,
        cursor
      })) as ConversationsHistory;
      if (!result.ok) throw new Error('異常なレスポンスを検知しました。');

      const sorteMessages = result.messages.sort((a, b) => b.ts - a.ts);
      for (const message of sorteMessages) {
        if (
          message.bot_id === 'BTMS0LDHT' &&
          message.text.includes(
            `${envOf('LUNCH_TIME')}からランチに出発します！`
          )
        ) {
          return message;
        }
      }

      hasMore = result.has_more;
      cursor = result.response_metadata?.next_cursor;
    } while (hasMore);

    throw new Error('Botからのメッセージがチャネル内に存在しません。');
  }

  async sendRemider(
    usersToMention: string[],
    messageTs: string
  ): Promise<void> {
    const permaLink = await this.getPermaLink(messageTs);

    const mention = usersToMention.map((id: string) => `<@${id}>`);
    // TODO: マシなメッセージ内容にする
    await this.web.chat.postMessage({
      channel: this.channelId,
      text: `${mention}\n今日の${envOf(
        'LUNCH_TIME'
      )}からのランチに参加しますか？こちらのメッセージに絵文字でご回答ください！\n${permaLink}`
    });
  }

  async getPermaLink(messageTs: string): Promise<string> {
    const result = (await this.web.chat.getPermalink({
      channel: this.channelId,
      message_ts: messageTs
    })) as PermaLink;
    if (!result.ok) throw new Error('異常なレスポンスを検知しました。');
    return result.permalink;
  }
}
