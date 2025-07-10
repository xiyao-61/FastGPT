import React, { useMemo, useEffect } from 'react';
import { Box, type ButtonProps } from '@chakra-ui/react';
import { useUserStore } from '@/web/support/user/useUserStore';
import { useTranslation } from 'next-i18next';
import { getTeamList, putSwitchTeam } from '@/web/support/user/team/api';
import { TeamMemberStatusEnum } from '@fastgpt/global/support/user/team/constant';
import { useRequest2 } from '@fastgpt/web/hooks/useRequest';
import MySelect from '@fastgpt/web/components/common/MySelect';
import { useSystemStore } from '@/web/common/system/useSystemStore';
import { useRouter } from 'next/router';

type FilterType = 'all' | 'manage';

const TeamSelector = ({
  showManage,
  value,
  onChange,
  myTeams: myTeamsProp,
  filterType = 'all',
  ...props
}: Omit<ButtonProps, 'onChange' | 'value'> & {
  showManage?: boolean;
  value?: string;
  onChange?: (teamId: string) => void;
  myTeams?: any[];
  filterType?: FilterType;
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const { userInfo } = useUserStore();
  const { setLoading } = useSystemStore();

  const { data: myTeamsReq = [], run: fetchTeams } = useRequest2(
    () => getTeamList(TeamMemberStatusEnum.active),
    {
      manual: true
    }
  );

  useEffect(() => {
    if (!myTeamsProp) {
      fetchTeams();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo?._id, myTeamsProp]);

  const myTeams = myTeamsProp ?? myTeamsReq;

  const { runAsync: onSwitchTeam } = useRequest2(
    async (teamId: string) => {
      setLoading(true);
      await putSwitchTeam(teamId);
    },
    {
      onFinally: () => {
        router.reload();
        setLoading(false);
      },
      errorToast: t('common:user.team.Switch Team Failed')
    }
  );

  const filteredTeams = useMemo(() => {
    if (filterType === 'manage') {
      return myTeams.filter((team) => team.role === 'owner' || team.hasTeamManagePer);
    }
    return myTeams;
  }, [myTeams, filterType]);

  const teamList = useMemo(() => {
    return filteredTeams.map((team) => ({
      icon: team.avatar,
      iconSize: '1.25rem',
      label: team.teamName,
      value: team.teamId
    }));
  }, [filteredTeams]);

  const formatTeamList = useMemo(() => {
    return [
      ...(showManage
        ? [
            {
              icon: 'common/setting',
              iconSize: '1.25rem',
              label: t('user:manage_team'),
              value: 'manage',
              showBorder: true
            }
          ]
        : []),
      ...teamList
    ];
  }, [showManage, t, teamList]);

  const handleChange = (value: string) => {
    if (value === 'manage') {
      router.push('/account/team');
    } else {
      onSwitchTeam(value);
    }
  };

  return (
    <Box w={'100%'}>
      <MySelect
        {...props}
        value={value ?? userInfo?.team?.teamId}
        list={formatTeamList}
        onChange={(v) => {
          handleChange(v);
          onChange?.(v);
        }}
      />
    </Box>
  );
};

export default TeamSelector;
