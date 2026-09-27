import { writeFile } from 'node:fs/promises';

// LiteSpeed loads the entry with require(), which cannot load an ESM graph
// containing top-level await. Keep the React Router server behind import().
await writeFile('build/server/hostinger.cjs', `import('./index.js').catch((error) => {
  console.error('Hostinger server startup failed:', error.code || error.name || 'Error');
  process.exit(1);
});
`);
