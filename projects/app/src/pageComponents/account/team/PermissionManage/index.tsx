import React, { useState } from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Switch,
  Text,
  Flex,
  Spinner
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { getMemberPermission, updateMemberCreatePermission } from '@/web/support/user/team/api';
import {
  TeamAppCreatePermissionVal,
  TeamDatasetCreatePermissionVal,
  TeamApikeyCreatePermissionVal,
  TeamManagePermissionVal
} from '@fastgpt/global/support/permission/user/constant';
import { useToast } from '@fastgpt/web/hooks/useToast';
import type { MemberPermissionItem } from '@fastgpt/global/support/user/team/type.d';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';

const PERMISSIONS = [
  {
    key: 'appCreate',
    label: 'account_team:permission_appCreate',
    value: TeamAppCreatePermissionVal,
    checkedKey: 'hasAppCreatePer' as const
  },
  {
    key: 'datasetCreate',
    label: 'account_team:permission_datasetCreate',
    value: TeamDatasetCreatePermissionVal,
    checkedKey: 'hasDatasetCreatePer' as const
  },
  {
    key: 'apikeyCreate',
    label: 'account_team:permission_apikeyCreate',
    value: TeamApikeyCreatePermissionVal,
    checkedKey: 'hasApikeyCreatePer' as const
  },
  {
    key: 'teamManage',
    label: 'account_team:team_manage',
    value: TeamManagePermissionVal,
    checkedKey: 'hasTeamManagePer' as const
  }
];

function PermissionManage({ Tabs }: { Tabs: React.ReactNode }) {
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const { userInfo } = useUserStore();
  const [selectedMembers, setSelectedMembers] = useState<MemberPermissionItem[]>([]);
  const [updating, setUpdating] = useState<{ tmbId: string; key: string } | null>(null);

  const {
    ScrollData,
    isLoading,
    data: members,
    total: scrollTotal,
    refreshList,
    setData
  } = useScrollPagination(
    (params) => {
      const { offset = 0, pageSize = 10 } = params;
      const _offset = Number(offset);
      const _pageSize = Number(pageSize);
      const pageNum = Math.floor(_offset / _pageSize) + 1;
      return getMemberPermission({
        pageNum,
        pageSize: _pageSize
      });
    },
    {
      pageSize: 10,
      params: {},
      EmptyTip: (
        <Box textAlign="center" color="myGray.500" py={6}>
          {t('no_data')}
        </Box>
      )
    }
  );

  const calcNewPermissionValue = (oldValue: number, perValue: number, checked: boolean) => {
    return checked ? oldValue | perValue : oldValue & ~perValue;
  };

  const getPermissionBooleans = (value: number) => ({
    hasAppCreatePer: Boolean(value & TeamAppCreatePermissionVal),
    hasDatasetCreatePer: Boolean(value & TeamDatasetCreatePermissionVal),
    hasApikeyCreatePer: Boolean(value & TeamApikeyCreatePermissionVal),
    hasTeamManagePer: Boolean(value & TeamManagePermissionVal)
  });

  const handleSwitch = async (
    member: MemberPermissionItem,
    perValue: number,
    checked: boolean,
    perKey: string
  ) => {
    setUpdating({ tmbId: member.tmbId, key: perKey });
    const newValue = calcNewPermissionValue(member.permission.value, perValue, checked);

    // 乐观更新
    setData((prev) =>
      prev.map((m) =>
        m.tmbId === member.tmbId
          ? {
              ...m,
              permission: {
                ...m.permission,
                value: newValue,
                ...getPermissionBooleans(newValue)
              }
            }
          : m
      )
    );

    try {
      await updateMemberCreatePermission({ tmbId: member.tmbId, permission: newValue });
      toast({ status: 'success', title: t('action_success') });
    } catch (e) {
      toast({ status: 'error', title: t('action_error') });
      refreshList(); // 回滚
    } finally {
      setUpdating(null);
    }
  };

  return (
    <Box>
      <Box mb={4}>{Tabs}</Box>
      <ScrollData style={{ height: '100%' }}>
        <Table>
          <Thead>
            <Tr>
              <Th>{t('user.team.Member')}</Th>
              {PERMISSIONS.map((per: any) => (
                <Th key={per.key}>{t(per.label)}</Th>
              ))}
            </Tr>
          </Thead>
          <Tbody>
            {members.map((m: MemberPermissionItem) => (
              <Tr key={m.tmbId}>
                <Td>
                  <Text as="span">{m.name}</Text>
                </Td>
                {PERMISSIONS.map((per) => (
                  <Td key={per.key}>
                    <Flex align="center">
                      <Switch
                        isChecked={m.permission[per.checkedKey]}
                        isDisabled={
                          (!!updating && updating.tmbId === m.tmbId && updating.key === per.key) ||
                          m.permission.isOwner ||
                          m.tmbId === (userInfo as any)?.tmbId
                        }
                        onChange={(e) => handleSwitch(m, per.value, e.target.checked, per.key)}
                        colorScheme="blue"
                      />
                      {updating?.tmbId === m.tmbId && updating?.key === per.key && (
                        <Spinner size="sm" ml={2} color="#3370ff" />
                      )}
                    </Flex>
                  </Td>
                ))}
              </Tr>
            ))}
          </Tbody>
        </Table>
      </ScrollData>
    </Box>
  );
}

export default PermissionManage;
