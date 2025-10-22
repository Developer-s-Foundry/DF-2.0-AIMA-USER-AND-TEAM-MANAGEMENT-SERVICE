import mongoose, { Schema, Document } from 'mongoose';
// import { RoleType } from '../../role/models/RolePermission.model'; // Member 3’s file

export interface ITeamMember extends Document {
  user_id: string;
  team_id: mongoose.Types.ObjectId;
  role: RoleType;
  joined_at: Date;
}

const TeamMemberSchema = new Schema<ITeamMember>(
  {
    user_id: { type: String, required: true },
    team_id: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    // role: { type: String, enum: Object.values(RoleType), default: RoleType.VIEWER },
    joined_at: { type: Date, default: Date.now },
  },
  { collection: 'team_members' }
);

TeamMemberSchema.index({ user_id: 1, team_id: 1 }, { unique: true });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
