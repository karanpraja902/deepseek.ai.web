const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export class AuthApiService {
  static async initializeStaticUser() {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/init`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to initialize static user');
      }

      return await response.json();
    } catch (error) {
      console.error('Initialize static user error:', error);
      throw error;
    }
  }

  static async getUserWithMemory(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user?userId=${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to get user with memory');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user with memory error:', error);
      throw error;
    }
  }

  static async login(email: string, password: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      return await response.json();
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  static async updateUserMemory(userId: string, memory: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/user/${userId}/memory`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memory }),
      });

      if (!response.ok) {
        throw new Error('Failed to update user memory');
      }

      return await response.json();
    } catch (error) {
      console.error('Update user memory error:', error);
      throw error;
    }
  }
}
