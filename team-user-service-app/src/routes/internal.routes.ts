import { Router } from "express";
import { getResponsibilityForService } from "../controllers/internal.controller";
import { verifyInternalSecret } from "../middleware/internalAuth.middleware";

/**
 * INTERNAL ROUTES
 * -----------------------------------------------------
 * These routes are used exclusively for inter-service communication.
 * They are NOT exposed publicly and require internal authentication
 * via the `verifyInternalSecret` middleware.
 *
 * Clients must include the following headers:
 *  - x-internal-secret-version: <version>
 *  - x-internal-secret: <secret>
 */

const router = Router();

//Apply authentication to all internal routes
router.use(verifyInternalSecret);

/**
 * @route   GET /internal/responsibility?serviceId=...
 * @desc    Retrieve the team or user responsible for a given service.
 * @access  Internal Only
 */
router.get("/responsibility", getResponsibilityForService);

export default router;
