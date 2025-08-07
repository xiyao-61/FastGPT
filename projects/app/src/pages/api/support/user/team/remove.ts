import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoTeam } from '@fastgpt/service/support/user/team/teamSchema';
import { MongoTeamMember } from '@fastgpt/service/support/user/team/teamMemberSchema';
import { MongoResourcePermission } from '@fastgpt/service/support/permission/schema';
import { Types } from '@fastgpt/service/common/mongo';

async function handler(req: ApiRequestProps, res: ApiResponseType) {
  const { teamId } = req.body;
  if (!teamId) {
    return Promise.reject('Team id is required');
  }
  const session = await MongoTeam.startSession();
  session.startTransaction();

  try {
    const team = await MongoTeam.findById(teamId).session(session);
    if (!team) {
      throw new Error('team not exist');
    }

    await MongoTeamMember.deleteMany({
      teamId: new Types.ObjectId(teamId)
    }).session(session);

    await MongoResourcePermission.deleteMany({
      teamId: new Types.ObjectId(teamId)
    }).session(session);

    await MongoTeam.deleteOne({
      _id: new Types.ObjectId(teamId)
    }).session(session);

    await session.commitTransaction();
    console.log(`团队 ${teamId} 删除成功`);
    return true;
  } catch (error) {
    await session.abortTransaction();
    console.error(`删除团队 ${teamId} 失败:`, error);
    throw error;
  } finally {
    session.endSession();
  }
}

export default NextAPI(handler);
