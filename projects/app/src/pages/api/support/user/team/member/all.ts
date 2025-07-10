import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { OwnerPermissionVal } from '@fastgpt/global/support/permission/constant';
import { getResourcePermission } from '@fastgpt/service/support/permission/controller';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { pageNum = 1, pageSize = 10, offset, searchKey, status, selectedTeamId } = req.body || {};
  const query: any = {};
  if (status) query.status = status;
  if (searchKey) query.username = { $regex: searchKey, $options: 'i' };

  // 兼容 offset 和 pageNum
  const skip = typeof offset === 'number' ? offset : (pageNum - 1) * pageSize;

  const total = await MongoUser.countDocuments(query);
  const users = await MongoUser.find(query).skip(skip).limit(pageSize).lean();

  const userIds = users.map((u) => u._id);
  const teamMembers = await MongoTeamMember.find({ userId: { $in: userIds } })
    .populate('teamId', 'name')
    .lean();

  const userId2TeamNames: Record<string, string[]> = {};
  const userId2TeamIds: Record<string, string[]> = {};
  for (const tm of teamMembers) {
    const uid = String(tm.userId);
    if (tm.userId && tm.teamId && typeof tm.teamId === 'object' && '_id' in tm.teamId) {
      if (!userId2TeamIds[uid]) userId2TeamIds[uid] = [];
      userId2TeamIds[uid].push(String((tm.teamId as any)._id));
    }
    if (tm.userId && tm.teamId && typeof tm.teamId === 'object' && 'name' in tm.teamId) {
      if (!userId2TeamNames[uid]) userId2TeamNames[uid] = [];
      userId2TeamNames[uid].push((tm.teamId as { name: string }).name);
    }
  }

  // 查询每个用户在 selectedTeamId 下是否为 owner
  const isOwnerMap: Record<string, boolean> = {};
  await Promise.all(
    users.map(async (u) => {
      const tmb = await MongoTeamMember.findOne({ teamId: selectedTeamId, userId: u._id }).lean();
      isOwnerMap[String(u._id)] = tmb?.role === 'owner';
    })
  );

  const result = users.map((u) => ({
    userId: u._id,
    memberName: u.username,
    username: u.username,
    status: u.status,
    createTime: u.createTime,
    contact: u.contact,
    avatar: (u as any).avatar || '',
    teamNames: userId2TeamNames[String(u._id)] || [],
    teamIds: userId2TeamIds[String(u._id)] || [],
    isOwner: isOwnerMap[String(u._id)]
  }));

  return {
    list: result,
    pageNum,
    pageSize,
    total
  };
}

export default NextAPI(handler);
