import type { NextApiRequest, NextApiResponse } from 'next';
import { NextAPI } from '@/service/middleware/entry';
import type { PostRegisterProps } from '@fastgpt/global/support/user/api.d';
import { CommonErrEnum } from '@fastgpt/global/common/error/code/common';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { authUserExist, createNewUser } from '@fastgpt/service/support/user/controller';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password } = req.body as PostRegisterProps;
  if (!username || !password) {
    return Promise.reject(CommonErrEnum.invalidParams);
  }
  // 检测用户是否存在
  const authCert = await authUserExist({ username });
  if (authCert) {
    return Promise.reject(UserErrEnum.userExist);
  }
  const userInfo = await createNewUser({
    username,
    password
  });
  return userInfo;
}
export default NextAPI(handler);
