import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';

async function handler(
  req: ApiRequestProps<{
    resourceType: string;
    resourceId: string;
    tmbId: string;
    permission: number;
  }>,
  res: ApiResponseType
) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { resourceType, resourceId, tmbId, permission } = req.body;
  if (!resourceType || !resourceId || !tmbId || typeof permission !== 'number') {
    return res
      .status(400)
      .json({ error: 'resourceType, resourceId, tmbId, permission are required' });
  }

  await MongoResourcePermission.findOneAndUpdate(
    {
      teamId,
      resourceType,
      resourceId,
      tmbId
    },
    {
      $set: { permission }
    },
    { upsert: true }
  );

  return res.json({ success: true });
}

export default NextAPI(handler);
