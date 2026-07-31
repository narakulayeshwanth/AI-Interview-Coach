import mongoose from 'mongoose';
import dns from 'dns';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️ MONGODB_URI is not set. Server will run without database.');
    return;
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
        console.warn('⚠️ MongoDB connection failed even after retrying with Google DNS. Server will run without database.');
        console.error('   Reason:', (retryErr as Error).message);
        return;
      }
    }
    console.warn('⚠️ MongoDB connection failed. Server will run without database.');
    console.error('   Reason:', err.message);
  }
};
