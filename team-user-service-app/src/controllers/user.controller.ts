import { Request, Response, NextFunction } from 'express';
import userService from '../services/user.service';

// Extended Request with userId from middleware
interface AuthRequest<P = any, ResBody = any, ReqBody = any, ReqQuery = any>
  extends Request<P, ResBody, ReqBody, ReqQuery> {
  userId?: string;
}

class UserController {
  // GET /users/me - Get my own profile
  async getMyProfile(
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const userId = req.userId;

      if (!userId) {
        res.status(401).json({ message: 'User not authenticated' });
        return;
      }

      const user = await userService.getUserById(userId);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : 'Failed to fetch user profile',
      });
    }
  }

  // GET /users/:id - Get any user's profile (for internal lookups)
  async getUserById(
    req: AuthRequest<{ id: string }>, // 👈 add params type
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params; // ✅ Type-safe now

      const user = await userService.getUserById(id);

      res.status(200).json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : 'Failed to fetch user',
      });
    }
  }
}

export default new UserController();
