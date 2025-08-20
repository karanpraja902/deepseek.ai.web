import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  id: string;
  email: string;
  username: string;
  password: string; // In production, this should be hashed
  name?: string;
  avatar?: string;
  preferences?: {
    theme?: 'light' | 'dark';
    language?: string;
    aiModel?: string;
    conversationStyle?: 'formal' | 'casual' | 'technical';
    topics?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  lastActive: Date;
  isActive: boolean;
}

const UserSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    // index: true,
  },
  username: {
    type: String,
    required: true,
    unique: true,
    // index: true,
  },
  password: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: '',
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark'],
      default: 'light',
    },
    language: {
      type: String,
      default: 'en',
    },
    aiModel: {
      type: String,
      default: 'gemini-2.5-flash',
    },
    conversationStyle: {
      type: String,
      enum: ['formal', 'casual', 'technical'],
      default: 'casual',
    },
    topics: [{
      type: String,
      default: [],
    }],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Update the updatedAt field before saving
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.lastActive = new Date();
  next();
});

// Create indexes for better query performance
UserSchema.index({ id: 1, isActive: 1 });
// UserSchema.index({ email: 1 });
// UserSchema.index({ username: 1 });
UserSchema.index({ lastActive: -1 });

let User: mongoose.Model<IUser>;

try {
  User = mongoose.model<IUser>('User');
} catch {
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User;
