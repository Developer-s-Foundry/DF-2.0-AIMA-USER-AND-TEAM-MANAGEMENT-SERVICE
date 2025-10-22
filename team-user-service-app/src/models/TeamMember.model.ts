import mongoose, { Schema, Document } from 'mongoose';
import { RoleType } from './RolePermission.model';

export interface ITeamMember extends Document {
  userId: string;
  teamId: mongoose.Types.ObjectId;
  role: RoleType;
  created_at: Date;
  updated_at: Date;
}

const TeamMemberSchema = new Schema(
  {
    userId: { type: String, required: true, trim: true },
    teamId: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
    role: {
      type: String,
      enum: Object.values(RoleType),
      required: true,
      lowercase: true,
      trim: true,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'team_members',
  }
);

TeamMemberSchema.index({ userId: 1, teamId: 1 }, { unique: true });
TeamMemberSchema.index({ teamId: 1 });
TeamMemberSchema.index({ role: 1 });

export const TeamMember = mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);
