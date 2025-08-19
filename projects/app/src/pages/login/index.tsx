import React, { useCallback, useState } from 'react';
import { Center } from '@chakra-ui/react';
import { useRouter } from 'next/router';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { clearToken } from '@/web/support/user/auth';
import { useMount } from 'ahooks';
import LoginModal from '@/pageComponents/login/LoginModal';
import Loading from '@fastgpt/web/components/common/MyLoading';

const Login = () => {
  const router = useRouter();
  const { lastRoute = '' } = router.query as { lastRoute: string };
  const [logoutDone, setLogoutDone] = useState(false);

  const loginSuccess = useCallback(() => {
    const decodeLastRoute = decodeURIComponent(lastRoute);

    const navigateTo =
      decodeLastRoute &&
      !decodeLastRoute.includes('/login') &&
      !decodeLastRoute.includes('/register') &&
      decodeLastRoute.startsWith('/')
        ? lastRoute
        : '/dashboard/apps';

    router.push(navigateTo);
  }, [lastRoute, router]);

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
  return <LoginModal onSuccess={loginSuccess} />;
};

export async function getServerSideProps(context: any) {
  return {
    props: {
      ...(await serviceSideProps(context, ['app', 'user', 'login']))
    }
  };
}

export default Login;
