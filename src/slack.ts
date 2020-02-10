import { WebClient, WebAPICallResult } from '@slack/web-api';

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

export default class LunchLauncher {
  // TODO: 環境変数にする
  readonly token = 'xoxb-928390395747-927075841618-sSIH54xbhAYHoF3tusMZx1mB';
  readonly slackEndpoint =
    'https://hooks.slack.com/services/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';
  readonly channelId = 'CT9276718';
  private web = new WebClient(this.token);

  async listMembers(): Promise<ConversationMembers> {
    return await this.web.conversations.members({
      channel: this.channelId
    });
  }

  async getUserInfo(userId: string): Promise<WebAPICallResult> {
    return await this.web.users.info({
      user: userId
    });
  }

  async sendInvitation(): Promise<void> {
    const result = await this.web.chat.postMessage({
      channel: this.channelId,
      text:
        '13時からランチに出発します！\n参加する方は:o:を、参加しない方は:x:を押してください。'
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
        // TODO: 環境変数にする
        if (
          message.bot_id === 'BTMS0LDHT' &&
          message.text.includes('13時からランチに出発します！')
        ) {
          return message;
        }
      }

      hasMore = result.has_more;
      cursor = result.response_metadata?.next_cursor;
    } while (hasMore);

    throw new Error('Botからのメッセージがチャネル内に存在しません。');
  }

  async sendRemider(usersToMention: string[]): Promise<void> {
    const mention = usersToMention.map((id: string) => `<@${id}>`);
    // TODO: マシなメッセージ内容にする
    await this.web.chat.postMessage({
      channel: this.channelId,
      text: `${mention}\n何か反応してください！`
    });
  }
}
