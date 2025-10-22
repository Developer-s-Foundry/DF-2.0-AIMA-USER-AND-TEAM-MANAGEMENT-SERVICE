import { Team, ITeam } from '../models/Team.model';
import { TeamMember } from '../models/TeamMember.model';
import { RoleType } from '../models/RolePermission.model';
import mongoose from 'mongoose';
import { logger } from '../utils/logger.utils';

export const TeamService = {
  async createTeam(data: { name: string; description?: string; created_by?: string }): Promise<ITeam> {
    const existing = await Team.findOne({ name: data.name.toLowerCase().trim() });
    if (existing) throw new Error('Team name already exists');

    const team = new Team({
      name: data.name.toLowerCase().trim(),
      description: data.description,
      created_by: data.created_by,
    });

    const saved = await team.save();

    // If created_by provided, add as admin in TeamMember
    if (data.created_by) {
      try {
        await TeamMember.create({
          userId: data.created_by,
          teamId: saved._id,
          role: RoleType.ADMIN,
        });
      } catch (err) {
        logger.warn('Failed to create team admin member:', err);
      }
    }

    return saved;
  },

  async getTeamById(teamId: string): Promise<ITeam | null> {
    if (!mongoose.Types.ObjectId.isValid(teamId)) return null;
    return Team.findById(teamId);
  },

  async getAllTeams(): Promise<ITeam[]> {
    return Team.find();
  },

  async deleteTeam(teamId: string): Promise<void> {
    if (!mongoose.Types.ObjectId.isValid(teamId)) throw new Error('Invalid team id');
    await Team.findByIdAndDelete(teamId);
    await TeamMember.deleteMany({ teamId });
  },

  async updateTeam(teamId: string, update: Partial<{ name: string; description?: string }>): Promise<ITeam | null> {
    if (update.name) update.name = update.name.toLowerCase().trim();
    return Team.findByIdAndUpdate(teamId, update, { new: true });
  },
};
