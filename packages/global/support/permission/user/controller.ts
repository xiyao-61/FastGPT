import { type PerConstructPros, Permission } from '../controller';
import {
  TeamApikeyCreatePermissionVal,
  TeamAppCreatePermissionVal,
  TeamDatasetCreatePermissionVal,
  TeamDefaultPermissionVal,
  TeamPermissionList,
  TeamManagePermissionVal
} from './constant';

export class TeamPermission extends Permission {
  hasAppCreatePer: boolean = false;
  hasDatasetCreatePer: boolean = false;
  hasApikeyCreatePer: boolean = false;
  hasTeamManagePer: boolean = false;

  constructor(props?: PerConstructPros) {
    if (!props) {
      props = {
        per: TeamDefaultPermissionVal
      };
    } else if (props?.per === undefined) {
      props.per = TeamDefaultPermissionVal;
    }
    props.permissionList = TeamPermissionList;
    super(props);

    this.setUpdatePermissionCallback(() => {
      this.hasAppCreatePer = this.checkPer(TeamAppCreatePermissionVal);
      this.hasDatasetCreatePer = this.checkPer(TeamDatasetCreatePermissionVal);
      this.hasApikeyCreatePer = this.checkPer(TeamApikeyCreatePermissionVal);
      this.hasTeamManagePer = this.checkPer(TeamManagePermissionVal);
    });
  }
}
