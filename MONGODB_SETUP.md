# MongoDB Setup Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB installed locally or MongoDB Atlas account

## Installation

1. **Install dependencies** (already done):
   ```bash
   npm install mongodb mongoose
   ```

2. **Create environment file**:
   Create a `.env.local` file in the root directory with:
   ```env
   MONGODB_URI=mongodb://localhost:27017/deepseek-ai
   ```

3. **For MongoDB Atlas (cloud)**:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/deepseek-ai?retryWrites=true&w=majority
   ```

## Local MongoDB Setup

### Option 1: Docker (Recommended)
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Option 2: Local Installation
1. Download MongoDB from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Install and start the MongoDB service
3. Create database: `deepseek-ai`

## Database Structure

The application creates the following collections:

- **chats**: Stores chat sessions with messages
- **messages**: Individual messages within chats

## Features Implemented

- ✅ Chat creation with unique IDs
- ✅ Message storage and retrieval
- ✅ Chat history management
- ✅ Soft delete functionality
- ✅ Automatic title generation from first message
- ✅ File attachment support
- ✅ Chat statistics and analytics

## API Endpoints (Future)

- `POST /api/chats` - Create new chat
- `GET /api/chats/[id]` - Get chat by ID
- `PUT /api/chats/[id]` - Update chat
- `DELETE /api/chats/[id]` - Delete chat
- `GET /api/chats` - Get all chats (with pagination)

## Testing the Setup

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Visit the root page - it should create a new chat and redirect to `/chat/[id]`

3. Check the console for database connection logs

## Troubleshooting

- **Connection refused**: Ensure MongoDB is running on port 27017
- **Authentication failed**: Check username/password in connection string
- **Database not found**: MongoDB will create the database automatically

## Next Steps

- Implement API routes for chat operations
- Add user authentication
- Implement real-time chat updates
- Add file upload functionality
- Implement chat search and filtering
