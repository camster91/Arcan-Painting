import { cp, mkdir, rm, writeFile, readdir, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { setTimeout as delay } from 'node:timers/promises';
import { projects, services } from '../src/data/premiumSite.js';

const target = 'build/workers-assets';
const siteMode = process.env.WORKERS_SITE_MODE === 'production' ? 'production' : 'staging';
const port = 4397;
const base = `http://127.0.0.1:${port}`;
const routes = ['/', ...services.map(({ path }) => path), '/projects', ...projects.map(({ slug }) => `/projects/${slug}`), '/about', '/contact', '/quote', '/privacy', '/thank-you', '/design-system'];
// Build-time rendering only: never inherit a production database or run migrations.
const server = spawn(process.execPath, ['build/server/index.js'], {
  env: { PATH: process.env.PATH, NODE_ENV: 'production', PORT: String(port), HOST: '127.0.0.1', PUBLIC_SITE_MODE: siteMode },
  stdio: ['ignore', 'ignore', 'pipe'],
});
let stderr = '';
server.stderr.on('data', chunk => { stderr = (stderr + chunk.toString()).slice(-4000); });
try {
  let ready = false;
  for (let attempt = 0; attempt < 80; attempt++) {
    if (server.exitCode !== null) throw new Error(`Render server exited: ${stderr}`);
    try { const response = await fetch(base, { signal: AbortSignal.timeout(1000) }); if (response.ok) { ready = true; break; } } catch { /* Wait for local renderer. */ }
    await delay(250);
  }
  if (!ready) throw new Error(`Render server did not become ready: ${stderr}`);
  await rm(target, { recursive: true, force: true });
  await mkdir(target, { recursive: true });
  await cp('build/client', target, { recursive: true });
  // Vite copies public/ into build/client; all assets remain repository-sourced.
  for (const path of routes) {
    // React Router selects onAllReady for crawlers: required for static generation.
    const response = await fetch(`${base}${path}`, { headers: { "User-Agent": "ArcanStaticRenderer/1.0 (+https://arcanpainting.ca; bot)" } });
    if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) throw new Error(`Cannot render ${path}: ${response.status}`);
    const output = `${target}${path === '/' ? '/index' : path}.html`;
    await mkdir(output.slice(0, output.lastIndexOf('/')), { recursive: true });
    await writeFile(output, await response.text());
    const dataPath = path === '/' ? '/_root.data' : `${path}.data`;
    const data = await fetch(`${base}${dataPath}`);
    if (data.ok) await writeFile(`${target}${dataPath}`, await data.text());
  }
  for (const path of ['/robots.txt', '/sitemap.xml']) {
    const response = await fetch(`${base}${path}`);
    if (!response.ok) throw new Error(`Cannot export ${path}: ${response.status}`);
    await writeFile(`${target}${path}`, await response.text());
  }
  await writeFile(`${target}/404.html`, '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width"><title>Page not found | Arcan Painting</title><h1>Page not found</h1><p><a href="/">Return to Arcan Painting</a></p></html>');
  const files = {};
  async function fingerprint(directory) {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const path = `${directory}/${entry.name}`;
      if (entry.isDirectory()) await fingerprint(path);
      else files[path.slice(target.length + 1)] = createHash('sha256').update(await readFile(path)).digest('hex');
    }
  }
  await fingerprint(target);
  await writeFile('build/workers-release.json', JSON.stringify({
    siteMode, sourceCommit: process.env.SOURCE_COMMIT || 'local-uncommitted', routes,
    workerSha256: createHash('sha256').update(await readFile('workers/public-site.js')).digest('hex'),
    artifactSha256: createHash('sha256').update(JSON.stringify(files)).digest('hex'), files,
  }, null, 2));
  console.log(`Prepared ${routes.length} public pages in ${target}. Mode: ${siteMode}.`);
} finally {
  if (server.exitCode === null) { server.kill('SIGTERM'); await once(server, 'exit'); }
}
