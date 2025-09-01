const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  username?: string;
  avatar?: string;
  provider?: string;
  preferences?: {
    theme?: string;
    language?: string;
    aiModel?: string;
    conversationStyle?: string;
    topics?: string[];
  };
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data?: {
    token?: string;
    user?: AuthUser;
  };
  error?: string;
}

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

  static async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage if provided
      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
      }

      return data;
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      throw new Error(errorMessage);
    }
  }

  static async register(name: string, email: string, password: string): Promise<AuthResponse> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Store token in localStorage if provided
      if (data.data?.token) {
        localStorage.setItem('auth_token', data.data.token);
      }

      return data;
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  static async getCurrentUser(): Promise<AuthResponse> {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get user');
      }

      return data;
    } catch (error: unknown) {
      console.error('Get current user error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to get user';
      throw new Error(errorMessage);
    }
  }

  static async logout(): Promise<void> {
    try {
      await fetch(`${API_BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // Clear local storage
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout error:', error);
      // Clear local storage even if request fails
      localStorage.removeItem('auth_token');
    }
  }

  static initiateGoogleLogin(): void {
    window.location.href = `${API_BASE_URL}/auth/google`;
  }

  static async updateUserMemory(userId: string, memory: Record<string, unknown>) {
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

