import LunchLauncher from './slack';
import uniq from 'lodash.uniq';
import xor from 'lodash.xor';
import logger from './logger';
import './env';

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
    const reactedUserIds = latestMessageByBot.reactions
      ?.map(reaction => {
        return reaction.users;
      })
      .flat();
    const reactedUserIdsUniq = uniq(reactedUserIds);

    const membersInChannel = (await lunchLauncher.listMembers()).members;
    const unreactedUserIds = xor(reactedUserIdsUniq, membersInChannel);
    await lunchLauncher.sendRemider(unreactedUserIds, latestMessageByBot.ts);
    logger.info('ランチのリマインダーメッセージが送信されました');
  } catch (err) {
    logger.error(err);
  }
};

(async (): Promise<void> => {
  await sendInvitation();
  // await sendReminder();
})();
