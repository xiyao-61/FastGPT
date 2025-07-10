import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { LoginPageTypeEnum } from '@/web/support/user/login/constants';
import { serviceSideProps } from '@/web/common/i18n/utils';
import { Box, Flex } from '@chakra-ui/react';
import { getWebReqUrl } from '@fastgpt/web/common/system/utils';

const RegisterForm = dynamic(() => import('@/pageComponents/login/RegisterForm'));

function RegisterPage() {
  const router = useRouter();
  const loginSuccess = () => {
    router.replace('/login?lastRoute=/register');
  };

  // “已有账号去登录”按钮
  const setPageType = (type: `${LoginPageTypeEnum}`) => {
    if (type === LoginPageTypeEnum.passwordLogin) {
      router.replace('/login?lastRoute=/register');
    }
  };
  return (
    <Flex
      alignItems={'center'}
      justifyContent={'center'}
      bg={`url(${getWebReqUrl('/icon/login-bg.svg')}) no-repeat`}
      backgroundSize={'cover'}
      userSelect={'none'}
      h={'100%'}
    >
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
      >
        <Box w={['100%', '380px']} flex={'1 0 0'}>
          <RegisterForm setPageType={setPageType} loginSuccess={loginSuccess} />
        </Box>
      </Flex>
    </Flex>
  );
}

export async function getServerSideProps(context: any) {
  return {
    props: {
      ...(await serviceSideProps(context, ['app', 'user', 'login']))
    }
  };
}

export default RegisterPage;
