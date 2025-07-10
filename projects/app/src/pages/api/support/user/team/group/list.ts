import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { parseHeaderCert } from '@fastgpt/service/support/permission/controller';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import type { GetGroupListBody } from '@fastgpt/global/support/permission/memberGroup/api';
import { GroupMemberRole } from '@fastgpt/global/support/permission/memberGroup/constant';

async function handler(req: ApiRequestProps<GetGroupListBody>, res: ApiResponseType) {
  const { teamId, tmbId: currentTmbId } = await parseHeaderCert({ req, authToken: true });
  const { searchKey = '', withMembers = false } = req.body || {};
  const query: any = { teamId };
  if (searchKey) {
    query.name = { $regex: searchKey, $options: 'i' };
  }
  const groups = await MongoMemberGroupModel.find(query).lean();
  if (!withMembers) {
    return groups.map((g) => ({
      ...g,
      members: undefined,
      count: undefined,
      owner: undefined,
      permission: undefined
    }));
  }
  const groupIds = groups.map((g) => g._id);
  const groupMembers = await MongoGroupMemberModel.find({ groupId: { $in: groupIds } }).lean();

  const groupId2Members: Record<string, any[]> = {};
  groupMembers.forEach((m) => {
    if (!groupId2Members[m.groupId]) groupId2Members[m.groupId] = [];
    groupId2Members[m.groupId].push(m);
  });

  const allTmbIds = groupMembers.map((m) => m.tmbId);
  const tmbId2Info = Object.fromEntries(
    (await MongoTeamMember.find({ _id: { $in: allTmbIds } }).lean()).map((m) => [
      String(m._id),
      { name: m.name, avatar: m.avatar }
    ])
  );

  return groups.map((g) => {
    const members = (groupId2Members[g._id] || []).map((m) => ({
      tmbId: m.tmbId,
      name: tmbId2Info[m.tmbId]?.name || '',
      avatar: tmbId2Info[m.tmbId]?.avatar || '',
      role: m.role
    }));
    const owner = members.find((m) => m.role === GroupMemberRole.owner);

    const currentMember = members.find((m) => String(m.tmbId) === String(currentTmbId));
    const permission = {
      hasManagePer:
        currentMember &&
        (currentMember.role === GroupMemberRole.owner ||
          currentMember.role === GroupMemberRole.admin),
      isOwner: currentMember && currentMember.role === GroupMemberRole.owner
    };
    return {
      ...g,
      members,
      count: members.length,
      owner,
      permission
    };
  });
}

export default NextAPI(handler);
