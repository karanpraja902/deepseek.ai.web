// const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app/api';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://deepseek-ai-server.vercel.app';

export class UserApiService {
  static async getUserProfile(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }

  static async updateUserProfile(userId: string, profileData: any) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileData),
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to update user profile');
      }

      return await response.json();
    } catch (error) {
      console.error('Update user profile error:', error);
      throw error;
    }
  }

  static async updateUserSubscription(userId: string, subscriptionData: {
    plan: string;
    status: string;
    subscribedAt?: Date;
    currentPeriodEnd?: Date;
    trialEnd?: Date;
  }) {
    try {
      console.log('APIpdateUserSubscription', userId, subscriptionData);
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscription: subscriptionData }),
        credentials: 'include',
      });
console.log('APIUpdateUserSubscriptionresponse', response);
      if (!response.ok) {
        throw new Error('Failed to update user subscription');
      }

      return await response.json();
    } catch (error) {
      console.error('Update user subscription error:', error);
      throw error;
    }
  }

  static async getUserStats(userId: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/user/${userId}/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Failed to get user stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Get user stats error:', error);
      throw error;
    }
  }
}
