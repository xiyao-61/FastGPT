import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoUser } from '@fastgpt/service/support/user/schema';

async function handler(req: ApiRequestProps, res: ApiResponseType) {
  const { pageNum = 1, pageSize = 10, offset } = req.body || {};
  const skip = typeof offset === 'number' ? offset : (pageNum - 1) * pageSize;

  const total = await MongoTeam.countDocuments();
  const teams = await MongoTeam.find({}, 'name ownerId').skip(skip).limit(pageSize).lean();

  const ownerIds = teams.map((team: any) => team.ownerId).filter(Boolean);
  const owners = await MongoUser.find({ _id: { $in: ownerIds } }, 'username').lean();
  const ownerMap = new Map(owners.map((u: any) => [String(u._id), u.username]));

  const result = teams.map((team: any) => ({
    teamId: String(team._id),
    teamName: team.name,
    ownerName: ownerMap.get(String(team.ownerId)) || ''
  }));

  return {
    list: result,
    pageNum,
    pageSize,
    total
  };
}

export default NextAPI(handler);
