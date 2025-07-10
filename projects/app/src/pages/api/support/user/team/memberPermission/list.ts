import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum, NullPermission } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';

async function handler(req: ApiRequestProps, res: ApiResponseType) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { pageNum = 1, pageSize = 20 } = req.body || {};
  const skip = (pageNum - 1) * pageSize;
  const total = await MongoTeamMember.countDocuments({ teamId });
  const members = await MongoTeamMember.find({ teamId })
    .skip(skip)
    .limit(pageSize)
    .populate('user')
    .lean();

  const list = await Promise.all(
    members.map(async (member) => {
      const per = await getResourcePermission({
        resourceType: PerResourceTypeEnum.team,
        teamId: member.teamId,
        tmbId: member._id
      });
      const permission = new TeamPermission({
        per: per ?? NullPermission,
        isOwner: member.role === 'owner'
      });
      return {
        tmbId: String(member._id),
        name: (member as any)?.user?.username || member.name,
        avatar: member.avatar,
        permission: {
          value: permission.value,
          isOwner: permission.isOwner,
          hasAppCreatePer: permission.hasAppCreatePer,
          hasDatasetCreatePer: permission.hasDatasetCreatePer,
          hasApikeyCreatePer: permission.hasApikeyCreatePer,
          hasTeamManagePer: permission.hasTeamManagePer
        }
      };
    })
  );

  return {
    list,
    total,
    pageNum,
    pageSize
  };
}

export default NextAPI(handler);
