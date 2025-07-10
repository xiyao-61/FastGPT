import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { teamId, tmbId } = await parseHeaderCert({ req, authToken: true });
  const { orgId = '', withPermission = false, searchKey = '' } = req.body || {};

  const query: any = { teamId };
  if (orgId) query.path = { $regex: `^${orgId}` };
  if (searchKey) query.name = { $regex: searchKey, $options: 'i' };

  const orgs = await MongoOrgModel.find(query).lean();
  const orgIds = orgs.map((o) => o._id);

  const orgMembers = await MongoOrgMemberModel.find({ orgId: { $in: orgIds } }).lean();
  const orgId2Count: Record<string, number> = {};
  orgMembers.forEach((m) => {
    orgId2Count[m.orgId] = (orgId2Count[m.orgId] || 0) + 1;
  });

  let orgId2Permission: Record<string, any> = {};
  if (withPermission) {
    orgId2Permission = Object.fromEntries(
      await Promise.all(
        orgs.map(async (org) => [
          String(org._id),
          await getResourcePermission({
            resourceType: PerResourceTypeEnum.team,
            teamId,
            tmbId,
            resourceId: org._id
          })
        ])
      )
    );
  }

  return orgs.map((org) => ({
    ...org,
    total: orgId2Count[org._id] || 0,
    permission: withPermission ? orgId2Permission[String(org._id)] : undefined
  }));
}

export default NextAPI(handler);
