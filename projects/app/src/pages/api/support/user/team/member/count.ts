import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });

  const count = await MongoTeamMember.countDocuments({ teamId });

  return { count };
}

export default NextAPI(handler);
