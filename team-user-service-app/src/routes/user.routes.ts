import express from 'express';
import userController from '../controllers/user.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = express.Router();

// ============================================
// APPLY AUTHENTICATION TO ALL ROUTES
// ============================================
router.use(authenticateToken);

// ============================================
// USER ENDPOINTS
// ============================================

// Get my own profile
router.get(
  '/me',
  userController.getMyProfile
);

// Get any user's profile by ID (for internal lookups)
router.get(
  '/:id',
  userController.getUserById
);

export default router;