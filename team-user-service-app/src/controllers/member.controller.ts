import { Request, Response } from "express";
import { MemberService } from "../services/member.service";
import { RoleType } from "../models/RolePermission.model";

export const MemberController = {
  async addUser(req: Request, res: Response) {
    try {
      const { userId, teamId, role } = req.body;
      const member = await MemberService.addUserToTeam(userId, teamId, role);
      res.status(201).json(member);
    } catch (err: any) {
      res.status(400).json({ message: err.message });
    }
  },

  async removeUser(req: Request, res: Response) {
    const { userId, teamId } = req.body;
    await MemberService.removeUserFromTeam(userId, teamId);
    res.status(204).end();
  },

  async updateRole(req: Request, res: Response) {
    const { userId, teamId, role } = req.body;
    await MemberService.updateUserRoleInTeam(userId, teamId, role as RoleType);
    res.json({ message: "Role updated" });
  },

  async getTeamMembers(req: Request, res: Response) {
    const members = await MemberService.getTeamMembers(req.params.teamId);
    res.json(members);
  },

  async getUserTeams(req: Request, res: Response) {
    const teams = await MemberService.getUserTeams(req.params.userId);
    res.json(teams);
  },
};
