import { Request, Response } from 'express';
import { TeamService } from '../services/team.service';

export const TeamController = {
  async createTeam(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id; // optional creator
      const { name, description } = req.body;
      const team = await TeamService.createTeam({ name, description, created_by: userId });
      return res.status(201).json(team);
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  },

  async getTeam(req: Request, res: Response) {
    const team = await TeamService.getTeamById(req.params.id);
    if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' });
    return res.json(team);
  },

  async getAll(req: Request, res: Response) {
    const teams = await TeamService.getAllTeams();
    return res.json(teams);
  },

  async updateTeam(req: Request, res: Response) {
    try {
      const updated = await TeamService.updateTeam(req.params.id, req.body);
      if (!updated) return res.status(404).json({ status: 'error', message: 'Team not found' });
      return res.json(updated);
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  },

  async delete(req: Request, res: Response) {
    try {
      await TeamService.deleteTeam(req.params.id);
      return res.status(204).end();
    } catch (err: any) {
      return res.status(400).json({ status: 'error', message: err.message });
    }
  },
};
