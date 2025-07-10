import type { ApiRequestProps, ApiResponseType } from '@fastgpt/service/type/next';
import { NextAPI } from '@/service/middleware/entry';
import { MongoMemberGroupModel } from '@fastgpt/service/support/permission/memberGroup/memberGroupSchema';
import { MongoGroupMemberModel } from '@fastgpt/service/support/permission/memberGroup/groupMemberSchema';

async function handler(req: ApiRequestProps<any>, res: ApiResponseType<any>) {
  const { groupId, name, avatar, memberList } = req.body;
  // 更新group名字和头像
  if (name || avatar) {
    await MongoMemberGroupModel.updateOne(
      { _id: groupId },
      { $set: { ...(name && { name }), ...(avatar && { avatar }) } }
    );
  }
  // 更新成员和角色
  if (Array.isArray(memberList)) {
    // 删除原有成员
    await MongoGroupMemberModel.deleteMany({ groupId });
    // 批量插入新成员
    if (memberList.length > 0) {
      await MongoGroupMemberModel.insertMany(
        memberList.map((m) => ({ groupId, tmbId: m.tmbId, role: m.role }))
      );
    }
  }
  return { success: true };
}

export default NextAPI(handler);
