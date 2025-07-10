import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { MongoDataset } from '@fastgpt/service/core/dataset/schema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  PerResourceTypeEnum,
  WritePermissionVal
} from '@fastgpt/global/support/permission/constant';

async function handler(
  req: ApiRequestProps<{ userId: string; memberName: string; teamId?: string }>,
  res: ApiResponseType
) {
  const { userId, memberName = '', teamId: teamIdFromBody } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  let teamId = teamIdFromBody;
  // if (!teamId) {
  //   const cert = await parseHeaderCert({ req, authToken: true });
  //   teamId = cert.teamId;
  // }
  if (!teamId) return res.status(400).json({ error: 'teamId is required' });

  // 检查是否已在团队中
  const exist = await MongoTeamMember.findOne({ userId, teamId });
  if (exist) return res.status(400).json({ error: 'User already in team' });

  // 添加为普通成员
  const member = await MongoTeamMember.create({
    userId,
    teamId,
    name: memberName,
    role: TeamMemberRoleEnum.member,
    status: TeamMemberStatusEnum.active,
    createTime: new Date()
  });

  // 给新成员添加对所有应用和知识库的读写权限（0b110）
  const [apps, datasets] = await Promise.all([
    MongoApp.find({ teamId }, '_id').lean(),
    MongoDataset.find({ teamId }, '_id').lean()
  ]);
  const permissionVal = WritePermissionVal;
  const resourcePermissions = [
    ...apps.map((app) => ({
      teamId,
      tmbId: member._id,
      resourceType: PerResourceTypeEnum.app,
      resourceId: app._id,
      permission: permissionVal
    })),
    ...datasets.map((ds) => ({
      teamId,
      tmbId: member._id,
      resourceType: PerResourceTypeEnum.dataset,
      resourceId: ds._id,
      permission: permissionVal
    }))
  ];
  if (resourcePermissions.length > 0) {
    await MongoResourcePermission.insertMany(resourcePermissions);
  }

  return res.json({ success: true });
}

export default NextAPI(handler);
