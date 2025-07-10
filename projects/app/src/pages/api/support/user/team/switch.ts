import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert, setCookie } from '@fastgpt/service/support/permission/controller';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { createUserSession } from '@fastgpt/service/support/user/session';
import requestIp from 'request-ip';

async function handler(req: ApiRequestProps<{ teamId: string }>, res: ApiResponseType) {
  const { teamId } = req.body;
  if (!teamId) return res.status(400).json({ error: 'teamId is required' });

  const cert = await parseHeaderCert({ req, authToken: true });
  const userId = cert.userId;

  const member = await MongoTeamMember.findOne({ userId, teamId });
  if (!member) return res.status(400).json({ error: 'teamId not in your teams' });

  const team = await MongoTeam.findById(teamId);
  if (!team) return res.status(400).json({ error: 'team not found' });

  // 生成新 token
  const token = await createUserSession({
    userId,
    teamId,
    tmbId: member._id,
    ip: requestIp.getClientIp(req)
  });
  setCookie(res, token);

  // 返回团队信息
  return res.json({
    success: true,
    team: {
      teamId: team._id,
      teamName: team.name,
      avatar: team.avatar,
      notificationAccount: team.notificationAccount,
      role: member.role
    }
  });
}

export default NextAPI(handler);
