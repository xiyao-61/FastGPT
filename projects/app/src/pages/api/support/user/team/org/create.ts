import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { name, avatar, description, orgId } = req.body;

  // 生成path
  let path = '';
  if (orgId) {
    const parentOrg = await MongoOrgModel.findOne({ _id: orgId, teamId });
    if (!parentOrg) throw new Error('Parent org not found');
    path = parentOrg.path ? `${parentOrg.path}/${orgId}` : orgId;
  }

  const org = await MongoOrgModel.create({
    teamId,
    name,
    avatar,
    description,
    path
  });

  return org;
}

export default NextAPI(handler);
