import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set in environment variables');
    process.exit(1);
  }
  try {
    await mongoose.connect(uri);
    console.log('✅ MongoDB connected');
  } catch (err: any) {
    if (err && (err.code === 'ECONNREFUSED' || err.syscall === 'querySrv')) {
      console.warn('⚠️ MongoDB connection failed due to DNS/network resolution. Retrying with Google DNS (8.8.8.8)...');
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4']);
        await mongoose.connect(uri);
        console.log('✅ MongoDB connected (via Google DNS)');
        return;
      } catch (retryErr) {
        console.error('❌ MongoDB connection failed even after retrying with Google DNS:', retryErr);
        process.exit(1);
      }
    }
    console.error('❌ MongoDB connection failed:', err);
    process.exit(1);
  }
};
