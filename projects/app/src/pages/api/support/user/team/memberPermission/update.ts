import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import {
  PerResourceTypeEnum,
  ReadPermissionVal
} from '@fastgpt/global/support/permission/constant';

async function handler(
  req: ApiRequestProps<{ tmbId: string; permission: number }>,
  res: ApiResponseType
) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { tmbId, permission } = req.body;
  if (!tmbId || typeof permission !== 'number') {
    return res.status(400).json({ error: 'tmbId and permission are required' });
  }

  // 自动累计读权限
  const finalPermission = permission | ReadPermissionVal;

  await MongoResourcePermission.findOneAndUpdate(
    {
      teamId,
      tmbId,
      resourceType: PerResourceTypeEnum.team
    },
    {
      $set: { permission: finalPermission }
    },
    { upsert: true }
  );

  return res.json({ success: true });
}

export default NextAPI(handler);
