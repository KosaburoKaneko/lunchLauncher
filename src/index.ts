import LunchLauncher from './slack';
import uniq from 'lodash.uniq';
import xor from 'lodash.xor';

const sendInvitation = async (): Promise<void> => {
  try {
    const lunchLauncher = new LunchLauncher();
    const result = await lunchLauncher.sendInvitation();
    console.log('ランチの招待メッセージが送信されました :', result);
  } catch (err) {
    console.log('err: ', err);
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
    console.log('unreactedUserIds :', unreactedUserIds);
    await lunchLauncher.sendRemider(unreactedUserIds);
    // console.log('ランチのリマインダーメッセージが送信されました :', result);
  } catch (err) {
    console.log('err: ', err);
  }
};

(async (): Promise<void> => {
  await sendReminder();
})();
