import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { orgId, members } = req.body;
  if (!orgId) throw new Error('orgId is required');
  await MongoOrgMemberModel.deleteMany({ teamId, orgId });
  if (Array.isArray(members) && members.length > 0) {
    await MongoOrgMemberModel.insertMany(
      members.map((m: { tmbId: string }) => ({ teamId, orgId, tmbId: m.tmbId }))
    );
  }
  return { success: true };
}

export default NextAPI(handler);
