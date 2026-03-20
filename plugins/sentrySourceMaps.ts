/**
 * Sentry Source Maps Vite Plugin
 *
 * In production builds:
 * - Generates source maps
 * - Injects release version from GIT_COMMIT env var
 * - Upload is handled by running `sentry-cli` post-build via CI/CD
 *
 * This plugin wires up the SENTRY_RELEASE env so the client + server
 * bundles both embed the same release identifier.
 */
import type { Plugin } from 'vite';
import { execSync } from 'child_process';

function getGitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim();
  } catch {
    return process.env.GIT_COMMIT || 'unknown';
  }
}

export function sentrySourceMaps(): Plugin {
  let release: string;

  return {
    name: 'sentry-source-maps',
    apply: 'build',

    configResolved(config) {
      release = process.env.SENTRY_RELEASE || getGitCommit();
      // Inject SENTRY_RELEASE into build so client bundle can read it
      process.env.SENTRY_RELEASE = release;
      process.env.NEXT_PUBLIC_SENTRY_RELEASE = release;
      config.logger.info(`[Sentry] Release: ${release}`);
    },

    generateBundle() {
      // Source maps are enabled via build.sourcemap in vite.config.ts
      // The actual upload happens in CI via:
      //   npx @sentry/cli releases new <release>
      //   npx @sentry/cli releases files <release> upload-sourcemaps ./build
      //   npx @sentry/cli releases finalize <release>
    },
  };
}
