import LunchLauncher from './slack';
import uniq from 'lodash.uniq';
import xor from 'lodash.xor';
import logger from './logger';
import './env';
import { envOf } from './utils';

const sendInvitation = async (): Promise<void> => {
  try {
    const lunchLauncher = new LunchLauncher();
    await lunchLauncher.sendInvitation();
    logger.info('ランチの招待メッセージが送信されました。');
  } catch (err) {
    logger.error(err);
  }
};

const sendReminder = async (): Promise<void> => {
  try {
    const lunchLauncher = new LunchLauncher();
    const latestMessageByBot = await lunchLauncher.getLatestMessageByBot();
    const reactedUserIds = latestMessageByBot.reactions
      ?.map(reaction => {
        return reaction.users;
      })
      .flat();
    const reactedUserIdsUniq = uniq(reactedUserIds);

    const membersInChannel = (await lunchLauncher.listMembers()).members;
    const unreactedUserIds = xor(reactedUserIdsUniq, membersInChannel);
    await lunchLauncher.sendRemider(unreactedUserIds, latestMessageByBot.ts);
    logger.info('ランチのリマインダーメッセージが送信されました。');
  } catch (err) {
    logger.error(err);
  }
};

const sendGroupListInfo = async (): Promise<void> => {
  try {
    const lunchLauncher = new LunchLauncher();
    const latestMessageByBot = await lunchLauncher.getLatestMessageByBot();
    if (!latestMessageByBot.reactions) {
      throw new Error('リアクションが存在しません。');
    }

    for (const reaction of latestMessageByBot.reactions) {
      if (
        reaction.name ===
        lunchLauncher.convertEmojiCodeToName(envOf('ACCEPT_EMOJI'))
      ) {
        const users = reaction.users.filter(
          user => user !== envOf('SLACK_BOT_ID')
        );
        lunchLauncher.sendGroupListInfo(users);
      }
    }
    logger.info('本日のランチのグループ情報が送信されました。');
  } catch (err) {
    logger.error(err);
  }
};

// const testUsers: string[] = [];
// for (let i = 0; i < 12; i++) {
//   testUsers.push(`user${i}`);
// }

// const testsendGroupListInfo = (): void => {
//   const lunchLauncher = new LunchLauncher();
//   lunchLauncher.sendGroupListInfo(testUsers);
// };

(async (): Promise<void> => {
  await sendInvitation();
  await sendReminder();
  await sendGroupListInfo();
})();
