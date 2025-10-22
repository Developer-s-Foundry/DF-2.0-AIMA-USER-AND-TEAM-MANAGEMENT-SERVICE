import { Team, ITeam } from "../models/Team.model";

export const createTeam = async (data: { name: string, description?: string }): Promise<ITeam> => {
    const existing = await Team.findOne({ name: data.name });
    if (existing) throw new Error("Team name already exists");

    return await Team.create(data);
};

export const listTeams = async () => {
    return await Team.find();
};

export const getTeamById = async (id: string) => {
    return await Team.findById(id);
};

export const deleteTeam = async (id: string) => {
    const team = await Team.findById(id);
    if (!team) throw new Error("Team name does not exist");
    return await Team.findByIdAndDelete(id);
};

