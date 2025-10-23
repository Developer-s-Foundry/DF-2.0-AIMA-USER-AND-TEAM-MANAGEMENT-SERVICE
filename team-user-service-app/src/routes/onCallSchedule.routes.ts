import { Router } from "express";
import {
  createOnCallSchedule,
  updateOnCallSchedule,
  getCurrentOnCall,
  softDeleteOnCallSchedule,
} from "../controllers/OnCallSchedule.controller";
// import { authenticate } from "../middleware/auth.middleware";
import { requirePermission } from "../middleware/role.middleware";

const router = Router();

/**
 * @route   GET /api/v1/on-call-schedules/current?teamId=<teamId>
 * @desc    Get the current on-call person for a team
 * @access  Public (or Protected, depending on setup)
 */
router.get(
  "/current",
  requirePermission("view_oncall_schedule"),
  getCurrentOnCall
);

/**
 * @route   POST /api/v1/on-call-schedules
 * @desc    Create a new on-call schedule
 * @access  Protected
 */
router.post(
  "/",
  requirePermission("create_oncall_schedule"),
  // authenticate,
  // checkPermission('manage_on_call_schedule'),
  createOnCallSchedule
);

/**
 * @route   PATCH /api/v1/on-call-schedules/:id
 * @desc    Update an existing on-call schedule
 * @access  Protected
 */
router.patch(
  "/:id",
  requirePermission("update_oncall_schedule"),
  // authenticate,
  // checkPermission('manage_on_call_schedule'),
  updateOnCallSchedule
);

/**
 * @route   DELETE /api/v1/on-call-schedules/:id
 * @desc    Soft delete an on-call schedule
 * @access  Protected
 */
router.delete(
  "/:id",
  // authenticate,
  // checkPermission('delete_on_call_schedule'),
  softDeleteOnCallSchedule
);

export default router;
