import { type UserType } from '@fastgpt/global/support/user/type';
import { MongoUser } from './schema';
import { getTmbInfoByTmbId, getUserDefaultTeam } from './team/controller';
import { ERROR_ENUM } from '@fastgpt/global/common/error/errorCode';
import { MongoTeamMember } from './team/teamMemberSchema';
import { MongoTeam } from './team/teamSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
// import { createDefaultTeam } from './team/controller';

export async function authUserExist({ userId, username }: { userId?: string; username?: string }) {
  if (userId) {
    return MongoUser.findOne({ _id: userId });
  }
  if (username) {
    return MongoUser.findOne({ username });
  }
  return null;
}

export async function getUserDetail({
  tmbId,
  userId
}: {
  tmbId?: string;
  userId?: string;
}): Promise<UserType> {
  const tmb = await (async () => {
    if (tmbId) {
      try {
        const result = await getTmbInfoByTmbId({ tmbId });
        return result;
      } catch (error) {}
    }
    if (userId) {
      return getUserDefaultTeam({ userId });
    }
    return Promise.reject(ERROR_ENUM.unAuthorization);
  })();
  const user = await MongoUser.findById(tmb.userId);

  if (!user) {
    return Promise.reject(ERROR_ENUM.unAuthorization);
  }

  return {
    _id: user._id,
    username: user.username,
    avatar: tmb.avatar,
    timezone: user.timezone,
    promotionRate: user.promotionRate,
    team: tmb,
    notificationAccount: tmb.notificationAccount,
    permission: tmb.permission,
    contact: user.contact
  };
}

//new add
export async function createNewUser({
  username,
  password
}: {
  username: string;
  password: string;
}) {
  const earliestTeam = await MongoTeam.findOne().sort({ createTime: 1 }).select('_id').lean();
  if (!earliestTeam) return Promise.reject('没有找到root所在团队');

  const user = await MongoUser.create({
    username,
    password
  });

  await MongoTeamMember.create({
    userId: user._id,
    teamId: earliestTeam._id,
    name: user.username,
    role: TeamMemberRoleEnum.member,
    status: TeamMemberStatusEnum.active,
    createTime: new Date()
  });
  // await createDefaultTeam({ userId: user._id });
  return {
    _id: user._id,
    username: user.username
  };
}
