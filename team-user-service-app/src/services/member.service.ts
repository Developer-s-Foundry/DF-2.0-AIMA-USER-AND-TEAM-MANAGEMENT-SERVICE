import { TeamMember, ITeamMember } from "../models/TeamMember.model";
// import { RoleType } from "../models/RolePermission.model";

export const addUserToTeam = async (userId: string, teamId: string, role: string): Promise<ITeamMember> => {
    const exists = await TeamMember.findOne({ userId, teamId });
    if (exists) throw new Error("ser already in team");
    
    return TeamMember.create({ userId, teamId, role });
};

export const removeUserFromTeam = async (userId: string, teamId: string): Promise<void> => {
    await TeamMember.findOneAndDelete({ userId, teamId });
};

export const updateUserRoleInTeam = async (userId: string, teamId: string, role: string): Promise<void> => {
    await TeamMember.updateOne({ userId, teamId }, { role });
};

export const getTeamMembers = async (teamId: string): Promise<ITeamMember[]> => {
    return TeamMember.find({ teamId });
};

export const getUserTeams = async (userId: string): Promise<ITeamMember[]> => {
    return TeamMember.find({ userId }).populate("teamId");
};

export const getUserRoleInTeam = async (userId: string, teamId: string): Promise<string | null> => {
    const member = await TeamMember.findOne({ userId, teamId });
    return member ? member.role : null;
};

export const isUserInTeam = async (userId: string, teamId: string): Promise<boolean> => {
    return !!(await TeamMember.findOne({ userId, teamId }));
};


