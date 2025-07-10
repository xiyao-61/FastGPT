import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';

async function handler(
  req: ApiRequestProps<{ userId: string; teamId?: string }>,
  res: ApiResponseType
) {
  const { userId, teamId: teamIdFromBody } = req.body;
  if (!userId) return res.status(400).json({ error: 'userId is required' });

  let teamId = teamIdFromBody;
  // if (!teamId) {
  //   const cert = await parseHeaderCert({ req, authToken: true });
  //   teamId = cert.teamId;
  // }
  if (!teamId) return res.status(400).json({ error: 'teamId is required' });

  // 移除成员
  const result = await MongoTeamMember.deleteOne({ userId, teamId });
  if (result.deletedCount === 0) {
    return res.status(404).json({ error: 'User not in team' });
  }

  // 同步删除该成员在该团队下的所有资源权限
  await MongoResourcePermission.deleteMany({
    teamId,
    tmbId: userId
  });

  return res.json({ success: true });
}

export default NextAPI(handler);
