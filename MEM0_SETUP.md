# Mem0 Integration Setup Guide

This guide explains how to set up the user-specific mem0 integration for the deepseek.ai chat application.

## Features Implemented

### 1. User-Specific Memory System
- **User Authentication**: Static user with email `karan123@gmail.com` and password `Karan@123`
- **Conversation Memory**: Each user's conversations are stored and retrieved separately
- **Learning Profile**: System builds a profile of user preferences and interaction patterns
- **Cross-Conversation Context**: AI can reference previous conversations for better responses

### 2. Memory Components
- **UserMemoryService**: Handles all mem0 operations with user context
- **UserService**: Manages user authentication and preferences
- **Enhanced ChatService**: Integrates memory with chat operations
- **Memory-Aware API**: Chat API uses user context for personalized responses

## Setup Instructions

### 1. Environment Configuration

Create a `.env.local` file in the project root with the following variables:

```env
# Mem0 API Key - Get from https://mem0.ai
MEM0_API_KEY=your_mem0_api_key_here

# MongoDB Connection String
MONGODB_URI=mongodb://localhost:27017/deepseek-ai

# Google AI API Key (if not using service account)
GOOGLE_API_KEY=your_google_api_key_here

# Cloudinary Configuration (for file uploads)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

### 2. Database Setup

The application will automatically create the necessary database collections:
- `users`: Stores user information and preferences
- `chats`: Stores chat conversations with user associations

### 3. Static User

A static user is automatically created with these credentials:
- **Email**: `karan123@gmail.com`
- **Password**: `Karan@123`
- **User ID**: `static_user_karan`

## How It Works

### 1. User Initialization
When the application starts, it automatically initializes the static user if it doesn't exist.

### 2. Memory Storage
- **Conversation Context**: Each chat conversation is stored in mem0 with user-specific keys
- **User Preferences**: User preferences are stored and retrieved from memory
- **Interaction Patterns**: The system learns from user interactions and stores patterns

### 3. Memory Retrieval
- **Relevant Context**: When a user asks a question, the system searches for relevant previous conversations
- **User Profile**: The AI uses the user's learning profile to personalize responses
- **Cross-Reference**: Previous conversations are used to provide more contextual responses

### 4. API Integration
The chat API now includes:
- User context in requests
- Memory-enhanced system prompts
- Personalized response generation

## API Endpoints

### Authentication
- `POST /api/auth/init` - Initialize static user
- `POST /api/auth/login` - User login
- `GET /api/auth/user?userId={id}` - Get user with memory context

### Chat (Enhanced)
- `POST /api/chat` - Now includes user context and memory integration

## Memory Features

### 1. Conversation Memory
- Stores all user conversations with timestamps
- Enables context-aware responses
- Maintains conversation history across sessions

### 2. User Learning Profile
- Tracks conversation style preferences
- Learns from user interaction patterns
- Stores preferred topics and language settings

### 3. Cross-Conversation Context
- Searches relevant previous conversations
- Provides personalized responses based on history
- Maintains user-specific conversation continuity

## Usage Example

1. **Start the application**: The static user is automatically created
2. **Login**: Use the demo credentials to authenticate
3. **Chat**: Start conversations - the AI will remember your preferences and previous conversations
4. **Personalization**: Responses become more tailored to your interaction style over time

## Benefits

1. **Personalized Experience**: Each user gets a unique, personalized chat experience
2. **Memory Persistence**: Conversations and preferences persist across sessions
3. **Context Awareness**: AI can reference previous conversations for better responses
4. **Learning Capability**: System learns from user interactions to improve responses
5. **Privacy**: Each user's data is completely isolated

## Security Notes

- In production, implement proper password hashing
- Add session management and JWT tokens
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Use HTTPS for all communications

## Troubleshooting

### Common Issues

1. **Mem0 API Key**: Ensure your mem0 API key is valid and has sufficient credits
2. **MongoDB Connection**: Verify your MongoDB connection string is correct
3. **Environment Variables**: Make sure all required environment variables are set
4. **User Initialization**: Check that the static user is created successfully

### Debug Information

The application logs detailed information about:
- User initialization
- Memory operations
- Chat context retrieval
- API requests and responses

Check the console logs for debugging information.