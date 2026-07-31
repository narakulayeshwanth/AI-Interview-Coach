import type { NextConfig } from 'next';

const RENDER_URL = 'https://ai-interview-coach-l73m.onrender.com';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_URL:
      process.env.NEXT_PUBLIC_API_URL ||
      (process.env.NODE_ENV === 'production' ? RENDER_URL : 'http://localhost:5000'),
  },
};

export default nextConfig;
