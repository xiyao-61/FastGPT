import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { type CreateTeamProps } from '@fastgpt/global/support/user/team/controller.d';

async function handler(req: ApiRequestProps<CreateTeamProps>, res: ApiResponseType<string>) {
  const { userId } = await parseHeaderCert({ req, authToken: true });
  const { name, avatar } = req.body;

  if (!name) {
    return Promise.reject('Team name is required');
  }

  // 获取当前用户信息
  const user = await MongoUser.findById(userId).lean();
  if (!user) {
    return Promise.reject('User not found');
  }

  // 创建团队
  const team = await MongoTeam.create({
    ownerId: userId,
    name,
    avatar: avatar || '/icon/logo.svg',
    createTime: new Date()
  });

  await MongoTeamMember.create({
    teamId: team._id,
    userId,
    name: user.username,
    avatar: user?.avatar || '/icon/logo.svg',
    role: TeamMemberRoleEnum.owner,
    status: TeamMemberStatusEnum.active,
    createTime: new Date()
  });

  return String(team._id);
}

export default NextAPI(handler);
