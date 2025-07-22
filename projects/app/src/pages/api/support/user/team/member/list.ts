import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoOrgMemberModel } from '@fastgpt/service/support/permission/org/orgMemberSchema';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { teamId } = await parseHeaderCert({ req, authToken: true });
  const {
    pageNum = 1,
    pageSize = 20,
    status,
    searchKey,
    orgId,
    groupId,
    withOrgs,
    withPermission
  } = req.body || {};

  const query: any = { teamId };
  if (status) query.status = status;
  if (searchKey) query.name = { $regex: searchKey, $options: 'i' };
  if (groupId) {
    const groupMembers = await MongoGroupMemberModel.find({ groupId }).lean();
    const tmbIds = groupMembers.map((m) => m.tmbId);
    query._id = { $in: tmbIds };
  }
  if (orgId) {
    const orgMembers = await MongoOrgMemberModel.find({ orgId }).lean();
    const tmbIds = orgMembers.map((m) => m.tmbId);
    query._id = { $in: tmbIds };
  }

  const total = await MongoTeamMember.countDocuments(query);
  let members = (await MongoTeamMember.find(query)
    .skip((pageNum - 1) * pageSize)
    .limit(pageSize)
    .lean()) as any[];

  members = members.map((item) => ({
    ...item,
    memberName: item.name,
    tmbId: String(item._id)
  }));

  let result = members;
  if (withOrgs || withPermission) {
    result = await Promise.all(
      members.map(async (m) => {
        const extra: any = {};
        if (withOrgs) {
          const orgMembers = await MongoOrgMemberModel.find({ tmbId: (m as any)._id })
            .populate('org', 'name avatar')
            .lean();
          extra.orgs = orgMembers.map((o: any) => ({
            orgId: o.orgId,
            name: o.org?.name ?? '',
            avatar: o.org?.avatar ?? ''
          }));
        }
        if (withPermission) {
          extra.permission = await getResourcePermission({
            resourceType: 'team',
            teamId,
            tmbId: (m as any)._id
          });
        }
        return { ...m, ...extra };
      })
    );
  }

  return {
    list: result,
    pageNum,
    pageSize,
    total
  };
}

export default NextAPI(handler);
