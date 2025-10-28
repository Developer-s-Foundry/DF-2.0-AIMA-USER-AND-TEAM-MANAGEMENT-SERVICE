import axios from 'axios';

// Define what a User looks like
export interface User {
  user_id: string;
  email: string;
  display_name: string;
  status: string;
  created_at: string;
  updated_at: string;
}

class UserService {
  private authServiceUrl: string;

  constructor() {
    this.authServiceUrl =
      process.env.AUTH_SERVICE_URL || 'http://localhost:4000';
  }

  async getUserById(userId: string): Promise<User> {
    try {
      // Tell TypeScript what data type we expect back
      const response = await axios.get<User>(
        `${this.authServiceUrl}/api/users/${userId}`
      );
      return response.data;
    } catch (error: any) {
      // Simple, version-safe Axios error check
      if (error && error.response) {
        if (error.response.status === 404) {
          throw new Error('User not found');
        }
        throw new Error(`Auth service error: ${error.message}`);
      }

      // Non-Axios or unexpected error
      throw new Error('Failed to fetch user from Auth service');
    }
  }
}

export default new UserService();
