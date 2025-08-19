import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import {
  PerResourceTypeEnum,
  OwnerPermissionVal,
  NullPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import {
  TeamAppCreatePermissionVal,
  TeamDatasetCreatePermissionVal,
  TeamApikeyCreatePermissionVal,
  TeamManagePermissionVal
} from '@fastgpt/global/support/permission/user/constant';

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
      const isOwner = member.role === TeamMemberRoleEnum.owner;

      let value;
      if (isOwner) {
        value = OwnerPermissionVal;
      } else {
        const per = await getResourcePermission({
          resourceType: PerResourceTypeEnum.team,
          teamId: member.teamId,
          tmbId: member._id
        });
        value = per ?? NullPermissionVal; // 权限表里查不到就是无权限
      }

      return {
        tmbId: String(member._id),
        name: (member as any)?.user?.username || member.name,
        avatar: member.avatar,
        permission: {
          value,
          isOwner,
          hasAppCreatePer:
            isOwner || (value & TeamAppCreatePermissionVal) === TeamAppCreatePermissionVal,
          hasDatasetCreatePer:
            isOwner || (value & TeamDatasetCreatePermissionVal) === TeamDatasetCreatePermissionVal,
          hasApikeyCreatePer:
            isOwner || (value & TeamApikeyCreatePermissionVal) === TeamApikeyCreatePermissionVal,
          hasTeamManagePer: isOwner || (value & TeamManagePermissionVal) === TeamManagePermissionVal
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
