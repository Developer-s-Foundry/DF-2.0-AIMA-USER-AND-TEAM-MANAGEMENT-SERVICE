import { Request, Response, NextFunction } from 'express';
import { 
  checkUserPermission, 
  checkUserRole,
  getUserPermissionsForTeam 
} from '../services/permission.service';
import { RoleType } from '../models/RolePermission.model';

/**
 * Role Middleware
 * 
 * This is THE BOUNCER of your entire system.
 * It protects routes by checking if users have the required permissions.
 * 
 * Every protected route should use one of these middleware functions
 * to ensure only authorized users can access it.
 */

// ============================================
// EXTENDED REQUEST INTERFACE
// ============================================

/**
 * Extended Express Request with user information
 * 
 * After auth.middleware.ts validates the JWT, it should attach:
 * - req.user.id (user_id from the token)
 * 
 * This middleware expects that structure.
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;           // user_id extracted from JWT
    email?: string;       // optional - if auth middleware includes it
    [key: string]: any;   // other user properties
  };
}

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Extract team ID from request
 * 
 * Checks multiple places where team_id might be:
 * 1. URL params: /teams/:teamId/members
 * 2. URL params: /teams/:team_id/members
 * 3. Request body: { team_id: "..." }
 * 4. Query params: ?team_id=...
 * 
 * @param req - The Express request
 * @returns The team ID or null if not found
 */
function extractTeamId(req: Request): string | null {
  // Try params first (most common)
  if (req.params.teamId) return req.params.teamId;
  if (req.params.team_id) return req.params.team_id;
  
  // Try body
  if (req.body?.team_id) return req.body.team_id;
  if (req.body?.teamId) return req.body.teamId;
  
  // Try query params
  if (req.query?.team_id) return req.query.team_id as string;
  if (req.query?.teamId) return req.query.teamId as string;
  
  return null;
}

/**
 * Send standardized permission denied response
 */
function sendPermissionDenied(res: Response, message?: string): Response {
  return res.status(403).json({
    status: 'error',
    message: message || 'You do not have permission to perform this action',
    error: 'PERMISSION_DENIED'
  });
}

/**
 * Send standardized unauthorized response
 */
function sendUnauthorized(res: Response, message?: string): Response {
  return res.status(401).json({
    status: 'error',
    message: message || 'Authentication required',
    error: 'UNAUTHORIZED'
  });
}

/**
 * Send standardized bad request response
 */
function sendBadRequest(res: Response, message: string): Response {
  return res.status(400).json({
    status: 'error',
    message,
    error: 'BAD_REQUEST'
  });
}

// ============================================
// MAIN PERMISSION MIDDLEWARE
// ============================================

/**
 * Check if user has a specific permission on a team
 * 
 * This is the PRIMARY middleware function you'll use most.
 * It checks if the authenticated user has a specific permission.
 * 
 * @param permissionName - The permission required (e.g., 'delete_member')
 * 
 * @example
 * // Protect a route that deletes team members
 * router.delete(
 *   '/teams/:teamId/members/:memberId',
 *   requirePermission('remove_member'),
 *   memberController.removeMember
 * );
 */
export function requirePermission(permissionName: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      // Step 1: Check if user is authenticated
      if (!req.user || !req.user.id) {
        return sendUnauthorized(res, 'You must be logged in to perform this action');
      }
      
      const userId = req.user.id;
      
      // Step 2: Extract team ID from request
      const teamId = extractTeamId(req);
      
      if (!teamId) {
        return sendBadRequest(res, 'Team ID is required for this operation');
      }
      
      // Step 3: Check if user has the required permission
      const hasPermission = await checkUserPermission(userId, teamId, permissionName);
      
      if (!hasPermission) {
        console.warn(`[PERMISSION DENIED] User ${userId} attempted '${permissionName}' on team ${teamId}`);
        return sendPermissionDenied(
          res,
          `You do not have permission to ${permissionName.replace(/_/g, ' ')}`
        );
      }
      
      // Step 4: Permission granted - attach team ID to request for controllers
      req.params.teamId = teamId; // Normalize the param name
      
      console.log(`[PERMISSION GRANTED] User ${userId} can '${permissionName}' on team ${teamId}`);
      
      // Allow request to proceed
      next();
      
    } catch (error) {
      console.error('[PERMISSION CHECK ERROR]', error);
      return res.status(500).json({
        status: 'error',
        message: 'An error occurred while checking permissions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

/**
 * Check if user has ANY of the specified permissions
 * 
 * Useful when multiple permissions can grant access to the same resource.
 * 
 * @param permissionNames - Array of permission names
 * 
 * @example
 * // Allow if user can either edit OR view team
 * router.get(
 *   '/teams/:teamId',
 *   requireAnyPermission(['edit_team', 'view_team']),
 *   teamController.getTeam
 * );
 */
export function requireAnyPermission(permissionNames: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return sendUnauthorized(res);
      }
      
      const userId = req.user.id;
      const teamId = extractTeamId(req);
      
      if (!teamId) {
        return sendBadRequest(res, 'Team ID is required');
      }
      
      // Check each permission - grant access if ANY match
      for (const permission of permissionNames) {
        const hasPermission = await checkUserPermission(userId, teamId, permission);
        if (hasPermission) {
          req.params.teamId = teamId;
          console.log(`[PERMISSION GRANTED] User ${userId} has '${permission}' on team ${teamId}`);
          return next();
        }
      }
      
      // None of the permissions matched
      console.warn(`[PERMISSION DENIED] User ${userId} lacks any of [${permissionNames.join(', ')}] on team ${teamId}`);
      return sendPermissionDenied(res);
      
    } catch (error) {
      console.error('[PERMISSION CHECK ERROR]', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking permissions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

/**
 * Check if user has ALL of the specified permissions
 * 
 * Useful when an action requires multiple permissions.
 * 
 * @param permissionNames - Array of permission names
 * 
 * @example
 * // Require both edit AND delete permissions
 * router.delete(
 *   '/teams/:teamId',
 *   requireAllPermissions(['edit_team', 'delete_team']),
 *   teamController.deleteTeam
 * );
 */
export function requireAllPermissions(permissionNames: string[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return sendUnauthorized(res);
      }
      
      const userId = req.user.id;
      const teamId = extractTeamId(req);
      
      if (!teamId) {
        return sendBadRequest(res, 'Team ID is required');
      }
      
      // Check each permission - all must match
      for (const permission of permissionNames) {
        const hasPermission = await checkUserPermission(userId, teamId, permission);
        if (!hasPermission) {
          console.warn(`[PERMISSION DENIED] User ${userId} lacks '${permission}' on team ${teamId}`);
          return sendPermissionDenied(
            res,
            `You need '${permission.replace(/_/g, ' ')}' permission for this action`
          );
        }
      }
      
      // All permissions matched
      req.params.teamId = teamId;
      console.log(`[PERMISSION GRANTED] User ${userId} has all required permissions on team ${teamId}`);
      next();
      
    } catch (error) {
      console.error('[PERMISSION CHECK ERROR]', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking permissions',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

// ============================================
// ROLE-BASED MIDDLEWARE
// ============================================

/**
 * Require user to have a specific role on the team
 * 
 * Use this when you want to restrict by role rather than specific permissions.
 * 
 * @param role - The required role
 * 
 * @example
 * // Only admins can access this route
 * router.post(
 *   '/teams/:teamId/settings',
 *   requireRole(RoleType.ADMIN),
 *   teamController.updateSettings
 * );
 */
export function requireRole(role: RoleType) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return sendUnauthorized(res);
      }
      
      const userId = req.user.id;
      const teamId = extractTeamId(req);
      
      if (!teamId) {
        return sendBadRequest(res, 'Team ID is required');
      }
      
      const hasRole = await checkUserRole(userId, teamId, role);
      
      if (!hasRole) {
        console.warn(`[ROLE DENIED] User ${userId} is not '${role}' on team ${teamId}`);
        return sendPermissionDenied(
          res,
          `You must be a team ${role} to perform this action`
        );
      }
      
      req.params.teamId = teamId;
      console.log(`[ROLE GRANTED] User ${userId} is '${role}' on team ${teamId}`);
      next();
      
    } catch (error) {
      console.error('[ROLE CHECK ERROR]', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking role',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

/**
 * Require user to be at least a certain role level
 * 
 * Role hierarchy: admin > operator > viewer
 * 
 * @param minRole - Minimum required role
 * 
 * @example
 * // Allow admins and operators, but not viewers
 * router.put(
 *   '/teams/:teamId/members/:memberId',
 *   requireMinRole(RoleType.OPERATOR),
 *   memberController.updateMember
 * );
 */
export function requireMinRole(minRole: RoleType) {
  // Define role hierarchy
  const roleHierarchy: Record<RoleType, number> = {
    [RoleType.ADMIN]: 3,
    [RoleType.OPERATOR]: 2,
    [RoleType.VIEWER]: 1
  };
  
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return sendUnauthorized(res);
      }
      
      const userId = req.user.id;
      const teamId = extractTeamId(req);
      
      if (!teamId) {
        return sendBadRequest(res, 'Team ID is required');
      }
      
      // Get user's actual role
      const { getUserRoleInTeam } = await import('../services/mockup.member.service');
      const userRole = await getUserRoleInTeam(userId, teamId);
      
      if (!userRole) {
        console.warn(`[ROLE DENIED] User ${userId} is not a member of team ${teamId}`);
        return sendPermissionDenied(res, 'You are not a member of this team');
      }
      
      // Compare role levels
      const userLevel = roleHierarchy[userRole];
      const requiredLevel = roleHierarchy[minRole];
      
      if (userLevel < requiredLevel) {
        console.warn(`[ROLE DENIED] User ${userId} role '${userRole}' is below required '${minRole}'`);
        return sendPermissionDenied(
          res,
          `You must be at least a team ${minRole} to perform this action`
        );
      }
      
      req.params.teamId = teamId;
      console.log(`[ROLE GRANTED] User ${userId} is '${userRole}' (>= ${minRole}) on team ${teamId}`);
      next();
      
    } catch (error) {
      console.error('[ROLE CHECK ERROR]', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking role level',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

// ============================================
// TEAM MEMBERSHIP MIDDLEWARE
// ============================================

/**
 * Simply check if user is a member of the team (any role)
 * 
 * Use this for routes that any team member can access.
 * 
 * @example
 * // Any team member can view team details
 * router.get(
 *   '/teams/:teamId',
 *   requireTeamMembership(),
 *   teamController.getTeamDetails
 * );
 */
export function requireTeamMembership() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return sendUnauthorized(res);
      }
      
      const userId = req.user.id;
      const teamId = extractTeamId(req);
      
      if (!teamId) {
        return sendBadRequest(res, 'Team ID is required');
      }
      
      const { getUserRoleInTeam } = await import('../services/mockup.member.service');
      const userRole = await getUserRoleInTeam(userId, teamId);
      
      if (!userRole) {
        console.warn(`[MEMBERSHIP DENIED] User ${userId} is not a member of team ${teamId}`);
        return sendPermissionDenied(res, 'You are not a member of this team');
      }
      
      req.params.teamId = teamId;
      console.log(`[MEMBERSHIP GRANTED] User ${userId} is a member of team ${teamId}`);
      next();
      
    } catch (error) {
      console.error('[MEMBERSHIP CHECK ERROR]', error);
      return res.status(500).json({
        status: 'error',
        message: 'Error checking team membership',
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  };
}

// ============================================
// OPTIONAL: ATTACH PERMISSIONS TO REQUEST
// ============================================

/**
 * Attach user's permissions to request object for controller use
 * 
 * This doesn't block the request, it just adds permission data
 * that controllers can use for conditional logic.
 * 
 * @example
 * router.get(
 *   '/teams/:teamId/dashboard',
 *   attachUserPermissions(),
 *   dashboardController.getDashboard
 * );
 * 
 * // In controller:
 * const permissions = req.permissions; // Array of permission names
 */
export function attachUserPermissions() {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.user || !req.user.id) {
        return next(); // Skip if not authenticated
      }
      
      const userId = req.user.id;
      const teamId = extractTeamId(req);
      
      if (!teamId) {
        return next(); // Skip if no team context
      }
      
      // Get all permissions for this user on this team
      const permissions = await getUserPermissionsForTeam(userId, teamId);
      
      // Attach to request
      (req as any).permissions = permissions;
      (req as any).teamId = teamId;
      
      console.log(`[PERMISSIONS ATTACHED] User ${userId} has ${permissions.length} permissions on team ${teamId}`);
      next();
      
    } catch (error) {
      console.error('[ATTACH PERMISSIONS ERROR]', error);
      // Don't block request on error, just continue without permissions
      next();
    }
  };
}

// ============================================
// EXPORT ALL MIDDLEWARE
// ============================================

export default {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireRole,
  requireMinRole,
  requireTeamMembership,
  attachUserPermissions
};