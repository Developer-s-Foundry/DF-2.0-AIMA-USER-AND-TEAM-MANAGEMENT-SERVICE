import { Router } from "express";
import { getResponsibilityForService } from "../controllers/internal.controller";
import { verifyInternalSecret } from "../middleware/internalAuth.middleware";

const router = Router();

/**
 * @fileoverview Internal service-to-service routes
 * These routes are NOT meant for external/public access.
 * Access is restricted using an internal shared secret (verifyInternalSecret middleware).
 */

// Apply internal authentication to all internal routes
router.use(verifyInternalSecret);

/**
 * @route   GET /api/v1/internal/responsibility?serviceId=...
 * @desc    Retrieve responsibility or escalation info for a specific service
 * @access  Internal (requires internal secret header)
 */
router.get("/responsibility", getResponsibilityForService);

export default router;
