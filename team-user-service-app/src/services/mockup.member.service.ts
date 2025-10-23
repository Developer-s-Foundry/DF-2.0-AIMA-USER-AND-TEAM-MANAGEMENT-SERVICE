import { RoleType } from '../models/RolePermission.model';

/**
 * MOCK Member Service
 * 
 * This is a TEMPORARY mock implementation of Role 2's member.service.ts
 * Use this for development and testing until Role 2 completes their actual implementation.
 * 
 * ⚠️ WARNING: Replace this with the real member.service.ts from Role 2 before production!
 */

// Mock data structure to simulate User_Team table
// In production, Role 2 will query their actual database
interface MockUserTeam {
  userId: string;
  teamId: string;
  role: RoleType;
}

// Mock database - simulates some users and their team memberships
const mockUserTeams: MockUserTeam[] = [
  // User 'user-123' (Jane) - Admin on Database Team, Operator on Auth Team
  { userId: 'user-123', teamId: 'team-db', role: RoleType.ADMIN },
  { userId: 'user-123', teamId: 'team-auth', role: RoleType.OPERATOR },
  
  // User 'user-456' (John) - Operator on Database Team
  { userId: 'user-456', teamId: 'team-db', role: RoleType.OPERATOR },
  
  // User 'user-789' (Sarah) - Viewer on Database Team, Viewer on Auth Team
  { userId: 'user-789', teamId: 'team-db', role: RoleType.VIEWER },
  { userId: 'user-789', teamId: 'team-auth', role: RoleType.VIEWER },
  
  // User 'user-101' (Mike) - Admin on Auth Team
  { userId: 'user-101', teamId: 'team-auth', role: RoleType.ADMIN },
  
  // User 'user-202' (Lisa) - Operator on Payment Team
  { userId: 'user-202', teamId: 'team-payment', role: RoleType.OPERATOR },
];

/**
 * Get the role a user has on a specific team
 * 
 * This is the MAIN function that your permission.service.ts needs.
 * Role 2 will implement the real version that queries the User_Team table.
 * 
 * @param userId - The ID of the user
 * @param teamId - The ID of the team
 * @returns The user's role on that team, or null if they're not a member
 * 
 * @example
 * const role = await getUserRoleInTeam('user-123', 'team-db');
 * // Returns: 'admin'
 * 
 * const noRole = await getUserRoleInTeam('user-999', 'team-db');
 * // Returns: null (user not in team)
 */
export async function getUserRoleInTeam(
  userId: string,
  teamId: string
): Promise<RoleType | null> {
  // Simulate async database call with small delay
  await new Promise(resolve => setTimeout(resolve, 10));
  
  console.log(`[MOCK] Getting role for user ${userId} on team ${teamId}`);
  
  // Find the user-team relationship
  const userTeam = mockUserTeams.find(
    ut => ut.userId === userId && ut.teamId === teamId
  );
  
  if (!userTeam) {
    console.log(`[MOCK] User ${userId} is not a member of team ${teamId}`);
    return null;
  }
  
  console.log(`[MOCK] User ${userId} has role '${userTeam.role}' on team ${teamId}`);
  return userTeam.role;
}

/**
 * Get all teams a user belongs to with their roles
 * 
 * Useful for: "Show me all teams this user is part of"
 * 
 * @param userId - The ID of the user
 * @returns Array of teams with the user's role on each
 */
export async function getUserTeamsWithRoles(userId: string): Promise<Array<{
  teamId: string;
  role: RoleType;
}>> {
  await new Promise(resolve => setTimeout(resolve, 10));
  
  console.log(`[MOCK] Getting all teams for user ${userId}`);
  
  const userTeams = mockUserTeams
    .filter(ut => ut.userId === userId)
    .map(ut => ({
      teamId: ut.teamId,
      role: ut.role
    }));
  
  console.log(`[MOCK] User ${userId} belongs to ${userTeams.length} team(s)`);
  return userTeams;
}

/**
 * Check if a user is a member of a team (any role)
 * 
 * @param userId - The ID of the user
 * @param teamId - The ID of the team
 * @returns true if user is a member of the team
 */
export async function isUserInTeam(
  userId: string,
  teamId: string
): Promise<boolean> {
  await new Promise(resolve => setTimeout(resolve, 10));
  
  const isMember = mockUserTeams.some(
    ut => ut.userId === userId && ut.teamId === teamId
  );
  
  console.log(`[MOCK] User ${userId} ${isMember ? 'IS' : 'IS NOT'} in team ${teamId}`);
  return isMember;
}

/**
 * Get all members of a team with their roles
 * 
 * @param teamId - The ID of the team
 * @returns Array of users and their roles on the team
 */
export async function getTeamMembers(teamId: string): Promise<Array<{
  userId: string;
  role: RoleType;
}>> {
  await new Promise(resolve => setTimeout(resolve, 10));
  
  console.log(`[MOCK] Getting all members of team ${teamId}`);
  
  const members = mockUserTeams
    .filter(ut => ut.teamId === teamId)
    .map(ut => ({
      userId: ut.userId,
      role: ut.role
    }));
  
  console.log(`[MOCK] Team ${teamId} has ${members.length} member(s)`);
  return members;
}

/**
 * Add a user to a team with a specific role
 * (Mock - doesn't actually persist)
 * 
 * @param userId - The ID of the user to add
 * @param teamId - The ID of the team
 * @param role - The role to assign
 */
export async function addUserToTeam(
  userId: string,
  teamId: string,
  role: RoleType
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10));
  
  console.log(`[MOCK] Adding user ${userId} to team ${teamId} with role '${role}'`);
  
  // Check if already exists
  const exists = mockUserTeams.some(
    ut => ut.userId === userId && ut.teamId === teamId
  );
  
  if (exists) {
    throw new Error(`User ${userId} is already a member of team ${teamId}`);
  }
  
  // Add to mock data (won't persist between restarts)
  mockUserTeams.push({ userId, teamId, role });
  console.log(`[MOCK] Successfully added user ${userId} to team ${teamId}`);
}

/**
 * Remove a user from a team
 * (Mock - doesn't actually persist)
 * 
 * @param userId - The ID of the user to remove
 * @param teamId - The ID of the team
 */
export async function removeUserFromTeam(
  userId: string,
  teamId: string
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10));
  
  console.log(`[MOCK] Removing user ${userId} from team ${teamId}`);
  
  const index = mockUserTeams.findIndex(
    ut => ut.userId === userId && ut.teamId === teamId
  );
  
  if (index === -1) {
    throw new Error(`User ${userId} is not a member of team ${teamId}`);
  }
  
  // Remove from mock data (won't persist between restarts)
  mockUserTeams.splice(index, 1);
  console.log(`[MOCK] Successfully removed user ${userId} from team ${teamId}`);
}

/**
 * Update a user's role on a team
 * (Mock - doesn't actually persist)
 * 
 * @param userId - The ID of the user
 * @param teamId - The ID of the team
 * @param newRole - The new role to assign
 */
export async function updateUserRoleInTeam(
  userId: string,
  teamId: string,
  newRole: RoleType
): Promise<void> {
  await new Promise(resolve => setTimeout(resolve, 10));
  
  console.log(`[MOCK] Updating user ${userId}'s role on team ${teamId} to '${newRole}'`);
  
  const userTeam = mockUserTeams.find(
    ut => ut.userId === userId && ut.teamId === teamId
  );
  
  if (!userTeam) {
    throw new Error(`User ${userId} is not a member of team ${teamId}`);
  }
  
  userTeam.role = newRole;
  console.log(`[MOCK] Successfully updated role`);
}

// ============================================
// MOCK DATA UTILITIES (for testing)
// ============================================

/**
 * Get all mock data (for debugging)
 */
export function getMockData(): MockUserTeam[] {
  return [...mockUserTeams];
}

/**
 * Reset mock data to initial state
 */
export function resetMockData(): void {
  mockUserTeams.length = 0;
  mockUserTeams.push(
    { userId: 'user-123', teamId: 'team-db', role: RoleType.ADMIN },
    { userId: 'user-123', teamId: 'team-auth', role: RoleType.OPERATOR },
    { userId: 'user-456', teamId: 'team-db', role: RoleType.OPERATOR },
    { userId: 'user-789', teamId: 'team-db', role: RoleType.VIEWER },
    { userId: 'user-789', teamId: 'team-auth', role: RoleType.VIEWER },
    { userId: 'user-101', teamId: 'team-auth', role: RoleType.ADMIN },
    { userId: 'user-202', teamId: 'team-payment', role: RoleType.OPERATOR }
  );
  console.log('[MOCK] Reset mock data to initial state');
}

/**
 * Add custom mock user-team relationship (for testing)
 */
export function addMockUserTeam(userId: string, teamId: string, role: RoleType): void {
  mockUserTeams.push({ userId, teamId, role });
  console.log(`[MOCK] Added custom mock: user ${userId} → team ${teamId} (${role})`);
}

/**
 * Print current mock data (for debugging)
 */
export function printMockData(): void {
  console.log('\n=== MOCK USER-TEAM DATA ===');
  mockUserTeams.forEach(ut => {
    console.log(`  User ${ut.userId} → Team ${ut.teamId} [${ut.role}]`);
  });
  console.log('===========================\n');
}

// ============================================
// EXPORT
// ============================================

export default {
  getUserRoleInTeam,
  getUserTeamsWithRoles,
  isUserInTeam,
  getTeamMembers,
  addUserToTeam,
  removeUserFromTeam,
  updateUserRoleInTeam,
  getMockData,
  resetMockData,
  addMockUserTeam,
  printMockData
};