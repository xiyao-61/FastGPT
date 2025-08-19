import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  PerResourceTypeEnum,
  NullPermissionVal
} from '@fastgpt/global/support/permission/constant';
import { TeamMemberRoleEnum } from '@fastgpt/global/support/user/team/constant';
import { Types } from 'mongoose';

async function handler(
  req: ApiRequestProps<{ tmbId: string; permission: number }>,
  res: ApiResponseType
) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { tmbId, permission } = req.body;
  if (!tmbId || typeof permission !== 'number') {
    return res.status(400).json({ error: 'tmbId and permission are required' });
  }

  // 验证 tmbId 是否为有效的 ObjectId
  if (!Types.ObjectId.isValid(tmbId)) {
    return res.status(400).json({ error: 'Invalid tmbId format' });
  }

  // 检查要修改的成员是否存在并属于当前团队
  const targetMember = await MongoTeamMember.findOne(
    {
      _id: tmbId,
      teamId
    },
    'role teamId'
  ).lean();

  if (!targetMember) {
    return res.status(404).json({ error: 'Member not found' });
  }

  // 不能修改owner的权限
  if (targetMember.role === TeamMemberRoleEnum.owner) {
    return res.status(403).json({ error: 'Cannot modify owner permissions' });
  }

  // 如果权限为0，删除权限记录；否则更新或创建权限记录
  if (permission === NullPermissionVal) {
    await MongoResourcePermission.findOneAndDelete({
      teamId,
      tmbId,
      resourceType: PerResourceTypeEnum.team
    });
  } else {
    await MongoResourcePermission.findOneAndUpdate(
      {
        teamId,
        tmbId,
        resourceType: PerResourceTypeEnum.team
      },
      {
        $set: { permission }
      },
      { upsert: true }
    );
  }

  return res.json({ success: true });
}

export default NextAPI(handler);
