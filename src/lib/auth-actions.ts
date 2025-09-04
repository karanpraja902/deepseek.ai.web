'use server'

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

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

const getAuthHeaders = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value || cookieStore.get('token')?.value || '';
  
  return {
    'Content-Type': 'application/json',
    'Cookie': `auth_token=${token}; token=${token}`,
  };
};

export async function initializeStaticUserAction(): Promise<AuthResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/auth/init`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to initialize static user');
    }

    return await response.json();
  } catch (error) {
    console.error('Initialize static user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to initialize user'
    };
  }
}

export async function getUserWithMemoryAction(userId: string): Promise<AuthResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/auth/user?userId=${userId}`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to get user with memory');
    }

    return await response.json();
  } catch (error) {
    console.error('Get user with memory error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    };
  }
}

export async function loginAction(email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Set the auth token cookie
      const cookieStore = await cookies();
      cookieStore.set('auth_token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
}

export async function registerAction(name: string, email: string, password: string): Promise<AuthResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, email, password }),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Set the auth token cookie
      const cookieStore = await cookies();
      cookieStore.set('auth_token', data.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
      });
    }

    return data;
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
}

export async function getCurrentUserAction(): Promise<AuthResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Failed to get user'
      };
    }

    return data;
  } catch (error) {
    console.error('Get current user error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get user'
    };
  }
}

export async function logoutAction(): Promise<void> {
  try {
    const headers = await getAuthHeaders();
    
    await fetch(`${API_BASE_URL}/api/auth/logout`, {
      method: 'POST',
      headers,
      credentials: 'include',
    });

    // Clear the auth token cookie
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    cookieStore.delete('token');
    
  } catch (error) {
    console.error('Logout error:', error);
    // Still clear cookies even if server request fails
    const cookieStore = await cookies();
    cookieStore.delete('auth_token');
    cookieStore.delete('token');
  }
  
  redirect('/sign-in');
}

export async function updateUserMemoryAction(userId: string, memory: Record<string, unknown>): Promise<AuthResponse> {
  try {
    const headers = await getAuthHeaders();
    
    const response = await fetch(`${API_BASE_URL}/api/auth/user/${userId}/memory`, {
      method: 'PUT',
      headers,
      body: JSON.stringify({ memory }),
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('Failed to update user memory');
    }

    return await response.json();
  } catch (error) {
    console.error('Update user memory error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update user memory'
    };
  }
}

export async function initiateGoogleLoginAction(): Promise<never> {
  redirect(`${API_BASE_URL}/api/auth/google`);
}
