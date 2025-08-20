import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  id: string;
  userId?: string; // Add userId field
  createdAt: Date;
  updatedAt: Date;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: Date;
    files?: Array<{
      filename: string;
      url: string;
      mediaType: string;
    }>;
  }>;
  title?: string;
  isActive: boolean;
}

const ChatSchema: Schema = new Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  userId: {
    type: String,
    required: false,
    index: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    files: [{
      filename: {
        type: String,
        required: true,
      },
      url: {
        type: String,
        required: true,
      },
      mediaType: {
        type: String,
        required: true,
      },
    }],
  }],
  title: {
    type: String,
    default: 'New Chat',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
});

// Update the updatedAt field before saving
ChatSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create compound indexes for better query performance
ChatSchema.index({ id: 1, isActive: 1 });
ChatSchema.index({ userId: 1, isActive: 1 });
ChatSchema.index({ createdAt: -1 });
ChatSchema.index({ userId: 1, createdAt: -1 });

let Chat: mongoose.Model<IChat>;

try {
  Chat = mongoose.model<IChat>('Chat');
} catch {
  Chat = mongoose.model<IChat>('Chat', ChatSchema);
}

export default Chat;
