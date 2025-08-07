import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  TableContainer,
  Flex,
  HStack,
  Button
} from '@chakra-ui/react';
import { useTranslation } from 'next-i18next';
import { useCallback, useEffect, useState } from 'react';
import { getAllTeamsInfo } from '@/web/support/user/team/api';
import { useScrollPagination } from '@fastgpt/web/hooks/useScrollPagination';
import { type PaginationResponse } from '@fastgpt/web/common/fetch/type';
import { type TeamsType } from '@fastgpt/global/support/user/team/type';
import MyBox from '@fastgpt/web/components/common/MyBox';
import { useRequest } from '@/web/common/hooks/useRequest';
import EditInfoModal from '../EditInfoModal';
import { postRemoveTeam } from '@/web/support/user/team/api';
function TeamManage({ Tabs, onTeamCreated }: { Tabs: React.ReactNode; onTeamCreated: () => void }) {
  const { t } = useTranslation();
  const {
    data: teams = [],
    isLoading: loadingTeams,
    refreshList: refetchTeamList,
    ScrollData: TeamScrollData
  } = useScrollPagination<any, PaginationResponse<TeamsType>>(getAllTeamsInfo, {
    pageSize: 10,
    throttleWait: 500,
    debounceWait: 200
  });
  const { mutateAsync: removeDefaultTeam, isLoading: isRemoving } = useRequest({
    mutationFn({ teamId }: { teamId: string }) {
      return postRemoveTeam({ teamId });
    },
    successToast: '移除成功',
    errorToast: '移除失败',
    onSuccess: refetchTeamList
  });
  const [isOpen, setIsOpen] = useState(false);
  const [loadingTeamId, setLoadingTeamId] = useState<string | null>(null);
  const removeTeam = async (teamId: string) => {
    setLoadingTeamId(teamId);
    try {
      await removeDefaultTeam({ teamId });
    } finally {
      setLoadingTeamId(null);
    }
  };
  return (
    <Box h="100%" display="flex" flexDirection="column" minH="0">
      <Flex justify={'space-between'} align={'center'} pb={'1rem'}>
        {Tabs}
        <HStack alignItems={'center'}>
          <Button variant={'primary'} size="md" borderRadius={'md'} onClick={() => setIsOpen(true)}>
            {t('account_team:new_team')}
          </Button>
        </HStack>
      </Flex>
      <MyBox flex={'1 0 0'} overflow={'auto'} minH="0">
        <TeamScrollData>
          <TableContainer overflow={'unset'} fontSize={'sm'}>
            <Table overflow={'unset'}>
              <Thead>
                <Tr>
                  <Th>{t('account_team:team_name')}</Th>
                  <Th>{t('account_team:team_owner')}</Th>
                  <Th>{t('common:Action')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {teams.map((team, index) => (
                  <Tr key={team.teamId}>
                    <Td>{team.teamName}</Td>
                    <Td>{team.ownerName}</Td>
                    <Td>
                      {index !== 0 && (
                        <Button
                          size="sm"
                          colorScheme="yellow"
                          variant="outline"
                          isLoading={loadingTeamId === team.teamId}
                          onClick={() => removeTeam(team.teamId)}
                        >
                          {t('common:Delete')}
                        </Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </TableContainer>
        </TeamScrollData>
      </MyBox>
      {isOpen && (
        <EditInfoModal
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            setIsOpen(false);
            refetchTeamList();
            onTeamCreated();
          }}
        />
      )}
    </Box>
  );
}
export default TeamManage;
