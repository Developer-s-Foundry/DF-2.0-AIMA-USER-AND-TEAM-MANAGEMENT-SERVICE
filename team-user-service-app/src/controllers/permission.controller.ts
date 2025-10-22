import { Request, Response } from 'express';
import {
  getAllPermissions,
  getPermissionByName,
  getPermissionsByResource,
  createPermission,
  updatePermission,
  deletePermission,
  getPermissionsByRole,
  assignPermissionToRole,
  revokePermissionFromRole,
  assignMultiplePermissionsToRole,
  getRolesByPermission,
  validatePermissionExists,
  getRolePermissionSummary,
  checkUserPermission,
  getUserPermissionsForTeam
} from '../services/permission.service';
import { RoleType } from '../models/RolePermission.model';
import { AuthenticatedRequest } from '../middleware/role.middleware';

/**
 * Permission Controller
 * 
 * Handles HTTP requests for permission and role-permission management.
 * These are typically admin-only endpoints for managing the permission system.
 * 
 * All endpoints should be protected with appropriate middleware!
 */

// ============================================
// PERMISSION CRUD ENDPOINTS
// ============================================

/**
 * GET /api/v1/permissions
 * 
 * Get all permissions in the system
 * 
 * @access Admin only
 * @returns Array of all permissions
 */
export async function listAllPermissions(req: Request, res: Response) {
  try {
    const permissions = await getAllPermissions();
    
    return res.status(200).json({
      status: 'success',
      message: 'Permissions retrieved successfully',
      data: {
        permissions,
        count: permissions.length
      }
    });
    
  } catch (error) {
    console.error('[LIST PERMISSIONS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/permissions/:permissionName
 * 
 * Get a specific permission by name
 * 
 * @access Admin only
 * @param permissionName - The permission name (e.g., 'delete_team')
 */
export async function getPermission(req: Request, res: Response) {
  try {
    const { permissionName } = req.params;
    
    const permission = await getPermissionByName(permissionName);
    
    if (!permission) {
      return res.status(404).json({
        status: 'error',
        message: `Permission '${permissionName}' not found`
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Permission retrieved successfully',
      data: { permission }
    });
    
  } catch (error) {
    console.error('[GET PERMISSION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/permissions/resource/:resourceType
 * 
 * Get all permissions for a specific resource type
 * 
 * @access Admin only
 * @param resourceType - The resource (e.g., 'team', 'member', 'service')
 */
export async function getPermissionsByResourceType(req: Request, res: Response) {
  try {
    const { resourceType } = req.params;
    
    const permissions = await getPermissionsByResource(resourceType);
    
    return res.status(200).json({
      status: 'success',
      message: `Permissions for resource '${resourceType}' retrieved successfully`,
      data: {
        resource: resourceType,
        permissions,
        count: permissions.length
      }
    });
    
  } catch (error) {
    console.error('[GET PERMISSIONS BY RESOURCE ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve permissions by resource',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/v1/permissions
 * 
 * Create a new permission
 * 
 * @access Admin only
 * @body {
 *   permission_name: string,
 *   resource: string,
 *   action: string,
 *   description?: string
 * }
 */
export async function createNewPermission(req: Request, res: Response) {
  try {
    const { permission_name, resource, action, description } = req.body;
    
    // Validation
    if (!permission_name || !resource || !action) {
      return res.status(400).json({
        status: 'error',
        message: 'Missing required fields: permission_name, resource, and action are required'
      });
    }
    
    // Validate format (lowercase, underscores only)
    const namePattern = /^[a-z_]+$/;
    if (!namePattern.test(permission_name)) {
      return res.status(400).json({
        status: 'error',
        message: 'Permission name must be lowercase with underscores only (e.g., "delete_team")'
      });
    }
    
    if (!namePattern.test(resource)) {
      return res.status(400).json({
        status: 'error',
        message: 'Resource must be lowercase with underscores only (e.g., "team")'
      });
    }
    
    if (!namePattern.test(action)) {
      return res.status(400).json({
        status: 'error',
        message: 'Action must be lowercase with underscores only (e.g., "create")'
      });
    }
    
    const permission = await createPermission({
      permission_name,
      resource,
      action,
      description
    });
    
    return res.status(201).json({
      status: 'success',
      message: 'Permission created successfully',
      data: { permission }
    });
    
  } catch (error) {
    console.error('[CREATE PERMISSION ERROR]', error);
    
    // Handle duplicate permission error
    if (error instanceof Error && error.message.includes('already exists')) {
      return res.status(409).json({
        status: 'error',
        message: error.message
      });
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to create permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * PUT /api/v1/permissions/:permissionName
 * 
 * Update an existing permission
 * 
 * @access Admin only
 * @param permissionName - The permission to update
 * @body { resource?, action?, description? }
 */
export async function updateExistingPermission(req: Request, res: Response) {
  try {
    const { permissionName } = req.params;
    const { resource, action, description } = req.body;
    
    // Build updates object (only include provided fields)
    const updates: any = {};
    if (resource !== undefined) updates.resource = resource;
    if (action !== undefined) updates.action = action;
    if (description !== undefined) updates.description = description;
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: 'error',
        message: 'No update fields provided'
      });
    }
    
    const permission = await updatePermission(permissionName, updates);
    
    if (!permission) {
      return res.status(404).json({
        status: 'error',
        message: `Permission '${permissionName}' not found`
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: 'Permission updated successfully',
      data: { permission }
    });
    
  } catch (error) {
    console.error('[UPDATE PERMISSION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to update permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/v1/permissions/:permissionName
 * 
 * Delete a permission (and all its role associations)
 * 
 * @access Admin only
 * @param permissionName - The permission to delete
 */
export async function deleteExistingPermission(req: Request, res: Response) {
  try {
    const { permissionName } = req.params;
    
    const deleted = await deletePermission(permissionName);
    
    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: `Permission '${permissionName}' not found`
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: `Permission '${permissionName}' deleted successfully`,
      data: { deleted: true }
    });
    
  } catch (error) {
    console.error('[DELETE PERMISSION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to delete permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================
// ROLE-PERMISSION MANAGEMENT ENDPOINTS
// ============================================

/**
 * GET /api/v1/roles/:role/permissions
 * 
 * Get all permissions for a specific role
 * 
 * @access Admin or team members (read-only)
 * @param role - The role ('admin', 'operator', 'viewer')
 */
export async function getRolePermissions(req: Request, res: Response) {
  try {
    const { role } = req.params;
    
    // Validate role
    if (!Object.values(RoleType).includes(role as RoleType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Must be one of: ${Object.values(RoleType).join(', ')}`
      });
    }
    
    const permissions = await getPermissionsByRole(role as RoleType);
    
    return res.status(200).json({
      status: 'success',
      message: `Permissions for role '${role}' retrieved successfully`,
      data: {
        role,
        permissions,
        count: permissions.length
      }
    });
    
  } catch (error) {
    console.error('[GET ROLE PERMISSIONS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve role permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * GET /api/v1/permissions/:permissionName/roles
 * 
 * Get all roles that have a specific permission
 * 
 * @access Admin only
 * @param permissionName - The permission name
 */
export async function getPermissionRoles(req: Request, res: Response) {
  try {
    const { permissionName } = req.params;
    
    // Check if permission exists
    const exists = await validatePermissionExists(permissionName);
    if (!exists) {
      return res.status(404).json({
        status: 'error',
        message: `Permission '${permissionName}' not found`
      });
    }
    
    const roles = await getRolesByPermission(permissionName);
    
    return res.status(200).json({
      status: 'success',
      message: `Roles with permission '${permissionName}' retrieved successfully`,
      data: {
        permission: permissionName,
        roles,
        count: roles.length
      }
    });
    
  } catch (error) {
    console.error('[GET PERMISSION ROLES ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve roles for permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/v1/roles/:role/permissions
 * 
 * Assign a permission (or multiple permissions) to a role
 * 
 * @access Admin only
 * @param role - The role to assign to
 * @body { permission_name: string } OR { permission_names: string[] }
 */
export async function assignPermissionsToRole(req: Request, res: Response) {
  try {
    const { role } = req.params;
    const { permission_name, permission_names } = req.body;
    
    // Validate role
    if (!Object.values(RoleType).includes(role as RoleType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Must be one of: ${Object.values(RoleType).join(', ')}`
      });
    }
    
    // Handle single or multiple permissions
    if (permission_names && Array.isArray(permission_names)) {
      // Assign multiple permissions
      const assignments = await assignMultiplePermissionsToRole(
        role as RoleType,
        permission_names
      );
      
      return res.status(200).json({
        status: 'success',
        message: `Assigned ${assignments.length} permission(s) to role '${role}'`,
        data: {
          role,
          assigned_count: assignments.length,
          assignments
        }
      });
      
    } else if (permission_name) {
      // Assign single permission
      const assignment = await assignPermissionToRole(
        role as RoleType,
        permission_name
      );
      
      return res.status(200).json({
        status: 'success',
        message: `Permission '${permission_name}' assigned to role '${role}'`,
        data: {
          role,
          permission: permission_name,
          assignment
        }
      });
      
    } else {
      return res.status(400).json({
        status: 'error',
        message: 'Must provide either permission_name or permission_names'
      });
    }
    
  } catch (error) {
    console.error('[ASSIGN PERMISSION ERROR]', error);
    
    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('does not exist')) {
        return res.status(404).json({
          status: 'error',
          message: error.message
        });
      }
      
      if (error.message.includes('already has permission')) {
        return res.status(409).json({
          status: 'error',
          message: error.message
        });
      }
    }
    
    return res.status(500).json({
      status: 'error',
      message: 'Failed to assign permission to role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * DELETE /api/v1/roles/:role/permissions/:permissionName
 * 
 * Revoke a permission from a role
 * 
 * @access Admin only
 * @param role - The role to revoke from
 * @param permissionName - The permission to revoke
 */
export async function revokePermissionFromRoleHandler(req: Request, res: Response) {
  try {
    const { role, permissionName } = req.params;
    
    // Validate role
    if (!Object.values(RoleType).includes(role as RoleType)) {
      return res.status(400).json({
        status: 'error',
        message: `Invalid role. Must be one of: ${Object.values(RoleType).join(', ')}`
      });
    }
    
    const revoked = await revokePermissionFromRole(
      role as RoleType,
      permissionName
    );
    
    if (!revoked) {
      return res.status(404).json({
        status: 'error',
        message: `Role '${role}' does not have permission '${permissionName}'`
      });
    }
    
    return res.status(200).json({
      status: 'success',
      message: `Permission '${permissionName}' revoked from role '${role}'`,
      data: {
        role,
        permission: permissionName,
        revoked: true
      }
    });
    
  } catch (error) {
    console.error('[REVOKE PERMISSION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to revoke permission from role',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================
// ROLE SUMMARY & OVERVIEW ENDPOINTS
// ============================================

/**
 * GET /api/v1/roles/summary
 * 
 * Get a complete summary of all roles and their permissions
 * 
 * @access Admin only (or authenticated users for read-only)
 */
export async function getRolesSummary(req: Request, res: Response) {
  try {
    const summary = await getRolePermissionSummary();
    
    return res.status(200).json({
      status: 'success',
      message: 'Role permissions summary retrieved successfully',
      data: {
        roles: summary,
        total_roles: summary.length
      }
    });
    
  } catch (error) {
    console.error('[GET ROLES SUMMARY ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve roles summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================
// USER PERMISSION CHECK ENDPOINTS
// ============================================

/**
 * GET /api/v1/users/me/permissions
 * 
 * Get all permissions the current user has on a specific team
 * 
 * @access Authenticated users
 * @query team_id - The team ID to check permissions for
 */
export async function getCurrentUserPermissions(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    const { team_id } = req.query;
    
    if (!team_id || typeof team_id !== 'string') {
      return res.status(400).json({
        status: 'error',
        message: 'team_id query parameter is required'
      });
    }
    
    const userId = req.user.id;
    const permissions = await getUserPermissionsForTeam(userId, team_id);
    
    return res.status(200).json({
      status: 'success',
      message: 'User permissions retrieved successfully',
      data: {
        user_id: userId,
        team_id,
        permissions,
        count: permissions.length
      }
    });
    
  } catch (error) {
    console.error('[GET USER PERMISSIONS ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve user permissions',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * POST /api/v1/users/me/permissions/check
 * 
 * Check if the current user has a specific permission on a team
 * 
 * @access Authenticated users
 * @body { team_id: string, permission_name: string }
 */
export async function checkCurrentUserPermission(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }
    
    const { team_id, permission_name } = req.body;
    
    if (!team_id || !permission_name) {
      return res.status(400).json({
        status: 'error',
        message: 'team_id and permission_name are required'
      });
    }
    
    const userId = req.user.id;
    const hasPermission = await checkUserPermission(userId, team_id, permission_name);
    
    return res.status(200).json({
      status: 'success',
      message: 'Permission check completed',
      data: {
        user_id: userId,
        team_id,
        permission_name,
        has_permission: hasPermission
      }
    });
    
  } catch (error) {
    console.error('[CHECK USER PERMISSION ERROR]', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to check user permission',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// ============================================
// EXPORT ALL CONTROLLERS
// ============================================

export default {
  // Permission CRUD
  listAllPermissions,
  getPermission,
  getPermissionsByResourceType,
  createNewPermission,
  updateExistingPermission,
  deleteExistingPermission,
  
  // Role-Permission Management
  getRolePermissions,
  getPermissionRoles,
  assignPermissionsToRole,
  revokePermissionFromRoleHandler,
  
  // Summaries
  getRolesSummary,
  
  // User Permissions
  getCurrentUserPermissions,
  checkCurrentUserPermission
};