import { Router } from "express";
import {
  createOnCallSchedule,
  updateOnCallSchedule,
  getCurrentOnCall,
  softDeleteOnCallSchedule,
} from "../controllers/OnCallSchedule.controller";
// import { authenticate } from "../middleware/auth.middleware";
// import { checkPermission } from "../middleware/role.middleware";

const router = Router();

/**
 * @route   GET /api/v1/on-call-schedules/current?teamId=<teamId>
 * @desc    Get the current on-call person for a team
 * @access  Public (or Protected, depending on setup)
 */
router.get("/current", getCurrentOnCall);

/**
 * @route   POST /api/v1/on-call-schedules
 * @desc    Create a new on-call schedule
 * @access  Protected
 */
router.post(
  "/",
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
