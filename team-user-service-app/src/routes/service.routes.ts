import { Router } from "express";
import {
  getAllServices,
  getTeamForService,
  createService,
  updateService,
} from "../controllers/service.controller";
// import { authenticate } from "../middleware/auth.middleware";
// import { checkPermission } from "../middleware/role.middleware";

const router = Router();

/**
 * @route   GET /api/v1/services
 * @desc    Fetch all registered services (optionally with their team info)
 * @access  Public or Protected (depending on business rules)
 */
router.get(
  "/",
  // authenticate,
  getAllServices
);

/**
 * @route   GET /api/v1/services/:serviceName/team
 * @desc    Get the team associated with a specific service
 * @access  Public or Protected
 */
router.get(
  "/:serviceName/team",
  // authenticate,
  getTeamForService
);

/**
 * @route   POST /api/v1/services
 * @desc    Create a new service
 * @access  Protected (Admin or Manager role)
 */
router.post(
  "/",
  // authenticate,
  // checkPermission('create_service'),
  createService
);

/**
 * @route   PATCH /api/v1/services/:id
 * @desc    Update an existing service
 * @access  Protected
 */
router.patch(
  "/:id",
  // authenticate,
  // checkPermission('update_service'),
  updateService
);

export default router;
