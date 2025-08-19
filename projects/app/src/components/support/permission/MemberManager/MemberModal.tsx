import React, { useEffect, useMemo, useState } from 'react';
import { ModalBody, ModalFooter, Button, Grid, Flex, Box, useToast } from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import MyModal from '@fastgpt/web/components/common/MyModal';
import SearchInput from '@fastgpt/web/components/common/Input/SearchInput';
import MemberItemCard from './MemberItemCard';
import RoleSelect from './RoleSelect';
import {
  getMemberResourcePermission,
  updateMemberResourcePermission
} from '@/web/support/user/team/api';
import type { ResourceMemberPermissionItem } from '@fastgpt/global/support/user/team/type.d';
import { useContextSelector } from 'use-context-selector';
import { CollaboratorContext } from './context';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import { PerResourceTypeEnum } from '@fastgpt/global/support/permission/constant';
import { AppPermissionKeyEnum } from '@fastgpt/global/support/permission/app/constant';

function MemberModal({
  onClose,
  resourceType,
  resourceId
}: {
  onClose: () => void;
  resourceType: string;
  resourceId: string;
}) {
  const { t: tCommon } = useTranslation('common');
  const { t: tUser } = useTranslation('user');
  const toast = useToast();

  const [searchKey, setSearchKey] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<ResourceMemberPermissionItem[]>([]);
  const [selectedRole, setSelectedRole] = useState<number | undefined>(undefined);
  const [submitting, setSubmitting] = useState(false);

  const roleList = useContextSelector(CollaboratorContext, (v) => v.roleList);
  const getRoleLabelList = useContextSelector(CollaboratorContext, (v) => v.getRoleLabelList);

  const {
    ScrollData,
    isLoading,
    data: scrollMembers
  } = useScrollPagination(
    (params) => {
      const { offset = 0, pageSize = 20 } = params;
      const _offset = Number(offset);
      const _pageSize = Number(pageSize);
      const pageNum = Math.floor(_offset / _pageSize) + 1;
      return getMemberResourcePermission({
        resourceType,
        resourceId,
        pageNum,
        pageSize: _pageSize
      });
    },
    {
      pageSize: 20,
      params: {},
      EmptyTip: (
        <Box textAlign="center" color="myGray.500" py={6}>
          {tCommon('no_data')}
        </Box>
      )
    }
  );

  useEffect(() => {
    // 对于所有资源类型，默认选择基础读权限
    if (roleList?.read?.value !== undefined) {
      setSelectedRole(roleList.read.value);
    }
  }, [roleList, resourceType]);

  const handleSelect = (member: ResourceMemberPermissionItem) => {
    setSelectedMembers((prev) => {
      if (prev.find((m) => m.tmbId === member.tmbId)) {
        return prev.filter((m) => m.tmbId !== member.tmbId);
      }
      return [...prev, member];
    });
  };

  // role label
  const roleLabel = useMemo(() => {
    if (selectedRole === undefined) return '';
    return getRoleLabelList ? getRoleLabelList(selectedRole).join('、') : '';
  }, [getRoleLabelList, selectedRole]);

  const handleSubmit = async () => {
    if (!selectedRole || selectedMembers.length === 0) return;
    setSubmitting(true);
    try {
      for (const member of selectedMembers) {
        await updateMemberResourcePermission({
          resourceType,
          resourceId,
          tmbId: member.tmbId,
          permission: selectedRole
        });
      }
      setSelectedMembers([]);
      setSelectedRole(undefined);
      toast({ status: 'success', title: tCommon('action_success'), position: 'top' });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MyModal
      isOpen
      onClose={onClose}
      title={tUser('team.resource_permission')}
      minW={['95vw', null, '800px']}
      maxW={['95vw', null, '800px']}
      h={['90vh', null, '100%']}
      isCentered
    >
      <ModalBody flex={1} p={['2', '4']}>
        <Grid
          border="1px solid"
          borderColor="myGray.200"
          borderRadius="0.5rem"
          gridTemplateColumns={['1fr', null, '1fr 1fr']}
          gridTemplateRows={['auto auto', null, '1fr']}
          h={'100%'}
          gap={[4, null, 0]}
        >
          {/* left: members */}
          <Flex
            flexDirection="column"
            p={[2, 4]}
            overflowY="hidden"
            overflowX="hidden"
            borderRight={['none', null, '1px solid']}
            borderRightColor={['transparent', null, 'myGray.100']}
            borderColor="myGray.200"
            h="100%"
          >
            <SearchInput
              placeholder={tUser('search_user')}
              fontSize={['sm', null, 'sm']}
              bg={'myGray.50'}
              onChange={(e) => setSearchKey(e.target.value)}
            />
            <Box mt={3} flexGrow="1" h={0} minH={0}>
              <ScrollData style={{ height: '100%' }}>
                {(scrollMembers as ResourceMemberPermissionItem[])
                  ?.filter((m: ResourceMemberPermissionItem) =>
                    m.name?.toLowerCase().includes(searchKey.toLowerCase())
                  )
                  .map((member: ResourceMemberPermissionItem) => {
                    const isChecked =
                      selectedMembers.find((m) => m.tmbId === member.tmbId) !== undefined;
                    return (
                      <MemberItemCard
                        key={member.tmbId}
                        id={member.tmbId}
                        avatar={member.avatar}
                        name={member.name}
                        isChecked={isChecked}
                        onChange={() => handleSelect(member)}
                        role={member.permission?.value ?? 0}
                        isOwner={member.permission?.isOwner}
                      />
                    );
                  })}
              </ScrollData>
            </Box>
          </Flex>

          {/* right: selected */}
          <Flex flexDirection="column" p={[2, 4]} overflowY="auto" overflowX="hidden">
            <Box mb={2} fontWeight="bold" fontSize={['md', null, 'lg']}>
              {tUser('has_chosen')}: {selectedMembers.length}
            </Box>
            <Box flexGrow={1}>
              {selectedMembers.map((member) => (
                <MemberItemCard
                  key={member.tmbId}
                  id={member.tmbId}
                  avatar={member.avatar}
                  name={member.name}
                  isChecked={true}
                  onChange={() => handleSelect(member)}
                  role={member.permission?.value ?? 0}
                  isOwner={member.permission?.isOwner}
                />
              ))}
            </Box>
          </Flex>
        </Grid>
      </ModalBody>
      <ModalFooter>
        {!!roleList && (
          <RoleSelect
            value={selectedRole}
            Button={
              <Flex
                alignItems={'center'}
                bg={'myGray.50'}
                border="base"
                fontSize={['sm', null, 'sm']}
                px={3}
                borderRadius={'md'}
                h={'32px'}
              >
                {roleLabel}
                <span style={{ marginLeft: 4, display: 'flex', alignItems: 'center' }}>
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4.64645 6.64645C4.84171 6.45118 5.15829 6.45118 5.35355 6.64645L8 9.29289L10.6464 6.64645C10.8417 6.45118 11.1583 6.45118 11.3536 6.64645C11.5488 6.84171 11.5488 7.15829 11.3536 7.35355L8.35355 10.3536C8.15829 10.5488 7.84171 10.5488 7.64645 10.3536L4.64645 7.35355C4.45118 7.15829 4.45118 6.84171 4.64645 6.64645Z"
                      fill="#A0AEC0"
                    />
                  </svg>
                </span>
              </Flex>
            }
            onChange={(v) => setSelectedRole(v)}
          />
        )}
        <Button
          isLoading={submitting}
          ml="4"
          h={'32px'}
          onClick={handleSubmit}
          isDisabled={selectedMembers.length === 0 || !selectedRole}
          fontSize={['sm', null, 'md']}
        >
          {tCommon('Confirm')}
        </Button>
      </ModalFooter>
    </MyModal>
  );
}

export default MemberModal;
