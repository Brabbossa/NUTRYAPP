import withPWAInit from 'next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  experimental: {
    // Force webpack for next-pwa compatibility
    useWasmBinary: false
  }
};

export default withPWA(nextConfig);
