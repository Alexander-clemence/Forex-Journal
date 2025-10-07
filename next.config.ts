import type { NextConfig } from "next";

// Only export static files when building for Electron production
const isElectronBuild = process.env.ELECTRON_BUILD === 'true';

const nextConfig: NextConfig = {
  // Conditionally enable static export ONLY for Electron builds
  ...(isElectronBuild ? {
    output: 'export',
    distDir: 'out',
    assetPrefix: '',
  } : {}),
  
  trailingSlash: true,
  
  images: { 
    unoptimized: true 
  },
  
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE,
    NEXT_PUBLIC_SHOW_QUERY_DEVTOOLS: process.env.NEXT_PUBLIC_SHOW_QUERY_DEVTOOLS,
    NEXT_PUBLIC_GITHUB_REPO: process.env.NEXT_PUBLIC_GITHUB_REPO,
    NEXT_PUBLIC_UPDATE_SERVER_URL: process.env.NEXT_PUBLIC_UPDATE_SERVER_URL,
  },
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Only set custom publicPath for Electron builds
      if (isElectronBuild) {
        config.output.publicPath = '/_next/';
      }
      
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        path: false,
        os: false,
      };
    }
    return config;
  },
};

export default nextConfig;