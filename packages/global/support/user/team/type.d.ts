import type { UserModelSchema } from '../type';
import type { TeamMemberRoleEnum, TeamMemberStatusEnum } from './constant';
import type { LafAccountType } from './type';
import { PermissionValueType, ResourcePermissionType } from '../../permission/type';
import type { TeamPermission } from '../../permission/user/controller';

export type ThirdPartyAccountType = {
  lafAccount?: LafAccountType;
  openaiAccount?: OpenaiAccountType;
  externalWorkflowVariables?: Record<string, string>;
};

export type TeamSchema = {
  _id: string;
  name: string;
  ownerId: string;
  avatar: string;
  createTime: Date;
  balance: number;
  teamDomain: string;
  limit: {
    lastExportDatasetTime: Date;
    lastWebsiteSyncTime: Date;
  };
  notificationAccount?: string;
} & ThirdPartyAccountType;

export type TeamsType = {
  teamId: string;
  teamName: string;
  ownerName: string;
};

export type tagsType = {
  label: string;
  key: string;
};

export type TeamTagSchema = TeamTagItemType & {
  _id: string;
  teamId: string;
  createTime: Date;
  updateTime?: Date;
};

export type TeamMemberSchema = {
  _id: string;
  teamId: string;
  userId: string;
  createTime: Date;
  updateTime?: Date;
  name: string;
  role: `${TeamMemberRoleEnum}`;
  status: `${TeamMemberStatusEnum}`;
  avatar: string;
};

export type TeamMemberWithTeamAndUserSchema = TeamMemberSchema & {
  team: TeamSchema;
  user: UserModelSchema;
};

export type TeamTmbItemType = {
  userId: string;
  teamId: string;
  teamAvatar?: string;
  teamName: string;
  memberName: string;
  avatar: string;
  balance?: number;
  tmbId: string;
  teamDomain: string;
  role: `${TeamMemberRoleEnum}`;
  status: `${TeamMemberStatusEnum}`;
  notificationAccount?: string;
  permission: TeamPermission;
} & ThirdPartyAccountType;

export type TeamMemberItemType<
  Options extends {
    withPermission?: boolean;
    withOrgs?: boolean;
    withGroupRole?: boolean;
  } = { withPermission: true; withOrgs: true; withGroupRole: false }
> = {
  userId: string;
  tmbId?: string;
  teamId: string;
  teamName: string;
  memberName: string;
  avatar: string;
  role: `${TeamMemberRoleEnum}`;
  status: `${TeamMemberStatusEnum}`;
  contact?: string;
  createTime: Date;
  updateTime?: Date;
} & (Options extends { withPermission: true }
  ? {
      permission: TeamPermission;
    }
  : {}) &
  (Options extends { withOrgs: true }
    ? {
        orgs?: string[]; // full path name, pattern: /teamName/orgname1/orgname2
      }
    : {}) &
  (Options extends { withGroupRole: true }
    ? {
        groupRole?: `${GroupMemberRole}`;
      }
    : {});

export type TeamTagItemType = {
  label: string;
  key: string;
};

export type LafAccountType = {
  appid: string;
  token: string;
  pat: string;
};

export type OpenaiAccountType = {
  key: string;
  baseUrl: string;
};

export type TeamInvoiceHeaderType = {
  teamName: string;
  unifiedCreditCode: string;
  companyAddress?: string;
  companyPhone?: string;
  bankName?: string;
  bankAccount?: string;
  needSpecialInvoice: boolean;
  contactPhone: string;
  emailAddress: string;
};

export type TeamInvoiceHeaderInfoSchemaType = TeamInvoiceHeaderType & {
  _id: string;
  teamId: string;
};

export interface MemberPermissionItem {
  tmbId: string;
  name: string;
  avatar: string;
  permission: {
    value: number;
    isOwner: boolean;
    hasAppCreatePer: boolean;
    hasDatasetCreatePer: boolean;
    hasApikeyCreatePer: boolean;
    hasTeamManagePer: boolean;
  };
}

export interface MemberTableItemType
  extends TeamMemberItemType<{ withOrgs: true; withPermission: true }> {
  teamNames?: string[];
  teamIds?: string[];
  isOwner: boolean;
}

export interface ResourceMemberPermissionItem {
  tmbId: string;
  name: string;
  avatar: string;
  permission: {
    value: number;
    isOwner: boolean;
    hasReadPer: boolean;
    hasWritePer: boolean;
    hasManagePer: boolean;
  };
}
