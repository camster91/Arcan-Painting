import path from 'node:path';
import { reactRouter } from '@react-router/dev/vite';
import { reactRouterHonoServer } from 'react-router-hono-server/dev';
import { defineConfig } from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  test: {
    setupFiles: ['./test/setup.js'],
  },
  envPrefix: 'NEXT_PUBLIC_',
  optimizeDeps: {
    include: ['fast-glob', 'lucide-react'],
    exclude: [
      'hono/context-storage',
      'fsevents',
      'lightningcss',
    ],
  },
  logLevel: 'info',
  plugins: [
    reactRouterHonoServer({
      serverEntryPoint: './__create/index.ts',
      runtime: 'node',
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      lodash: 'lodash-es',
      'npm:stripe': 'stripe',
      stripe: path.resolve(__dirname, './src/__create/stripe'),
      '@': path.resolve(__dirname, 'src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    target: 'es2022',
    // Sourcemaps were causing Vite to abort the build with a circular
    // error message ("Can't resolve original location of error") on
    // react-router 7.17. Disabled. The prod bundle is minified and
    // un-sourcemapped; re-enable when upstream fixes the RR7 dev-build
    // chain.
    sourcemap: false,
    rollupOptions: {
      external: (id) => {
        const serverOnlyPkgs = [
          'pg',
          'pg-native',
          'pg-pool',
          'argon2',
          'ws',
          'sql.js',
          'fsevents',
          'lightningcss',
          'better-sqlite3',
        ];
        if (serverOnlyPkgs.some((pkg) => id === pkg || id.startsWith(pkg + '/'))) return true;
        if (id.startsWith('@sentry/') || id.startsWith('node_modules/@sentry/')) return true;
        return false;
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
