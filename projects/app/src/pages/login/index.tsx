import React, { useCallback, useState } from 'react';
import { Flex, Box, Center } from '@chakra-ui/react';
import type { ResLogin } from '@/global/support/api/userRes.d';
import { useRouter } from 'next/router';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { clearToken } from '@/web/support/user/auth';
import { useMount } from 'ahooks';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';
import { LoginContainer } from '@/pageComponents/login';
import I18nLngSelector from '@/components/Select/I18nLngSelector';
import { useSystem } from '@fastgpt/web/hooks/useSystem';
import Loading from '@fastgpt/web/components/common/MyLoading';

const Login = () => {
  const router = useRouter();
  const { isPc } = useSystem();
  const { lastRoute = '' } = router.query as { lastRoute: string };
  const [logoutDone, setLogoutDone] = useState(false);

  const loginSuccess = useCallback(
    (res: ResLogin) => {
      const decodeLastRoute = decodeURIComponent(lastRoute);

      const navigateTo =
        decodeLastRoute &&
        !decodeLastRoute.includes('/login') &&
        !decodeLastRoute.includes('/register') &&
        decodeLastRoute.startsWith('/')
          ? lastRoute
          : '/dashboard/apps';

      router.push(navigateTo);
    },
    [lastRoute, router]
  );

  // useMount(() => {
  //   // 只有在非登录状态下才清理 token，避免在登录过程中清除 session
  //   if (!lastRoute || (lastRoute !== '/register' && lastRoute !== '/login')) {
  //     clearToken().finally(() => setLogoutDone(true));
  //   } else {
  //     setLogoutDone(true);
  //   }
  //   router.prefetch('/dashboard/apps');
  // });

  useMount(() => {
    clearToken().finally(() => setLogoutDone(true));
    // clearToken();
    router.prefetch('/dashboard/apps');
  });

  if (!logoutDone) {
    return (
      <Center w="100vw" h="100vh">
        <Loading fixed={false} />
      </Center>
    );
  }

  return (
    <Flex
      alignItems={'center'}
      justifyContent={'center'}
      bg={`url(${getWebReqUrl('/icon/login-bg.svg')}) no-repeat`}
      backgroundSize={'cover'}
      userSelect={'none'}
      h={'100%'}
    >
      {/* Language selector - login page */}
      {isPc && (
        <Box position="absolute" top="24px" right="24px" zIndex={10}>
          <I18nLngSelector />
        </Box>
      )}

      <Flex
        flexDirection={'column'}
        w={['100%', '556px']}
        h={['100%', '677px']}
        bg={'white'}
        px={['5vw', '88px']}
        py={['5vh', '64px']}
        borderRadius={[0, '16px']}
        boxShadow={[
          '',
          '0px 32px 64px -12px rgba(19, 51, 107, 0.20), 0px 0px 1px 0px rgba(19, 51, 107, 0.20)'
        ]}
        position="relative"
      >
        <LoginContainer onSuccess={loginSuccess} />
      </Flex>
    </Flex>
  );
};

export async function getServerSideProps(context: any) {
  return {
    props: {
      ...(await serviceSideProps(context, ['app', 'user', 'login']))
    }
  };
}

export default Login;
