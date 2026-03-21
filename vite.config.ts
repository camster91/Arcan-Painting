import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import { reactRouterHonoServer } from 'react-router-hono-server/dev';
import { defineConfig } from 'vite';
import babel from 'vite-plugin-babel';
import tsconfigPaths from 'vite-tsconfig-paths';
import { aliases } from './plugins/aliases';
import { layoutWrapperPlugin } from './plugins/layouts';
import { loadFontsFromTailwindSource } from './plugins/loadFontsFromTailwindSource';
import { nextPublicProcessEnv } from './plugins/nextPublicProcessEnv';
import { sentrySourceMaps } from './plugins/sentrySourceMaps';

export default defineConfig({
  // Keep them available via import.meta.env.NEXT_PUBLIC_*
  envPrefix: 'NEXT_PUBLIC_',
  optimizeDeps: {
    // Explicitly include fast-glob, since it gets dynamically imported and we
    // don't want that to cause a re-bundle.
    include: ['fast-glob', 'lucide-react'],
    exclude: [
      '@hono/auth-js/react',
      '@hono/auth-js',
      '@auth/core',
      '@hono/auth-js',
      'hono/context-storage',
      '@auth/core/errors',
      'fsevents',
      'lightningcss',
    ],
  },
  logLevel: 'info',
  plugins: [
    nextPublicProcessEnv(),
    reactRouterHonoServer({
      serverEntryPoint: './__create/index.ts',
      runtime: 'node',
    }),
    babel({
      include: ['src/**/*.{js,jsx,ts,tsx}'], // or RegExp: /src\/.*\.[tj]sx?$/
      exclude: /node_modules/, // skip everything else
      babelConfig: {
        babelrc: false, // don't merge other Babel files
        configFile: false,
        plugins: ['styled-jsx/babel'],
      },
    }),
    loadFontsFromTailwindSource(),
    reactRouter(),
    tsconfigPaths(),
    aliases(),
    layoutWrapperPlugin(),
    sentrySourceMaps(),
  ],
  resolve: {
    alias: {
      lodash: 'lodash-es',
      'npm:stripe': 'stripe',
      stripe: path.resolve(__dirname, './src/__create/stripe'),
      '@auth/create/react': '@hono/auth-js/react',
      '@auth/create': path.resolve(__dirname, './src/__create/@auth/create'),
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'es2022',
    // Generate source maps for Sentry stack trace readability
    sourcemap: process.env.NODE_ENV === 'production' ? 'hidden' : false,
    rollupOptions: {
      // Externalize Node-only / native server packages so neither the client
      // nor the SSR bundle tries to inline them.
      external: (id) => {
        const serverOnlyPkgs = [
          'pg', 'pg-native', 'pg-pool',
          'argon2',
          'ws',
          'sql.js',
          'fsevents',
          'lightningcss',
          'better-sqlite3',
        ];
        return serverOnlyPkgs.some((pkg) => id === pkg);
      },
      output: {
        // Manual chunk splitting — client build only
        // (SSR build produces a single server entry, so manualChunks is a no-op there)
        manualChunks(id) {
          // React core — tiny, keep together
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@react-router')) {
            return 'vendor-router';
          }
          // Animation library (motion/framer) — medium, used in hero
          if (id.includes('node_modules/motion') || id.includes('node_modules/framer-motion')) {
            return 'vendor-motion';
          }
          // Charts — heavy, admin-only
          if (id.includes('node_modules/recharts') || id.includes('node_modules/d3-')) {
            return 'vendor-charts';
          }
          // PDF — heavy, admin-only
          if (id.includes('node_modules/pdfjs-dist')) {
            return 'vendor-pdf';
          }
          // Tanstack (query + table)
          if (id.includes('node_modules/@tanstack')) {
            return 'vendor-tanstack';
          }
          // UI & icon libraries
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (
            id.includes('node_modules/@chakra-ui') ||
            id.includes('node_modules/@emotion') ||
            id.includes('node_modules/@react-aria')
          ) {
            return 'vendor-ui';
          }
          // Auth
          if (
            id.includes('node_modules/@auth') ||
            id.includes('node_modules/@hono') ||
            id.includes('node_modules/hono')
          ) {
            return 'vendor-auth';
          }
          // Stripe
          if (id.includes('node_modules/stripe')) {
            return 'vendor-stripe';
          }
          // Everything else in node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-misc';
          }
        },
      },
    },
  },
  clearScreen: false,
  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 4000,
    hmr: {
      overlay: false,
    },
    warmup: {
      clientFiles: ['./src/app/**/*', './src/app/root.tsx', './src/app/routes.ts'],
    },
  },
});
