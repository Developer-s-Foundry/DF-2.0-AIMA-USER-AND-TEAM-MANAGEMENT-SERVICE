import express from 'express';
import permissionController from '../controllers/permission.controller';

// import authMiddleware from '../middleware/auth.middleware'; // Role 1's middleware

const router = express.Router();

// Apply authentication to all routes
// router.use(authMiddleware);

// ============================================
// PERMISSION CRUD (Admin Only)
// ============================================

// List all permissions
router.get(
  '/',
  // Can add requireRole(RoleType.ADMIN) if you want admin-only
  permissionController.listAllPermissions
);

// Get specific permission
router.get(
  '/:permissionName',
  permissionController.getPermission
);

// Get permissions by resource type
router.get(
  '/resource/:resourceType',
  permissionController.getPermissionsByResourceType
);

// Create new permission (Admin only)
router.post(
  '/',
  // requireRole(RoleType.ADMIN), // Uncomment when auth is ready
  permissionController.createNewPermission
);

// Update permission (Admin only)
router.put(
  '/:permissionName',
  // requireRole(RoleType.ADMIN),
  permissionController.updateExistingPermission
);

// Delete permission (Admin only)
router.delete(
  '/:permissionName',
  // requireRole(RoleType.ADMIN),
  permissionController.deleteExistingPermission
);

// ============================================
// ROLE-PERMISSION MANAGEMENT
// ============================================

// Get role summary
router.get(
  '/roles/summary',
  permissionController.getRolesSummary
);

// Get permissions for a role
router.get(
  '/roles/:role/permissions',
  permissionController.getRolePermissions
);

// Get roles that have a permission
router.get(
  '/permissions/:permissionName/roles',
  permissionController.getPermissionRoles
);

// Assign permission(s) to role (Admin only)
router.post(
  '/roles/:role/permissions',
  // requireRole(RoleType.ADMIN),
  permissionController.assignPermissionsToRole
);

// Revoke permission from role (Admin only)
router.delete(
  '/roles/:role/permissions/:permissionName',
  // requireRole(RoleType.ADMIN),
  permissionController.revokePermissionFromRoleHandler
);

// ============================================
// USER PERMISSION CHECKS
// ============================================

// Get current user's permissions on a team
router.get(
  '/users/me/permissions',
  permissionController.getCurrentUserPermissions
);

// Check if current user has specific permission
router.post(
  '/users/me/permissions/check',
  permissionController.checkCurrentUserPermission
);

export default router;