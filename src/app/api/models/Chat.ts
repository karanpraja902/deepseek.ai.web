import mongoose, { Schema, Document } from 'mongoose';

export interface IChat extends Document {
  id: string;
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

// Create a compound index for better query performance
ChatSchema.index({ id: 1, isActive: 1 });
ChatSchema.index({ createdAt: -1 });

// Ensure the model is properly registered
let Chat: mongoose.Model<IChat>;

try {
  // Try to get existing model
  Chat = mongoose.model<IChat>('Chat');
} catch {
  // If model doesn't exist, create it
  Chat = mongoose.model<IChat>('Chat', ChatSchema);
}

export default Chat;
