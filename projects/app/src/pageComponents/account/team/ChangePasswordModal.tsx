import React from 'react';
import { ModalBody, Box, Flex, Input, ModalFooter, Button, HStack, Icon } from '@chakra-ui/react';
import { InfoOutlineIcon } from '@chakra-ui/icons';
import MyModal from '@fastgpt/web/components/common/MyModal';
import { useTranslation } from 'next-i18next';
import { useForm } from 'react-hook-form';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useToast } from '@fastgpt/web/hooks/useToast';
import { checkPasswordRule } from '@fastgpt/global/common/string/password';

type FormType = {
  newPassword: string;
  confirmPassword: string;
};

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: string;
  onSubmit: (password: string) => Promise<void>;
  title?: string;
}

const ChangePasswordModal = ({
  isOpen,
  onClose,
  account,
  onSubmit,
  title = '修改密码'
}: ChangePasswordModalProps) => {
  const { t } = useTranslation();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors }
  } = useForm<FormType>({
    defaultValues: {
      newPassword: '',
      confirmPassword: ''
    }
  });

  const { runAsync: handlePasswordChange, loading: isLoading } = useRequest2(
    async (data: FormType) => {
      await onSubmit(data.newPassword);
    },
    {
      onSuccess() {
        onClose();
      },
      successToast: '密码修改成功',
      errorToast: '密码修改失败'
    }
  );

  const onSubmitError = (err: Record<string, any>) => {
    const val = Object.values(err)[0];
    if (!val) return;
    if (val.message) {
      toast({
        status: 'warning',
        title: val.message,
        duration: 3000,
        isClosable: true
      });
    }
  };

  return (
    <MyModal isOpen={isOpen} onClose={onClose} iconSrc="/imgs/modal/password.svg" title={title}>
      <ModalBody>
        <Flex alignItems={'center'} mb={5}>
          <Box flex={'0 0 70px'} fontSize={'sm'}>
            账号:
          </Box>
          <Input flex={1} value={account} isReadOnly bg={'myGray.100'} color={'myGray.600'} />
        </Flex>
        <Flex alignItems={'center'} mb={5}>
          <Box flex={'0 0 70px'} fontSize={'sm'}>
            新密码:
          </Box>
          <Input
            flex={1}
            type={'password'}
            placeholder="请输入新密码"
            {...register('newPassword', {
              required: '请输入新密码',
              validate: (val) => {
                if (!checkPasswordRule(val)) {
                  return '密码格式不正确';
                }
                return true;
              }
            })}
          />
        </Flex>
        <Flex alignItems={'center'}>
          <Box flex={'0 0 70px'} fontSize={'sm'}>
            确认密码:
          </Box>
          <Input
            flex={1}
            type={'password'}
            placeholder="请再次输入新密码"
            {...register('confirmPassword', {
              required: '请确认密码',
              validate: (val) => (getValues('newPassword') === val ? true : '两次密码输入不一致')
            })}
          />
        </Flex>
        <HStack
          mt={2}
          px={2}
          py={1}
          bg={'blue.50'}
          borderRadius={'md'}
          fontSize={'xs'}
          color={'blue.600'}
        >
          <InfoOutlineIcon w={'12px'} />
          <Box>密码长度8-20位，包含字母、数字</Box>
        </HStack>
      </ModalBody>
      <ModalFooter>
        <Button mr={3} variant={'whiteBase'} onClick={onClose}>
          取消
        </Button>
        <Button isLoading={isLoading} onClick={handleSubmit(handlePasswordChange, onSubmitError)}>
          确认
        </Button>
      </ModalFooter>
    </MyModal>
  );
};

export default ChangePasswordModal;
