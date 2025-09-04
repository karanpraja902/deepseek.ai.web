// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';

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


// Client-side cookie helper
const getClientCookie = (name: string): string => {
  if (typeof document !== 'undefined') {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  }
  return '';
};

export class AuthApiService {
  static async initializeStaticUser() {
    const token = getClientCookie("auth_token");
    console.log("Initialize static user token", token);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/init`, {
        method: 'POST',
        headers: {
          Cookie: `token=${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    const token = getClientCookie("auth_token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user?userId=${userId}`, {
        method: 'GET',
        headers: {
          Cookie: `token=${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
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
    const token = getClientCookie("auth_token");
    try {
      console.log("Login request", email, password);
      const response = await fetch(`/api/auth/login`, {
        method: 'POST',
        headers: {
          Cookie: `token=${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Token is now handled via HTTP-only cookies, no localStorage needed
      return data;
    } catch (error: unknown) {
      console.error('Login error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      throw new Error(errorMessage);
    }
  }

  static async register(name: string, email: string, password: string): Promise<AuthResponse> {

    const token = getClientCookie("auth_token");

    try {
      console.log("Register request", name, email, password);
      const response = await fetch(`/api/auth/register`, {
        method: 'POST',
        
        headers: {
          'Content-Type': 'application/json',
          Cookie: `token=${token}`,
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      // Token is now handled via HTTP-only cookies, no localStorage needed
      return data;
    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  static async getCurrentUser(): Promise<AuthResponse> {
    const token = getClientCookie("auth_token");
    console.log("Get current user token", token);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
        method: 'GET',
        headers: {
          Cookie: `token=${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include', // This will include HTTP-only cookies
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
    const token = getClientCookie("auth_token");
    try {
      await fetch(`${API_BASE_URL}/api/auth/logout`, {
        method: 'POST',
        headers: {
          Cookie: `token=${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      // No need to clear localStorage since we're not using it for tokens anymore
    } catch (error) {
      console.error('Logout error:', error);
      // Server-side cookie clearing will handle the logout
    }
  }

  static initiateGoogleLogin(): void {
    console.log("Initiating Google login - redirecting to backend");
    // Redirect directly to backend Google OAuth endpoint
    // window.location.href = `${API_BASE_URL}/api/auth/google`;
    window.location.href = `${API_BASE_URL}/api/auth/google`;
  }


  static async updateUserMemory(userId: string, memory: Record<string, unknown>) {
    const token = getClientCookie("auth_token");
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/user/${userId}/memory`, {
        method: 'PUT',
        headers: {
          Cookie: `token=${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ memory }),
        credentials: 'include',
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

