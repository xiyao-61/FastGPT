import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import {
  PerResourceTypeEnum,
  OwnerPermissionVal,
  NullPermissionVal,
  ReadPermissionVal,
  WritePermissionVal,
  ManagePermissionVal
} from '@fastgpt/global/support/permission/constant';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';

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
      // 判断是否是资源的拥有者
      let isResourceOwner = false;
      if (resourceType === PerResourceTypeEnum.app && resourceId) {
        const app = await MongoApp.findById(resourceId).lean();
        if (app && String(app.tmbId) === String(member._id)) {
          isResourceOwner = true;
        }
      } else if (resourceType === PerResourceTypeEnum.dataset && resourceId) {
        const dataset = await MongoDataset.findById(resourceId).lean();
        if (dataset && String(dataset.tmbId) === String(member._id)) {
          isResourceOwner = true;
        }
      } else if (resourceType === PerResourceTypeEnum.team) {
        isResourceOwner = member.role === TeamMemberRoleEnum.owner;
      }

      let value;
      if (isResourceOwner) {
        value = OwnerPermissionVal;
      } else {
        // 普通成员查权限表，查不到就是无权限
        const per = await getResourcePermission({
          resourceType,
          teamId: member.teamId,
          tmbId: member._id,
          ...(resourceType !== PerResourceTypeEnum.team ? { resourceId } : {})
        });
        value = per ?? NullPermissionVal; // 权限表里查不到就是无权限
      }

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
          value,
          isOwner: isResourceOwner,
          hasReadPer: isResourceOwner || (value & ReadPermissionVal) === ReadPermissionVal,
          hasWritePer: isResourceOwner || (value & WritePermissionVal) === WritePermissionVal,
          hasManagePer: isResourceOwner || (value & ManagePermissionVal) === ManagePermissionVal
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
