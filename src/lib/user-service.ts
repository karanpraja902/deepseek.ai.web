import { connectToDatabase } from './mongodb';
import User, { IUser } from '../app/api/models/User';
import { UserMemoryService } from './user-memory-service';

export class UserService {
  private static memoryService = UserMemoryService.getInstance();

  /**
   * Create a new user
   */
  static async createUser(userData: {
    id: string;
    email: string;
    username: string;
    password: string;
    name?: string;
    avatar?: string;
  }): Promise<IUser> {
    await connectToDatabase();
    
    const user = new User({
      ...userData,
      isActive: true,
    });

    const savedUser = await user.save();

    // Store initial preferences in memory
    await this.memoryService.storeUserPreferences(savedUser.id, {
      theme: 'light',
      language: 'en',
      aiModel: 'gemini-2.5-flash',
      conversationStyle: 'casual',
      topics: []
    });

    return savedUser;
  }

  /**
   * Get user by ID
   */
  static async getUser(userId: string): Promise<IUser | null> {
    await connectToDatabase();
    return await User.findOne({ id: userId, isActive: true });
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email: string): Promise<IUser | null> {
    await connectToDatabase();
    return await User.findOne({ email, isActive: true });
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticateUser(email: string, password: string): Promise<IUser | null> {
    await connectToDatabase();
    
    const user = await User.findOne({ email, isActive: true });
    if (!user) {
      return null;
    }

    // In production, you should hash passwords and compare hashes
    // For this demo, we're doing plain text comparison
    if (user.password !== password) {
      return null;
    }

    // Update last active timestamp
    await this.updateUserActivity(user.id);

    return user;
  }

  /**
   * Update user preferences
   */
  static async updateUserPreferences(userId: string, preferences: any): Promise<IUser | null> {
    await connectToDatabase();
    
    const updatedUser = await User.findOneAndUpdate(
      { id: userId, isActive: true },
      { preferences },
      { new: true }
    );

    if (updatedUser) {
      // Store updated preferences in memory
      await this.memoryService.storeUserPreferences(userId, preferences);
    }

    return updatedUser;
  }

  /**
   * Get user with memory context
   */
  static async getUserWithMemory(userId: string) {
    const user = await this.getUser(userId);
    if (!user) return null;

    const learningProfile = await this.memoryService.getUserLearningProfile(userId);
    
    return {
      user,
      memory: learningProfile
    };
  }

  /**
   * Update user's last active timestamp
   */
  static async updateUserActivity(userId: string): Promise<void> {
    await connectToDatabase();
    await User.findOneAndUpdate(
      { id: userId, isActive: true },
      { lastActive: new Date() }
    );
  }

  /**
   * Initialize static user if it doesn't exist
   */
  static async initializeStaticUser(): Promise<IUser> {
    await connectToDatabase();
    
    // Check if static user already exists
    let staticUser = await User.findOne({ email: 'karan123@gmail.com' });
    
    if (!staticUser) {
      // Create static user
      staticUser = await this.createUser({
        id: 'static_user_karan',
        email: 'karan123@gmail.com',
        username: 'karan123',
        password: 'Karan@123',
        name: 'Karan',
        avatar: '',
      });

      console.log('Static user created:', staticUser.email);
    }

    if (!staticUser) {
      throw new Error('Failed to create or find static user');
    }

    return staticUser as IUser;
  }
}
