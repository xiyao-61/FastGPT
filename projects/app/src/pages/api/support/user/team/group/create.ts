import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { name, avatar, memberIdList = [] } = req.body;
  const groupInfo = await MongoMemberGroupModel.create({
    teamId,
    name,
    avatar
  });

  if (memberIdList.length > 0) {
    const teamMembers = await MongoTeamMember.find(
      {
        teamId,
        userId: { $in: memberIdList }
      },
      '_id'
    );
    const groupMemberDocs = teamMembers.map((tmb) => ({
      groupId: groupInfo._id,
      tmbId: tmb._id,
      role: 'member'
    }));
    if (groupMemberDocs.length > 0) {
      await MongoGroupMemberModel.insertMany(groupMemberDocs);
    }
  }

  return groupInfo;
}

export default NextAPI(handler);
