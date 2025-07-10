import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { TeamPermission } from '@fastgpt/global/support/permission/user/controller';
import { TeamDefaultPermissionVal } from '@fastgpt/global/support/permission/user/constant';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { OwnerPermissionVal, NullPermission } from '@fastgpt/global/support/permission/constant';

async function handler(req: ApiRequestProps, res: ApiResponseType) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const {
    resourceType = PerResourceTypeEnum.team,
    resourceId,
    pageNum = 1,
    pageSize = 20
  } = req.body || {};
  const skip = (pageNum - 1) * pageSize;
  const total = await MongoTeamMember.countDocuments({ teamId });
  const members = await MongoTeamMember.find({ teamId })
    .skip(skip)
    .limit(pageSize)
    .populate('userId')
    .lean();

  const list = await Promise.all(
    members.map(async (member) => {
      let isOwner = false;
      if (resourceType === PerResourceTypeEnum.app && resourceId) {
        const app = await MongoApp.findById(resourceId).lean();
        if (app && String(app.tmbId) === String(member._id)) {
          isOwner = true;
        }
      } else if (resourceType === PerResourceTypeEnum.dataset && resourceId) {
        const dataset = await MongoDataset.findById(resourceId).lean();
        if (dataset && String(dataset.tmbId) === String(member._id)) {
          isOwner = true;
        }
      }
      const per = await getResourcePermission({
        resourceType,
        teamId: member.teamId,
        tmbId: member._id,
        ...(resourceType !== PerResourceTypeEnum.team ? { resourceId } : {})
      });
      const permission = isOwner
        ? new TeamPermission({ per: OwnerPermissionVal, isOwner: true })
        : new TeamPermission({ per: per ?? NullPermission, isOwner: member.role === 'owner' });
      // 兼容 userId population
      let name = member.name;
      if (member.userId && typeof member.userId === 'object' && (member.userId as any).username) {
        name = (member.userId as any).username || member.name;
      }
      return {
        tmbId: String(member._id),
        name,
        avatar: member.avatar,
        permission: {
          value: permission.value,
          isOwner: permission.isOwner,
          hasReadPer: permission.hasReadPer,
          hasWritePer: permission.hasWritePer,
          hasManagePer: permission.hasManagePer
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
