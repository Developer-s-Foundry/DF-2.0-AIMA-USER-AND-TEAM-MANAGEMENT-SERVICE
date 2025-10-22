import { Request, Response } from 'express';
import { MemberService } from '../services/member.service';
import { RoleType } from '../models/RolePermission.model';

export const MemberController = {
  async addUser(req: Request, res: Response) {
    try {
      const { userId, teamId, role } = req.body;
      const member = await MemberService.addUserToTeam(userId, teamId, role as RoleType);
      return res.status(201).json(member);
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  },

  async removeUser(req: Request, res: Response) {
    try {
      const { userId, teamId } = req.body;
      await MemberService.removeUserFromTeam(userId, teamId);
      return res.status(204).end();
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  },

  async updateRole(req: Request, res: Response) {
    try {
      const { userId, teamId, role } = req.body;
      await MemberService.updateUserRoleInTeam(userId, teamId, role as RoleType);
      return res.json({ status: 'ok', message: 'Role updated' });
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  },

  async getTeamMembers(req: Request, res: Response) {
    const members = await MemberService.getTeamMembers(req.params.teamId);
    return res.json(members);
  },

  async getUserTeams(req: Request, res: Response) {
    const teams = await MemberService.getUserTeams(req.params.userId);
    return res.json(teams);
  },
};
