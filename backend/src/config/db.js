import mongoose from 'mongoose';
import dns from 'dns';
import { ENV } from './env.js';

// Configure reliable DNS servers (Google / Cloudflare) to prevent Windows querySrv ECONNREFUSED issues
try {
  dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1', '1.0.0.1']);
} catch (dnsErr) {
  console.warn('[MongoDB DNS] Could not set custom DNS servers:', dnsErr.message);
}

export const connectDB = async () => {
  try {
    if (!ENV.MONGODB_URI) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    // Safe diagnostic parsing (NEVER logs credentials)
    try {
      const url = new URL(ENV.MONGODB_URI);
      const dbName = url.pathname.replace(/^\//, '') || 'default';
      console.log(`[MongoDB] Initializing connection to cluster: ${url.hostname}, Database: ${dbName}`);
    } catch {
      console.log('[MongoDB] Initializing connection to MongoDB Atlas...');
    }

    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
      autoIndex: true,
    });

    console.log(`[MongoDB] Connected successfully: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    console.error(`[MongoDB Connection Error]: ${error.message}`);

    if (error.message && (error.message.includes('SSL alert number 80') || error.message.includes('Could not connect to any servers in your MongoDB Atlas cluster') || error.name === 'MongooseServerSelectionError')) {
      console.warn('\n[MongoDB Atlas Whitelist Notice]: If you receive a connection or TLS timeout, verify that your current public IP is added to the MongoDB Atlas Network Access whitelist (IP Access List: 0.0.0.0/0 or your current IP).\n');
    }

    // Don't kill process immediately in dev mode to allow graceful hot-reloading
    if (ENV.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

