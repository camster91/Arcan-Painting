import fs from 'fs';
import path from 'path';

const walk = (dir) => {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else if (p.endsWith('.js') || p.endsWith('.jsx') || p.endsWith('.ts') || p.endsWith('.tsx')) {
      let c = fs.readFileSync(p, 'utf8');
      let changed = false;
      
      // 1. Replace @/ alias with /app/src/
      if (c.includes('@/')) {
        c = c.split('@/').join('/app/src/');
        changed = true;
      }
      
      // 2. Replace @auth/create with local shim path
      if (c.includes('@auth/create')) {
        c = c.replace(/['"]@auth\/create[^'"]*['"]/g, "'/app/src/__create/@auth/create.js'");
        changed = true;
      }

      // 3. Add .js extension to /app/src/ imports if missing
      const lines = c.split('
');
      const newLines = lines.map(l => {
        const m = l.match(/(import|export).*from\s+['"](\/app\/src\/[^'"]+)['"]/);
        if (m) {
          const importPath = m[2];
          if (!importPath.endsWith('.js') && !importPath.endsWith('.json') && !importPath.endsWith('.css') && !importPath.endsWith('.jsx')) {
            // Check if .jsx version exists (don't double-suffix)
            const jsxFile = importPath + '.jsx';
            const jsFile = importPath + '.js';
            if (fs.existsSync(jsxFile)) {
              changed = true;
              return l.replace(importPath, importPath + '.jsx');
            }
            changed = true;
            return l.replace(importPath, jsFile);
          }
        }
        return l;
      });
      
      if (changed) {
        fs.writeFileSync(p, newLines.join('
'));
        console.log('Fixed imports in:', p);
      }
    }
  });
};

['/app/build/server/src', '/app/src'].forEach(walk);
console.log('Import transformation complete.');
