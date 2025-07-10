import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoInvitationLink } from '@fastgpt/service/support/user/team/invitationLink/invitationLinkSchema';
import { MaxInvitationLinksAmount } from '@fastgpt/service/support/user/team/invitationLink/constants';
import { type InvitationLinkCreateType } from '@fastgpt/service/support/user/team/invitationLink/type';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { authUserPer } from '@fastgpt/service/support/permission/user/auth';
import dayjs from 'dayjs';
import { getNanoid } from '@fastgpt/global/common/string/tools';
const linkId = getNanoid(16);

const expiresMap = {
  '30m': () => dayjs().add(30, 'minute').toDate(),
  '7d': () => dayjs().add(7, 'day').toDate(),
  '1y': () => dayjs().add(1, 'year').toDate()
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end();
  console.log('xxx');
  console.log(req);
  //    权限校验

  const { description, expires, usedTimesLimit }: InvitationLinkCreateType = req.body;
  const { teamId, tmbId, userId } = await parseHeaderCert({
    req,
    authToken: true
  });

  const count = await MongoInvitationLink.countDocuments({
    teamId,
    forbidden: false,
    expires: { $gt: new Date() }
  });
  if (count >= MaxInvitationLinksAmount) {
    return res.status(400).json({ error: '邀请链接数量已达上限' });
  }

  const expiresAt = expiresMap[expires]?.();
  if (!expiresAt) return res.status(400).json({ error: '无效的过期时间' });

  await MongoInvitationLink.create({
    linkId,
    teamId,
    usedTimesLimit,
    forbidden: false,
    expires: expiresAt,
    description,
    members: []
  });

  return {
    linkId
  };
}
