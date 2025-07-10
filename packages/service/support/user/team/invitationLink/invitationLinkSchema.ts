import { connectionMongo, getMongoModel } from '../../../../common/mongo';
import { type InvitationSchemaType } from './type';

const { Schema } = connectionMongo;

const InvitationLinkSchema = new Schema<InvitationSchemaType>({
  linkId: { type: String, required: true, unique: true },
  teamId: { type: String, required: true },
  usedTimesLimit: { type: Number, default: 1 },
  forbidden: { type: Boolean, default: false },
  expires: { type: Date, required: true },
  description: { type: String, default: '' },
  members: { type: [String], default: [] }
});

export const MongoInvitationLink = getMongoModel<InvitationSchemaType>(
  'team_invitation_links',
  InvitationLinkSchema
);
