import React from 'react';
import { useTranslation } from 'next-i18next';
import { Box, Checkbox, HStack, VStack } from '@chakra-ui/react';
import Avatar from '@fastgpt/web/components/common/Avatar';
import RoleTags from './RoleTags';
import type { RoleValueType } from '@fastgpt/global/support/permission/type';
import MyIcon from '@fastgpt/web/components/common/Icon';
import OrgTags from '../../user/team/OrgTags';
import Tag from '@fastgpt/web/components/common/Tag';

function MemberItemCard({
  avatar,
  id,
  onChange: _onChange,
  isChecked,
  onDelete,
  name,
  role,
  orgs,
  addOnly,
  rightSlot,
  isOwner
}: {
  avatar: string;
  id: string;
  onChange: () => void;
  isChecked?: boolean;
  onDelete?: () => void;
  name: string;
  role?: RoleValueType;
  addOnly?: boolean;
  orgs?: string[];
  rightSlot?: React.ReactNode;
  isOwner?: boolean; // 新增属性，标识是否为资源创建者
}) {
  const isAdded = addOnly && !!role;
  const isDisabled = isAdded || isOwner; // 已添加或者是创建者时禁用
  const onChange = () => {
    if (!isDisabled) _onChange();
  };
  const { t } = useTranslation();
  return (
    <HStack
      justifyContent="space-between"
      alignItems="center"
      key={id}
      px="3"
      py="2"
      borderRadius="sm"
      _hover={{
        bgColor: 'myGray.50',
        cursor: 'pointer'
      }}
      onClick={onChange}
    >
      {isChecked !== undefined && (
        <Checkbox isChecked={isChecked} pointerEvents="none" disabled={isDisabled} />
      )}
      <Avatar src={avatar} w="1.5rem" borderRadius={'50%'} />

      <Box w="full">
        <Box fontSize={'sm'} className="textEllipsis" maxW="300px">
          {name}
        </Box>
        <Box lineHeight={1}>{orgs && orgs.length > 0 && <OrgTags orgs={orgs} />}</Box>
      </Box>
      {isOwner && (
        <Tag
          mixBlendMode={'multiply'}
          colorSchema="red"
          border="none"
          py={2}
          px={3}
          fontSize={'xs'}
        >
          {t('common:permission.Owner')}
        </Tag>
      )}
      {!isAdded && !isOwner && role && <RoleTags permission={role} />}
      {isAdded && !isOwner && (
        <Tag
          mixBlendMode={'multiply'}
          colorSchema="blue"
          border="none"
          py={2}
          px={3}
          fontSize={'xs'}
        >
          {t('user:team.collaborator.added')}
        </Tag>
      )}
      {onDelete !== undefined && (
        <MyIcon
          name="common/closeLight"
          w="1rem"
          cursor={'pointer'}
          _hover={{
            color: 'red.600'
          }}
          onClick={onDelete}
        />
      )}
      {rightSlot}
    </HStack>
  );
}

export default MemberItemCard;
