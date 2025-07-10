import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { NullPermission } from '@fastgpt/global/support/permission/constant';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { userId } = await parseHeaderCert({ req, authToken: true });
  const { status = TeamMemberStatusEnum.active } = req.query;

  const teamMembers = await MongoTeamMember.find({ userId, status })
    .populate('teamId', 'name avatar')
    .lean();

  const result = await Promise.all(
    teamMembers.map(async (tmb) => {
      const team = tmb.teamId as unknown as { _id: string; name: string; avatar: string };
      // 获取权限值
      const per = await getResourcePermission({
        resourceType: PerResourceTypeEnum.team,
        teamId: tmb.teamId,
        tmbId: tmb._id
      });
      // owner 自动拥有全部权限
      const permission = new TeamPermission({
        per: per ?? NullPermission,
        isOwner: tmb.role === TeamMemberRoleEnum.owner
      });
      return {
        teamId: team._id,
        teamName: team.name,
        avatar: team.avatar,
        role: tmb.role,
        hasTeamManagePer: permission.hasTeamManagePer
      };
    })
  );

  return result;
}

export default NextAPI(handler);
