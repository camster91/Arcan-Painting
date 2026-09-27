import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const directories = [];
afterEach(() => directories.splice(0).forEach((dir) => rmSync(dir, { recursive: true, force: true })));

function runEntry(source) {
  const cwd = mkdtempSync(join(tmpdir(), 'arcan-hostinger-'));
  directories.push(cwd);
  mkdirSync(join(cwd, 'build/server'), { recursive: true });
  writeFileSync(join(cwd, 'package.json'), JSON.stringify({ type: 'module' }));
  writeFileSync(join(cwd, 'build/server/index.js'), source);
  const build = spawnSync(process.execPath, [resolve('scripts/build-hostinger-entry.mjs')], { cwd, encoding: 'utf8' });
  expect(build.status).toBe(0);
  return spawnSync(process.execPath, ['-e', "require('./build/server/hostinger.cjs')"], { cwd, encoding: 'utf8', timeout: 10000 });
}

describe('Hostinger CommonJS startup bridge', () => {
  it('loads an ES module with top-level await through require', () => {
    const result = runEntry("await new Promise(resolve => setTimeout(resolve, 10)); console.log('server-ready');");
    expect(result.status).toBe(0);
    expect(result.stdout).toContain('server-ready');
    expect(result.stderr).toBe('');
  });

  it('exits unsuccessfully on async startup errors without exposing error details', () => {
    const result = runEntry("await Promise.resolve(); throw new Error('fabricated-private-connection-details');");
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Hostinger server startup failed: Error');
    expect(result.stderr).not.toContain('fabricated-private-connection-details');
  });
});
