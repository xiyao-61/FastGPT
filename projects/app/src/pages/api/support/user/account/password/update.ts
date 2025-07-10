import type { NextApiRequest, NextApiResponse } from 'next';
import { MongoUser } from '@fastgpt/service/support/user/schema';
import { NextAPI } from '@/service/middleware/entry';
import { i18nT } from '@fastgpt/web/i18n/utils';
import { checkPasswordRule } from '@fastgpt/global/common/string/password';
import { UserErrEnum } from '@fastgpt/global/common/error/code/user';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { username, password } = req.body as { username: string; password: string };

  if (!username || !password) {
    return Promise.reject('Params is missing');
  }

  if (!checkPasswordRule(password)) {
    return Promise.reject(i18nT('common:user.password_tip'));
  }

  const user = await MongoUser.findOne({ username });
  if (!user) {
    return Promise.reject(UserErrEnum.notUser);
  }

  await MongoUser.findByIdAndUpdate(user._id, {
    password,
    passwordUpdateTime: new Date()
  });

  return { success: true };
}

export default NextAPI(handler);
