import { TeamMember, ITeamMember } from '../models/TeamMember.model';
import { RoleType } from '../models/RolePermission.model';
import mongoose from 'mongoose';
import { Team } from '../models/Team.model';

export const MemberService = {
  async addUserToTeam(userId: string, teamId: string, role: RoleType): Promise<ITeamMember> {
    if (!mongoose.Types.ObjectId.isValid(teamId)) throw new Error('Invalid team id');

    const team = await Team.findById(teamId);
    if (!team) throw new Error('Team not found');

    const exists = await TeamMember.findOne({ userId, teamId });
    if (exists) throw new Error('User already in team');

    const member = new TeamMember({ userId, teamId, role });
    return member.save();
  },

  async removeUserFromTeam(userId: string, teamId: string): Promise<void> {
    await TeamMember.findOneAndDelete({ userId, teamId });
  },

  async updateUserRoleInTeam(userId: string, teamId: string, role: RoleType): Promise<void> {
    const res = await TeamMember.updateOne({ userId, teamId }, { role });
    if (res.matchedCount === 0) throw new Error('Membership not found');
  },

  async getTeamMembers(teamId: string): Promise<ITeamMember[]> {
    return TeamMember.find({ teamId });
  },

  async getUserTeams(userId: string): Promise<Array<ITeamMember & { team?: any }>> {
    return TeamMember.find({ userId }).populate('teamId');
  },

  async getUserRoleInTeam(userId: string, teamId: string): Promise<RoleType | null> {
    const member = await TeamMember.findOne({ userId, teamId });
    return member ? (member.role as RoleType) : null;
  },

  async isUserInTeam(userId: string, teamId: string): Promise<boolean> {
    return !!(await TeamMember.findOne({ userId, teamId }));
  },
};
