import LunchLauncher from './slack';
import uniq from 'lodash.uniq';
import xor from 'lodash.xor';
import logger from './logger';

const sendInvitation = async (): Promise<void> => {
  try {
    const lunchLauncher = new LunchLauncher();
    await lunchLauncher.sendInvitation();
    logger.info('ランチの招待メッセージが送信されました');
  } catch (err) {
    logger.error(err);
  }
};

const sendReminder = async (): Promise<void> => {
  try {
    const lunchLauncher = new LunchLauncher();
    const latestMessageByBot = await lunchLauncher.getLatestMessageByBot();
    const reactedUserIds = latestMessageByBot.reactions.reduce(
      (acc: any, cur: any, i: number) => {
        if (i === 0) return cur.users;
        return acc.users.concat(cur.users);
      }
    );
    const reactedUserIdsUniq: string[] = uniq(reactedUserIds);

    const membersInChannel = (await lunchLauncher.listMembers()).members;
    const unreactedUserIds = xor(reactedUserIdsUniq, membersInChannel);
    await lunchLauncher.sendRemider(unreactedUserIds, latestMessageByBot.ts);
    logger.info('ランチのリマインダーメッセージが送信されました');
  } catch (err) {
    logger.error(err);
  }
};

(async (): Promise<void> => {
  // await sendInvitation();
  await sendReminder();
})();
