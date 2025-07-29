import Avatar from '@fastgpt/web/components/common/Avatar';
import {
  Box,
  Button,
  Flex,
  HStack,
  Table,
  TableContainer,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useDisclosure,
  VStack
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useUserStore } from '@/web/support/user/useUserStore';
import {
  delRemoveMember,
  getAllTeamMembers,
  putUpdateMemberNameByManager,
  postRestoreMember
} from '@/web/support/user/team/api';
import Tag from '@fastgpt/web/components/common/Tag';
import Icon from '@fastgpt/web/components/common/Icon';
import { useContextSelector } from 'use-context-selector';
import { TeamContext } from './context';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import MyIcon from '@fastgpt/web/components/common/Icon';
import dynamic from 'next/dynamic';
import { postAddMemberToTeam, postRemoveMemberFromTeam } from '@/web/support/user/team/api';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import { useRequest } from '@/web/common/hooks/useRequest';
import { delLeaveTeam } from '@/web/support/user/team/api';
// import { GetSearchUserGroupOrg, postSyncMembers } from '@/web/support/user/api';
import {
  TeamMemberRoleEnum,
  TeamMemberStatusEnum
} from '@fastgpt/global/support/user/team/constant';
import format from 'date-fns/format';
import OrgTags from '@/components/support/user/team/OrgTags';
import SearchInput from '@fastgpt/web/components/common/Input/SearchInput';
import { useCallback, useEffect, useState } from 'react';
import { downloadFetch } from '@/web/common/system/utils';
import { type MemberTableItemType } from '@fastgpt/global/support/user/team/type';
import { useToast } from '@fastgpt/web/hooks/useToast';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import { type PaginationResponse } from '@fastgpt/web/common/fetch/type';
import _ from 'lodash';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useEditTitle } from '@/web/common/hooks/useEditTitle';
import PopoverConfirm from '@fastgpt/web/components/common/MyPopover/PopoverConfirm';
import MyIconButton from '@fastgpt/web/components/common/Icon/button';
import { postFindPassword } from '@/web/support/user/api';
import { EditIcon } from '@chakra-ui/icons';
const InviteModal = dynamic(() => import('./Invite/InviteModal'));
const TeamTagModal = dynamic(() => import('@/components/support/user/team/TeamTagModal'));
const ChangePasswordModal = dynamic(() => import('./ChangePasswordModal'));

function MemberTable({ Tabs, selectedTeamId }: { Tabs: React.ReactNode; selectedTeamId?: string }) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { userInfo } = useUserStore();
  const { feConfigs } = useSystemStore();
  const isSyncMember = feConfigs?.register_method?.includes('sync');

  const { myTeams, onSwitchTeam } = useContextSelector(TeamContext, (v) => v);

  // Member status selector
  const statusOptions = [
    {
      label: t('common:All'),
      value: undefined
    },
    {
      label: t('common:user.team.member.active'),
      value: 'active'
    },
    {
      label: t('account_team:leave'),
      value: 'inactive'
    }
  ];
  const [status, setStatus] = useState<string>();

  const {
    isOpen: isOpenTeamTagsAsync,
    onOpen: onOpenTeamTagsAsync,
    onClose: onCloseTeamTagsAsync
  } = useDisclosure();

  // member action
  const [searchKey, setSearchKey] = useState<string>('');
  const {
    data: members = [],
    isLoading: loadingMembers,
    refreshList: refetchMemberList,
    ScrollData: MemberScrollData
  } = useScrollPagination<any, PaginationResponse<MemberTableItemType>>(getAllTeamMembers, {
    pageSize: 10,
    params: {
      status,
      withPermission: true,
      withOrgs: true,
      searchKey,
      selectedTeamId
    },
    refreshDeps: [searchKey, status],
    throttleWait: 500,
    debounceWait: 200
  });

  const onRefreshMembers = useCallback(() => {
    refetchMemberList();
  }, [refetchMemberList]);

  const { isOpen: isOpenInvite, onOpen: onOpenInvite, onClose: onCloseInvite } = useDisclosure();

  // const { runAsync: onSyncMember, loading: isSyncing } = useRequest2(postSyncMembers, {
  //   onSuccess: onRefreshMembers,
  //   successToast: t('account_team:sync_member_success'),
  //   errorToast: t('account_team:sync_member_failed')
  // });

  const { runAsync: onLeaveTeam } = useRequest2(delLeaveTeam, {
    onSuccess() {
      const defaultTeam = myTeams[0];
      onSwitchTeam(defaultTeam.teamId);
    },
    errorToast: t('account_team:user_team_leave_team_failed')
  });

  const { mutateAsync: onAddMember, isLoading: isAdding } = useRequest({
    mutationFn({
      userId,
      memberName,
      teamId
    }: {
      userId: string;
      memberName: string;
      teamId: string;
    }) {
      return postAddMemberToTeam({ userId, memberName, teamId });
    },
    successToast: '添加成功',
    errorToast: '添加失败',
    onSuccess: refetchMemberList
  });
  const { mutateAsync: onRemoveMember, isLoading: isRemoving } = useRequest({
    mutationFn({ userId, teamId }: { userId: string; teamId: string }) {
      return postRemoveMemberFromTeam({ userId, teamId });
    },
    successToast: '移除成功',
    errorToast: '移除失败',
    onSuccess: refetchMemberList
  });

  // const isLoading = loadingMembers || isSyncing;

  const { EditModal: EditMemberNameModal, onOpenModal: openEditMemberName } = useEditTitle({
    title: t('account_team:edit_member'),
    tip: t('account_team:edit_member_tip'),
    canEmpty: false
  });
  // const handleEditMemberName = (tmbId: string, memberName: string) => {
  //   openEditMemberName({
  //     defaultVal: memberName,
  //     onSuccess: (newName: string) => {
  //       return putUpdateMemberNameByManager(tmbId, newName).then(() => {
  //         onRefreshMembers();
  //       });
  //     },
  //     onError: (err) => {
  //       toast({
  //         title: '',
  //         status: 'error'
  //       });
  //     }
  //   });
  // };
  const [isOpenChangePasswordModal, setIsOpenChangePasswordModal] = useState(false);
  const [currentUserAccount, setCurrentUserAccount] = useState('');
  const [loadingUserId, setLoadingUserId] = useState<string | null>(null);

  const handleAddMember = async (userId: string, memberName: string) => {
    setLoadingUserId(userId);
    try {
      await onAddMember({ userId, memberName, teamId: selectedTeamId });
    } finally {
      setLoadingUserId(null);
    }
  };
  const handleRemoveMember = async (userId: string) => {
    setLoadingUserId(userId);
    try {
      await onRemoveMember({ userId, teamId: selectedTeamId });
    } finally {
      setLoadingUserId(null);
    }
  };
  const handleChangePassword = async (newPassword: string) => {
    await postFindPassword({
      username: currentUserAccount,
      password: newPassword
    });
  };

  return (
    <>
      <Flex justify={'space-between'} align={'center'} pb={'1rem'}>
        {Tabs}
        <HStack alignItems={'center'}>
          {/* <Box>
            <MySelect list={statusOptions} value={status} onChange={(v) => setStatus(v)} />
          </Box> */}
          <Box width={'200px'}>
            <SearchInput
              placeholder={t('account_team:search_member')}
              onChange={(e) => setSearchKey(e.target.value)}
            />
          </Box>
          {/* {userInfo?.team.permission.hasManagePer && feConfigs?.show_team_chat && (
            <Button
              variant={'whitePrimary'}
              size="md"
              borderRadius={'md'}
              ml={3}
              leftIcon={<MyIcon name="core/dataset/tag" w={'16px'} />}
              onClick={() => {
                onOpenTeamTagsAsync();
              }}
            >
              {t('account_team:label_sync')}
            </Button>
          )} */}
          {/* {userInfo?.team.permission.hasManagePer && isSyncMember && (
            <Button
              variant={'primary'}
              size="md"
              borderRadius={'md'}
              ml={3}
              leftIcon={<MyIcon name="common/retryLight" w={'16px'} color={'white'} />}
              onClick={() => {
                onSyncMember();
              }}
            >
              {t('account_team:sync_immediately')}
            </Button>
          )} */}
          {/* {userInfo?.team.permission.hasManagePer && !isSyncMember && (
            <Button
              variant={'primary'}
              size="md"
              borderRadius={'md'}
              ml={3}
              leftIcon={<MyIcon name="common/inviteLight" w={'16px'} color={'white'} />}
              onClick={onOpenInvite}
            >
              {t('account_team:user_team_invite_member')}
            </Button>
          )} */}
          {/* {userInfo?.team.permission.isOwner && isSyncMember && (
            <Button
              variant={'whitePrimary'}
              size="md"
              borderRadius={'md'}
              ml={3}
              leftIcon={<MyIcon name="export" w={'16px'} />}
              onClick={() => {
                downloadFetch({
                  url: '/api/proApi/support/user/team/member/export',
                  filename: `${userInfo.team.teamName}-${format(new Date(), 'yyyyMMddHHmmss')}.csv`
                });
              }}
            >
              {t('account_team:export_members')}
            </Button>
          )} */}
          {/* {!userInfo?.team.permission.isOwner && (
            <PopoverConfirm
              Trigger={
                <Button
                  variant={'whitePrimary'}
                  size="md"
                  borderRadius={'md'}
                  ml={3}
                  leftIcon={<MyIcon name={'support/account/loginoutLight'} w={'14px'} />}
                >
                  {t('account_team:user_team_leave_team')}
                </Button>
              }
              type="delete"
              content={t('account_team:confirm_leave_team')}
              onConfirm={() => onLeaveTeam()}
            />
          )} */}
        </HStack>
      </Flex>

      <MyBox flex={'1 0 0'} overflow={'auto'}>
        <MemberScrollData>
          <TableContainer overflow={'unset'} fontSize={'sm'}>
            <Table overflow={'unset'}>
              <Thead>
                <Tr bgColor={'white !important'}>
                  <Th borderLeftRadius="6px" bgColor="myGray.100">
                    {t('account_team:user_name')}
                  </Th>
                  {/* <Th bgColor="myGray.100">{t('common:contact_way')}</Th> */}
                  {/* <Th bgColor="myGray.100" pl={9}>
                    {t('account_team:org')}
                  </Th> */}
                  <Th bgColor="myGray.100" pl={9}>
                    {t('account_team:team')}
                  </Th>
                  <Th bgColor="myGray.100">{t('account_team:join_update_time')}</Th>
                  <Th borderRightRadius="6px" bgColor="myGray.100">
                    {t('common:Action')}
                  </Th>
                </Tr>
              </Thead>
              <Tbody>
                {members.map((member) => (
                  <Tr key={member.userId} overflow={'unset'}>
                    <Td maxW={'280px'}>
                      <HStack>
                        {/* <Avatar src={member.avatar} w={['18px', '22px']} borderRadius={'50%'} /> */}
                        <Box className={'textEllipsis'}>
                          {member.memberName}
                          {member.status !== 'active' && (
                            <Tag ml="2" colorSchema="gray" bg={'myGray.100'} color={'myGray.700'}>
                              {t('account_team:leave')}
                            </Tag>
                          )}
                          {(userInfo?.team?.permission?.isOwner ||
                            userInfo?.team?.permission?.hasManagePer) && (
                            <EditIcon
                              boxSize={4}
                              color="red.500"
                              ml={1}
                              cursor={'pointer'}
                              onClick={() => {
                                setCurrentUserAccount(member.memberName);
                                setIsOpenChangePasswordModal(true);
                              }}
                            />
                          )}
                        </Box>
                      </HStack>
                    </Td>
                    <Td
                      maxW={'300px'}
                      textOverflow={'ellipsis'}
                      title={member.teamNames?.join(',')}
                    >
                      {member.teamNames?.join(',') || '-'}
                    </Td>
                    {/* <Td maxW={'300px'}>{member.contact || '-'}</Td> */}
                    {/* <Td maxWidth="300px">
                      {(() => {
                        return <OrgTags orgs={member.orgs?.map(item => item.name) || undefined} type="tag" />;
                      })()}
                    </Td> */}
                    <Td maxW={'200px'}>
                      <VStack gap={0} align="start">
                        <Box>{format(new Date(member.createTime), 'yyyy-MM-dd HH:mm:ss')}</Box>
                        {/* <Box>
                          {member.updateTime
                            ? format(new Date(member.updateTime), 'yyyy-MM-dd HH:mm:ss')
                            : '-'}
                        </Box> */}
                      </VStack>
                    </Td>
                    <Td>
                      {member.userId !== String(userInfo?._id) &&
                        !member.isOwner &&
                        member.memberName !== 'root' && (
                          <HStack>
                            {selectedTeamId &&
                            member.teamIds &&
                            member.teamIds.includes(selectedTeamId) ? (
                              <PopoverConfirm
                                Trigger={
                                  <Button
                                    size="sm"
                                    colorScheme="yellow"
                                    variant="outline"
                                    isLoading={loadingUserId === member.userId}
                                  >
                                    {t('common:Delete')}
                                  </Button>
                                }
                                type="delete"
                                content={t('account_team:remove_tip', {
                                  username: member.memberName
                                })}
                                onConfirm={() => handleRemoveMember(member.userId)}
                              />
                            ) : (
                              <Button
                                size="sm"
                                colorScheme="blue"
                                isLoading={loadingUserId === member.userId}
                                onClick={() => handleAddMember(member.userId, member.memberName)}
                              >
                                {t('common:Add')}
                              </Button>
                            )}
                          </HStack>
                        )}
                    </Td>
                    {/* <Td>
                      {userInfo?.team.permission.hasManagePer &&
                        member.role !== TeamMemberRoleEnum.owner &&
                        member.tmbId !== userInfo?.team.tmbId &&
                        (member.status === TeamMemberStatusEnum.active ? (
                          <HStack>
                            <MyIconButton
                              icon={'edit'}
                              size="1rem"
                              hoverColor={'blue.500'}
                              onClick={() => handleEditMemberName(member.tmbId, member.memberName)}
                            />
                            <PopoverConfirm
                              Trigger={
                                <Box>
                                  <MyIconButton
                                    icon={'common/trash'}
                                    hoverColor={'red.500'}
                                    hoverBg="red.50"
                                    size={'1rem'}
                                  />
                                </Box>
                              }
                              type="delete"
                              content={t('account_team:remove_tip', {
                                username: member.memberName
                              })}
                              onConfirm={() => onRemoveMember(member.tmbId)}
                            />
                          </HStack>
                        ) : (
                          member.status === TeamMemberStatusEnum.forbidden && (
                            <PopoverConfirm
                              Trigger={
                                <Box display={'inline-block'}>
                                  <MyIconButton
                                    icon={'common/confirm/restoreTip'}
                                    size={'1rem'}
                                    hoverColor={'primary.500'}
                                  />
                                </Box>
                              }
                              type="info"
                              content={t('account_team:restore_tip', {
                                username: member.memberName
                              })}
                              onConfirm={() => onRestore(member.tmbId)}
                            />
                          )
                        ))}
                    </Td> */}
                  </Tr>
                ))}
              </Tbody>
            </Table>
            <EditMemberNameModal />
          </TableContainer>
        </MemberScrollData>
      </MyBox>

      {isOpenInvite && userInfo?.team?.teamId && <InviteModal onClose={onCloseInvite} />}
      {isOpenTeamTagsAsync && <TeamTagModal onClose={onCloseTeamTagsAsync} />}
      {isOpenChangePasswordModal && (
        <ChangePasswordModal
          isOpen={isOpenChangePasswordModal}
          onClose={() => setIsOpenChangePasswordModal(false)}
          account={currentUserAccount}
          onSubmit={handleChangePassword}
          title="修改用户密码"
        />
      )}
    </>
  );
}

export default MemberTable;
