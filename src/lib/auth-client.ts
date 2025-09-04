'use client';

import { AuthResponse } from './auth-actions';

// Client-side wrappers for server actions
export class AuthClient {
  static async login(email: string, password: string): Promise<AuthResponse> {
    const { loginAction } = await import('./auth-actions');
    return await loginAction(email, password);
  }

  static async register(name: string, email: string, password: string): Promise<AuthResponse> {
    const { registerAction } = await import('./auth-actions');
    return await registerAction(name, email, password);
  }

  static async getCurrentUser(): Promise<AuthResponse> {
    const { getCurrentUserAction } = await import('./auth-actions');
    return await getCurrentUserAction();
  }

  static async logout(): Promise<void> {
    const { logoutAction } = await import('./auth-actions');
    return await logoutAction();
  }

  static async updateUserMemory(userId: string, memory: Record<string, unknown>): Promise<AuthResponse> {
    const { updateUserMemoryAction } = await import('./auth-actions');
    return await updateUserMemoryAction(userId, memory);
  }

  static async getUserWithMemory(userId: string): Promise<AuthResponse> {
    const { getUserWithMemoryAction } = await import('./auth-actions');
    return await getUserWithMemoryAction(userId);
  }

  static async initializeStaticUser(): Promise<AuthResponse> {
    const { initializeStaticUserAction } = await import('./auth-actions');
    return await initializeStaticUserAction();
  }

  static async initiateGoogleLogin(): Promise<never> {
    const { initiateGoogleLoginAction } = await import('./auth-actions');
    return await initiateGoogleLoginAction();
  }
}
