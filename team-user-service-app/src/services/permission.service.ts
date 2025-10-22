import  { Permission, IPermission } from '../models/Permission.model';
import  { RolePermission, RoleType, IRolePermission } from '../models/RolePermission.model';
import { getUserRoleInTeam } from './mockup.member.service'; // Provided by Role 2


/**
 * Permission Service
 * 
 * This service is the central authority for all permission and access control logic.
 * It answers the fundamental question: "Can this user perform this action?"
 * 
 * Core responsibilities:
 * - Check if a user has permission to perform an action on a team
 * - Manage permissions (CRUD operations)
 * - Manage role-permission assignments
 * - Provide helper functions for authorization
 */

// ============================================
// CORE PERMISSION CHECKING FUNCTIONS
// ============================================

/**
 * Main permission check function
 * 
 * This is THE most important function - it determines if a user can do something.
 * Every protected action in the system should call this function.
 * 
 * @param userId - The ID of the user attempting the action
 * @param teamId - The ID of the team the action is being performed on
 * @param permissionName - The name of the permission (e.g., 'delete_team', 'add_member')
 * @returns true if user has permission, false otherwise
 * 
 * @example
 * const canDelete = await checkUserPermission('user-123', 'team-456', 'delete_member');
 * if (!canDelete) {
 *   throw new Error('Permission denied');
 * }
 */
export async function checkUserPermission(
  userId: string,
  teamId: string,
  permissionName: string
): Promise<boolean> {
  try {
    // Step 1: Get the user's role on this specific team (calls Role 2's service)
    const userRole = await getUserRoleInTeam(userId, teamId);
    
    // If user is not in the team, they have no permissions
    if (!userRole) {
      return false;
    }
    
    // Step 2: Check if that role has the required permission
    const hasPermission = await RolePermission.hasPermission(userRole, permissionName);
    
    return hasPermission;
    
  } catch (error) {
    console.error('Error checking user permission:', error);
    // On error, deny permission (fail-safe approach)
    return false;
  }
}

/**
 * Check if user has a specific role on a team
 * 
 * Useful when you need to verify role membership rather than specific permissions.
 * 
 * @param userId - The ID of the user
 * @param teamId - The ID of the team
 * @param requiredRole - The role to check for ('admin', 'operator', 'viewer')
 * @returns true if user has the specified role on the team
 * 
 * @example
 * const isAdmin = await checkUserRole('user-123', 'team-456', RoleType.ADMIN);
 */
export async function checkUserRole(
  userId: string,
  teamId: string,
  requiredRole: RoleType
): Promise<boolean> {
  try {
    const userRole = await getUserRoleInTeam(userId, teamId);
    return userRole === requiredRole;
  } catch (error) {
    console.error('Error checking user role:', error);
    return false;
  }
}

/**
 * Get all permissions a user has on a specific team
 * 
 * This is useful for:
 * - UI: Show/hide buttons based on what user can do
 * - Bulk permission checks
 * - User profile pages showing capabilities
 * 
 * @param userId - The ID of the user
 * @param teamId - The ID of the team
 * @returns Array of permission names the user has
 * 
 * @example
 * const permissions = await getUserPermissionsForTeam('user-123', 'team-456');
 * // Returns: ['view_team', 'edit_team', 'add_member', 'remove_member']
 */
export async function getUserPermissionsForTeam(
  userId: string,
  teamId: string
): Promise<string[]> {
  try {
    // Get user's role on the team
    const userRole = await getUserRoleInTeam(userId, teamId);
    
    if (!userRole) {
      return []; // No permissions if not in team
    }
    
    // Get all permissions for that role
    const rolePermissions = await RolePermission.getPermissionsForRole(userRole);
    
    // Extract just the permission names
    const permissionNames = rolePermissions.map((rp: any) => {
      return rp.permission_id.permission_name;
    });
    
    return permissionNames;
    
  } catch (error) {
    console.error('Error getting user permissions:', error);
    return [];
  }
}

/**
 * Check multiple permissions at once
 * 
 * Efficient way to check if user has ALL of several permissions.
 * Useful when an action requires multiple permissions.
 * 
 * @param userId - The ID of the user
 * @param teamId - The ID of the team
 * @param permissionNames - Array of permission names to check
 * @returns true only if user has ALL the specified permissions
 * 
 * @example
 * const canManageTeam = await checkMultiplePermissions(
 *   'user-123', 
 *   'team-456', 
 *   ['edit_team', 'add_member', 'remove_member']
 * );
 */
export async function checkMultiplePermissions(
  userId: string,
  teamId: string,
  permissionNames: string[]
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissionsForTeam(userId, teamId);
    
    // Check if user has all required permissions
    return permissionNames.every(permission => 
      userPermissions.includes(permission)
    );
    
  } catch (error) {
    console.error('Error checking multiple permissions:', error);
    return false;
  }
}

/**
 * Check if user has ANY of the specified permissions
 * 
 * Useful when multiple permissions can grant access to the same resource.
 * 
 * @param userId - The ID of the user
 * @param teamId - The ID of the team
 * @param permissionNames - Array of permission names
 * @returns true if user has at least one of the specified permissions
 */
export async function checkAnyPermission(
  userId: string,
  teamId: string,
  permissionNames: string[]
): Promise<boolean> {
  try {
    const userPermissions = await getUserPermissionsForTeam(userId, teamId);
    
    // Check if user has at least one required permission
    return permissionNames.some(permission => 
      userPermissions.includes(permission)
    );
    
  } catch (error) {
    console.error('Error checking any permission:', error);
    return false;
  }
}

// ============================================
// PERMISSION MANAGEMENT (CRUD)
// ============================================

/**
 * Create a new permission in the system
 * 
 * This should typically only be called by system administrators.
 * 
 * @param permissionData - The permission details
 * @returns The created permission
 * 
 * @example
 * const newPermission = await createPermission({
 *   permission_name: 'archive_team',
 *   resource: 'team',
 *   action: 'archive',
 *   description: 'Archive a team without deleting it'
 * });
 */
export async function createPermission(permissionData: {
  permission_name: string;
  resource: string;
  action: string;
  description?: string;
}): Promise<IPermission> {
  try {
    // Check if permission already exists
    const existing = await Permission.findOne({ 
      permission_name: permissionData.permission_name 
    });
    
    if (existing) {
      throw new Error(`Permission '${permissionData.permission_name}' already exists`);
    }
    
    // Create the permission
    const permission = new Permission(permissionData);
    await permission.save();
    
    return permission;
    
  } catch (error) {
    console.error('Error creating permission:', error);
    throw error;
  }
}

/**
 * Get all permissions in the system
 * 
 * @returns Array of all permissions
 */
export async function getAllPermissions(): Promise<IPermission[]> {
  try {
    return await Permission.find().sort({ resource: 1, action: 1 });
  } catch (error) {
    console.error('Error getting all permissions:', error);
    throw error;
  }
}

/**
 * Get a specific permission by name
 * 
 * @param permissionName - The name of the permission
 * @returns The permission or null if not found
 */
export async function getPermissionByName(permissionName: string): Promise<IPermission | null> {
  try {
    return await Permission.findOne({ permission_name: permissionName });
  } catch (error) {
    console.error('Error getting permission by name:', error);
    throw error;
  }
}

/**
 * Get permissions by resource type
 * 
 * @param resource - The resource type (e.g., 'team', 'member', 'service')
 * @returns Array of permissions for that resource
 * 
 * @example
 * const teamPermissions = await getPermissionsByResource('team');
 * // Returns all team-related permissions: create_team, edit_team, delete_team, etc.
 */
export async function getPermissionsByResource(resource: string): Promise<IPermission[]> {
  try {
    return await Permission.find({ resource }).sort({ action: 1 });
  } catch (error) {
    console.error('Error getting permissions by resource:', error);
    throw error;
  }
}

/**
 * Update a permission
 * 
 * @param permissionName - The name of the permission to update
 * @param updates - The fields to update
 * @returns The updated permission
 */
export async function updatePermission(
  permissionName: string,
  updates: Partial<{
    resource: string;
    action: string;
    description: string;
  }>
): Promise<IPermission | null> {
  try {
    const permission = await Permission.findOneAndUpdate(
      { permission_name: permissionName },
      updates,
      { new: true }
    );
    
    return permission;
  } catch (error) {
    console.error('Error updating permission:', error);
    throw error;
  }
}

/**
 * Delete a permission
 * 
 * WARNING: This will also remove all role-permission mappings for this permission!
 * 
 * @param permissionName - The name of the permission to delete
 * @returns true if deleted successfully
 */
export async function deletePermission(permissionName: string): Promise<boolean> {
  try {
    // Find the permission
    const permission = await Permission.findOne({ permission_name: permissionName });
    
    if (!permission) {
      throw new Error(`Permission '${permissionName}' not found`);
    }
    
    // Delete all role-permission mappings for this permission
    await RolePermission.deleteMany({ permission_id: permission._id });
    
    // Delete the permission itself
    await Permission.deleteOne({ permission_name: permissionName });
    
    return true;
  } catch (error) {
    console.error('Error deleting permission:', error);
    throw error;
  }
}

// ============================================
// ROLE-PERMISSION MANAGEMENT
// ============================================

/**
 * Get all permissions for a specific role
 * 
 * @param role - The role type ('admin', 'operator', 'viewer')
 * @returns Array of permissions for that role
 * 
 * @example
 * const operatorPerms = await getPermissionsByRole(RoleType.OPERATOR);
 */
export async function getPermissionsByRole(role: RoleType): Promise<string[]> {
  try {
    const rolePermissions = await RolePermission.getPermissionsForRole(role);
    
    return rolePermissions.map((rp: any) => rp.permission_id.permission_name);
  } catch (error) {
    console.error('Error getting permissions by role:', error);
    throw error;
  }
}

/**
 * Assign a permission to a role
 * 
 * This grants a role the ability to perform a specific action.
 * 
 * @param role - The role to grant permission to
 * @param permissionName - The permission to grant
 * @returns The created role-permission mapping
 * 
 * @example
 * await assignPermissionToRole(RoleType.OPERATOR, 'delete_service');
 * // Now operators can delete services
 */
export async function assignPermissionToRole(
  role: RoleType,
  permissionName: string
): Promise<IRolePermission> {
  try {
    // Find the permission
    const permission = await Permission.findOne({ permission_name: permissionName });
    
    if (!permission) {
      throw new Error(`Permission '${permissionName}' does not exist`);
    }
    
    // Check if this role-permission mapping already exists
    const existing = await RolePermission.findOne({
      role,
      permission_id: permission._id
    });
    
    if (existing) {
      throw new Error(`Role '${role}' already has permission '${permissionName}'`);
    }
    
    // Create the mapping
    const rolePermission = new RolePermission({
      role,
      permission_id: permission._id
    });
    
    await rolePermission.save();
    
    return rolePermission;
    
  } catch (error) {
    console.error('Error assigning permission to role:', error);
    throw error;
  }
}

/**
 * Revoke a permission from a role
 * 
 * This removes a role's ability to perform a specific action.
 * 
 * @param role - The role to revoke permission from
 * @param permissionName - The permission to revoke
 * @returns true if revoked successfully
 * 
 * @example
 * await revokePermissionFromRole(RoleType.VIEWER, 'edit_team');
 * // Viewers can no longer edit teams (if they could before)
 */
export async function revokePermissionFromRole(
  role: RoleType,
  permissionName: string
): Promise<boolean> {
  try {
    // Find the permission
    const permission = await Permission.findOne({ permission_name: permissionName });
    
    if (!permission) {
      throw new Error(`Permission '${permissionName}' does not exist`);
    }
    
    // Delete the role-permission mapping
    const result = await RolePermission.deleteOne({
      role,
      permission_id: permission._id
    });
    
    return result.deletedCount > 0;
    
  } catch (error) {
    console.error('Error revoking permission from role:', error);
    throw error;
  }
}

/**
 * Assign multiple permissions to a role at once
 * 
 * Efficient way to grant multiple permissions to a role.
 * 
 * @param role - The role to grant permissions to
 * @param permissionNames - Array of permission names
 * @returns Array of created role-permission mappings
 */
export async function assignMultiplePermissionsToRole(
  role: RoleType,
  permissionNames: string[]
): Promise<IRolePermission[]> {
  try {
    const createdMappings: IRolePermission[] = [];
    
    for (const permissionName of permissionNames) {
      try {
        const mapping = await assignPermissionToRole(role, permissionName);
        createdMappings.push(mapping);
      } catch (error) {
        // Log but continue with other permissions
        console.warn(`Could not assign permission '${permissionName}' to role '${role}':`, error);
      }
    }
    
    return createdMappings;
    
  } catch (error) {
    console.error('Error assigning multiple permissions to role:', error);
    throw error;
  }
}

/**
 * Get all roles that have a specific permission
 * 
 * Useful for auditing: "Who can delete teams?"
 * 
 * @param permissionName - The permission to check
 * @returns Array of roles that have this permission
 */
export async function getRolesByPermission(permissionName: string): Promise<RoleType[]> {
  try {
    const permission = await Permission.findOne({ permission_name: permissionName });
    
    if (!permission) {
      return [];
    }
    
    const rolePermissions = await RolePermission.find({ 
      permission_id: permission._id 
    });
    
    return rolePermissions.map(rp => rp.role);
    
  } catch (error) {
    console.error('Error getting roles by permission:', error);
    throw error;
  }
}

// ============================================
// HELPER/UTILITY FUNCTIONS
// ============================================

/**
 * Validate that a permission exists in the system
 * 
 * @param permissionName - The permission name to validate
 * @returns true if permission exists
 */
export async function validatePermissionExists(permissionName: string): Promise<boolean> {
  try {
    const permission = await Permission.findOne({ permission_name: permissionName });
    return !!permission;
  } catch (error) {
    console.error('Error validating permission:', error);
    return false;
  }
}

/**
 * Validate that multiple permissions exist
 * 
 * @param permissionNames - Array of permission names
 * @returns Object mapping permission names to whether they exist
 */
export async function validateMultiplePermissions(
  permissionNames: string[]
): Promise<Record<string, boolean>> {
  try {
    const validationResults: Record<string, boolean> = {};
    
    for (const permissionName of permissionNames) {
      validationResults[permissionName] = await validatePermissionExists(permissionName);
    }
    
    return validationResults;
    
  } catch (error) {
    console.error('Error validating multiple permissions:', error);
    throw error;
  }
}

/**
 * Get a summary of all roles and their permission counts
 * 
 * Useful for admin dashboards showing system overview.
 * 
 * @returns Summary of roles and permission counts
 */
export async function getRolePermissionSummary(): Promise<Array<{
  role: RoleType;
  permissionCount: number;
  permissions: string[];
}>> {
  try {
    const summary = [];
    
    for (const role of Object.values(RoleType)) {
      const permissions = await getPermissionsByRole(role);
      summary.push({
        role,
        permissionCount: permissions.length,
        permissions
      });
    }
    
    return summary;
    
  } catch (error) {
    console.error('Error getting role permission summary:', error);
    throw error;
  }
}

/**
 * Check if a role has admin-level permissions
 * 
 * Useful for conditional logic that treats admins differently.
 * 
 * @param role - The role to check
 * @returns true if role is admin
 */
export function isAdminRole(role: RoleType): boolean {
  return role === RoleType.ADMIN;
}

/**
 * Check if a user is an admin on any team
 * 
 * This would require collaboration with Role 2's service
 * to get all teams a user belongs to.
 * 
 * @param userId - The user ID to check
 * @returns true if user is admin on at least one team
 */
export async function isUserAdminAnywhere(userId: string): Promise<boolean> {
  // NOTE: This function would need Role 2 to provide a function like:
  // getUserTeamsWithRoles(userId) that returns all teams and roles
  
  // Placeholder implementation:
  // const userTeams = await getUserTeamsWithRoles(userId);
  // return userTeams.some(team => team.role === RoleType.ADMIN);
  
  throw new Error('This function requires implementation with Role 2 collaboration');
}

// ============================================
// EXPORT ALL FUNCTIONS
// ============================================

export default {
  // Core permission checking
  checkUserPermission,
  checkUserRole,
  getUserPermissionsForTeam,
  checkMultiplePermissions,
  checkAnyPermission,
  
  // Permission management
  createPermission,
  getAllPermissions,
  getPermissionByName,
  getPermissionsByResource,
  updatePermission,
  deletePermission,
  
  // Role-permission management
  getPermissionsByRole,
  assignPermissionToRole,
  revokePermissionFromRole,
  assignMultiplePermissionsToRole,
  getRolesByPermission,
  
  // Helpers
  validatePermissionExists,
  validateMultiplePermissions,
  getRolePermissionSummary,
  isAdminRole,
  isUserAdminAnywhere
};