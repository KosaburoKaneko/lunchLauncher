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

type Reaction = {
  name: string;
  count: number;
  users: string[];
};

type Message = {
  type: string;
  user: string;
  text: string;
  ts: string;
  bot_id?: string | undefined;
  reactions?: Reaction[];
};

type ConversationsHistory = WebAPICallResult & {
  messages: Message[];
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
      )}からランチに出発します！\n参加する方は${envOf(
        'ACCEPT_EMOJI'
      )}を、参加しない方は${envOf('DECLINE_EMOJI')}を押してください。`
    });
    if (!result.ok) throw new Error('異常なレスポンスを検知しました。');

    await this.addInitialReaction(result.ts as string);
  }

  private async addInitialReaction(ts: string): Promise<void> {
    await this.web.reactions.add({
      channel: this.channelId,
      name: this.convertEmojiCodeToName(envOf('ACCEPT_EMOJI')),
      timestamp: ts
    });
    await this.web.reactions.add({
      channel: this.channelId,
      name: this.convertEmojiCodeToName(envOf('DECLINE_EMOJI')),
      timestamp: ts
    });
  }

  convertEmojiCodeToName(emojiCode: string): string {
    return emojiCode.replace(/:/g, '');
  }

  async getLatestMessageByBot(): Promise<Message> {
    let hasMore = false;
    let cursor;

    do {
      const result = (await this.web.conversations.history({
        channel: this.channelId,
        cursor
      })) as ConversationsHistory;
      if (!result.ok) throw new Error('異常なレスポンスを検知しました。');

      const sorteMessages = result.messages.sort(
        (a, b) => Number(b.ts) - Number(a.ts)
      );
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

  private async getPermaLink(messageTs: string): Promise<string> {
    const result = (await this.web.chat.getPermalink({
      channel: this.channelId,
      message_ts: messageTs
    })) as PermaLink;
    if (!result.ok) throw new Error('異常なレスポンスを検知しました。');
    return result.permalink;
  }

  private makeGroup(users: string[]): string[][] {
    const totalPeopleNumber = users.length;
    const maxPeoplePerGroup = Number(envOf('MAX_PEOPLE_PER_GROUP'));

    if (totalPeopleNumber > maxPeoplePerGroup) {
      let devider = 1;
      const group: string[][] = [];

      while (group.length === 0 || group[0].length > maxPeoplePerGroup) {
        devider += 1;
        group[0] = users.slice(0, Math.ceil(totalPeopleNumber / devider));
      }

      let startNumber = 0;
      for (let i = 1; i < devider; i++) {
        startNumber += group[i - 1].length;
        group[i] = users.slice(
          startNumber,
          Math.floor(totalPeopleNumber / devider) + startNumber
        );
      }

      return group;
    }

    return [users];
  }

  async sendGroupListInfo(users: string[]): Promise<void> {
    const group = this.makeGroup(users);
    if (group.length === 1) return;

    const mentionableGroup = this.convertUserIdToMentionable(group);
    const text = this.makeGroupListText(mentionableGroup);
    const result = await this.web.chat.postMessage({
      channel: this.channelId,
      text
    });
    if (!result.ok) throw new Error('異常なレスポンスを検知しました。');
  }

  private makeGroupListText(groups: string[][]): string {
    const preMsg = `今日はこのグループで${envOf(
      'LUNCH_TIME'
    )}からランチに行きます :hamburger: \nみなさん準備してください！\n`;
    const msg = [preMsg];

    for (const [i, group] of groups.entries()) {
      msg.push(`${i + 1}つ目のグループは${group}です！`);
    }

    return msg.join('\n');
  }

  private convertUserIdToMentionable(userIds: string[][]): string[][] {
    return userIds.map(userIds =>
      userIds.map(userId => {
        return `<@${userId}>`;
      })
    );
  }
}
