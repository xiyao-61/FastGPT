import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoOrgModel } from '@fastgpt/service/support/permission/org/orgSchema';
import { jsonRes } from '@fastgpt/service/common/response';

async function handler(req: ApiRequestProps, res: ApiResponseType) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const { searchKey = '', members = true, orgs = true, groups = true } = req.body || {};

  let memberList: any[] = [];
  if (members) {
    const memberQuery: any = { teamId };
    if (searchKey) memberQuery.name = { $regex: searchKey, $options: 'i' };
    memberList = await MongoTeamMember.find(memberQuery, 'name avatar status _id').lean();
    memberList = memberList.map((m) => ({
      tmbId: m._id,
      memberName: m.name,
      avatar: m.avatar,
      status: m.status
    }));
  }

  let groupList: any[] = [];
  if (groups) {
    const groupQuery: any = { teamId };
    if (searchKey) groupQuery.name = { $regex: searchKey, $options: 'i' };
    groupList = await MongoMemberGroupModel.find(groupQuery, 'name avatar _id').lean();
  }

  let orgList: any[] = [];
  if (orgs) {
    const orgQuery: any = { teamId };
    if (searchKey) orgQuery.name = { $regex: searchKey, $options: 'i' };
    orgList = await MongoOrgModel.find(orgQuery, 'name avatar description _id').lean();
  }

  return jsonRes(res, {
    data: {
      members: memberList,
      orgs: orgList,
      groups: groupList
    }
  });
}

export default NextAPI(handler);
