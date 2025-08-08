import type { NextApiRequest, NextApiResponse } from 'next';
import type { InitOutLinkChatProps } from '@/global/core/chat/api.d';
import { getGuideModule, getAppChatConfig } from '@fastgpt/global/core/workflow/utils';
import { authOutLink } from '@/service/support/permission/auth/outLink';
import { MongoApp } from '@fastgpt/service/core/app/schema';
import { AppErrEnum } from '@fastgpt/global/common/error/code/app';
import { MongoChat } from '@fastgpt/service/core/chat/chatSchema';
import { ChatErrEnum } from '@fastgpt/global/common/error/code/chat';
import { getAppLatestVersion } from '@fastgpt/service/core/app/version/controller';
import { FlowNodeTypeEnum } from '@fastgpt/global/core/workflow/node/constant';
import { NextAPI } from '@/service/middleware/entry';
import { getRandomUserAvatar } from '@fastgpt/global/support/user/utils';

async function handler(req: NextApiRequest, res: NextApiResponse) {
  let { chatId, shareId, outLinkUid } = req.query as InitOutLinkChatProps;

  // auth link permission
  const { uid, appId } = await authOutLink({ shareId, outLinkUid });

  const app = await MongoApp.findById(appId).lean();

  if (!app) {
    throw new Error(AppErrEnum.unExist);
  }

  if (!chatId) {
    const { nodes, chatConfig } = await getAppLatestVersion(app._id, app);
    const pluginInputs =
      nodes?.find((node) => node.flowNodeType === FlowNodeTypeEnum.pluginInput)?.inputs ?? [];

    return {
      chatId: undefined,
      appId: app._id,
      title: undefined,
      userAvatar: getRandomUserAvatar(),
      variables: undefined,
      app: {
        chatConfig: getAppChatConfig({
          chatConfig,
          systemConfigNode: getGuideModule(nodes),
          storeVariables: undefined,
          storeWelcomeText: undefined,
          isPublicFetch: false
        }),
        name: app.name,
        avatar: app.avatar,
        intro: app.intro,
        type: app.type,
        pluginInputs
      }
    };
  }

  const chat = await MongoChat.findOne({ appId, chatId, shareId }).lean();
  let useExistingChat = chat && chat.outLinkUid === uid;

  if (chat && !useExistingChat) {
    useExistingChat = false;
  }

  const { nodes, chatConfig } = await getAppLatestVersion(app._id, app);
  const pluginInputs =
    (useExistingChat ? chat?.pluginInputs : null) ??
    nodes?.find((node) => node.flowNodeType === FlowNodeTypeEnum.pluginInput)?.inputs ??
    [];

  return {
    chatId: useExistingChat ? chatId : undefined,
    appId: app._id,
    title: useExistingChat ? chat?.title : undefined,
    userAvatar: getRandomUserAvatar(),
    variables: useExistingChat ? chat?.variables : undefined,
    app: {
      chatConfig: getAppChatConfig({
        chatConfig,
        systemConfigNode: getGuideModule(nodes),
        storeVariables: useExistingChat ? chat?.variableList : undefined,
        storeWelcomeText: useExistingChat ? chat?.welcomeText : undefined,
        isPublicFetch: false
      }),
      name: app.name,
      avatar: app.avatar,
      intro: app.intro,
      type: app.type,
      pluginInputs
    }
  };
}

export default NextAPI(handler);
