import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

interface ConnectionCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

const cached: ConnectionCache = { conn: null, promise: null };

export async function connectToDatabase() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable Mongoose buffering
      serverSelectionTimeoutMS: 5000, // Fail fast if no server is available
      socketTimeoutMS: 45000, // Close sockets after 45s of inactivity
      maxPoolSize: 1, // Maintain a single socket connection
      minPoolSize: 1, // Avoid empty pools
      maxIdleTimeMS: 10000, // Close idle connections after 10s
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then(mongoose => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null; // Reset on failure
    throw e;
  }

  return cached.conn;
}

export async function disconnectFromDatabase() {
  if (cached.conn) {
    await cached.conn.disconnect();
    cached.conn = null;
    cached.promise = null;
  }
}
