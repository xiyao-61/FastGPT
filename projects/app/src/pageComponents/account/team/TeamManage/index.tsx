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
import EditInfoModal from '../EditInfoModal';
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
  const [isOpen, setIsOpen] = useState(false);
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
                </Tr>
              </Thead>
              <Tbody>
                {teams.map((team) => (
                  <Tr key={team.teamId}>
                    <Td>{team.teamName}</Td>
                    <Td>{team.ownerName}</Td>
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
