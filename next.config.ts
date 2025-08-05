import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  env: {
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GEMINI_API_KEY: process.env.GOOGLE_API_KEY, // Gemini uses GOOGLE_API_KEY
    NEWSAPI_API_KEY: process.env.NEWSAPI_API_KEY,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // Handle handlebars require.extensions issue
    config.module.rules.push({
      test: /\.hbs$/,
      use: 'handlebars-loader',
    });

    // Ignore specific problematic modules for client-side builds
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        os: false,
      };
      
      // Ignore handlebars runtime in client builds
      config.externals = config.externals || [];
      config.externals.push({
        'handlebars/runtime': 'var {}',
      });
    }

    // Suppress specific warnings
    config.ignoreWarnings = [
      { module: /node_modules\/@opentelemetry\/.*\.js/ },
      { module: /node_modules\/handlebars\/.*\.js/ },
      /Module not found: Can't resolve '@opentelemetry\/exporter-jaeger'/,
      /require\.extensions is not supported by webpack/,
    ];

    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'a.tile.openstreetmap.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'b.tile.openstreetmap.org',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'c.tile.openstreetmap.org',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
