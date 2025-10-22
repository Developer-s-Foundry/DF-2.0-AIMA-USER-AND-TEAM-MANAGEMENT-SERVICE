import { Router } from "express";
import {
  getPolicyForTeam,
  upsertPolicy,
  softDeletePolicy,
  restorePolicy,
} from "../controllers/escalationPolicy.controller";
// import { authenticate } from "../middleware/auth.middleware";
// import { checkPermission } from "../middleware/role.middleware"; // for RBAC (future)

const router = Router();

/**
 * @route   GET /api/v1/escalation-policies
 * @desc    Fetch escalation policy for a specific team (optionally by version)
 * @query   teamId=<ObjectId>&version=<number>
 * @access  Public (can be restricted later)
 */
router.get("/", getPolicyForTeam);

/**
 * @route   POST /api/v1/escalation-policies
 * @desc    Create or update an escalation policy (handles version conflicts)
 * @access  Protected
 */
router.post(
  "/",
  // authenticate, // 🔐 Add JWT middleware when ready
  // checkPermission('manage_escalation_policy'),
  upsertPolicy
);

/**
 * @route   DELETE /api/v1/escalation-policies/:id
 * @desc    Soft delete an escalation policy
 * @access  Protected
 */
router.delete(
  "/:id",
  // authenticate,
  // checkPermission('delete_escalation_policy'),
  softDeletePolicy
);

/**
 * @route   PATCH /api/v1/escalation-policies/:id/restore
 * @desc    Restore a previously soft-deleted escalation policy
 * @access  Protected
 */
router.patch(
  "/:id/restore",
  // authenticate,
  // checkPermission('restore_escalation_policy'),
  restorePolicy
);

export default router;
