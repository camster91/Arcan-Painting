/** The PostgreSQL subset used by this app, targeting MariaDB 11.8+. */
export function protectSql(text) {
  const literals = [];
  const code = text.replace(/'(?:''|[^'])*'|"(?:""|[^"])*"|--[^\n]*|\/\*[\s\S]*?\*\//g, (s) => {
    if (s.startsWith('--') || s.startsWith('/*')) return ' ';
    if (s.startsWith('"')) return '`' + s.slice(1, -1).replaceAll('""', '"').replaceAll('`','``') + '`';
    return `§${literals.push(s) - 1}§`;
  });
  return { code, restore: (s) => s.replace(/§(\d+)§/g, (_, n) => literals[n]) };
}

export function compileMysql(text, params = []) {
  const { code: original, restore } = protectSql(text);
  let code = original.trim().replace(/;\s*$/, '');
  let conflict = null;
  // Only the app's single-column conflict targets are supported. Unlike
  // INSERT IGNORE, this must not hide invalid data or unrelated constraints.
  code = code.replace(/\bON CONFLICT\s*\((\w+)\)(?:\s+WHERE\s+\1\s+IS NOT NULL)?\s+DO\s+(NOTHING|UPDATE SET)/i, (_, column, action) => {
    conflict = { column, ignore: action.toUpperCase() === 'NOTHING' };
    return conflict.ignore ? '' : 'ON DUPLICATE KEY UPDATE';
  });
  code = code.replace(/\bEXCLUDED\.(\w+)/gi, 'VALUES($1)')
    .replace(/\b([a-z_]\w*(?:\.[a-z_]\w*)?)::text\b/gi, 'CAST($1 AS CHAR)')
    .replace(/::(?:jsonb|int|integer)\b/gi, '')
    .replace(/\bILIKE\b/gi, 'LIKE');
  if (/^\s*(CREATE|ALTER)\b/i.test(code)) {
    code = code.replace(/\bSERIAL\b/gi, 'INT AUTO_INCREMENT')
      .replace(/\bTIMESTAMPTZ\b|\bTIMESTAMP\b/gi, 'DATETIME(6)')
      .replace(/\bJSONB\b/gi, 'JSON')
      .replace(/\bNUMERIC\b(?!\s*\()/gi, 'DECIMAL(38,10)')
      .replace(/\bTEXT\[\]\s+DEFAULT\s+§(\d+)§/gi, "JSON DEFAULT '[]'");
    const index = code.match(/^CREATE\s+(UNIQUE\s+)?INDEX\b[\s\S]*?\bWHERE\s+([\s\S]*)$/i);
    if (index) {
      if (index[1] && !/^\w+ IS NOT NULL$/i.test(index[2].trim())) throw new Error('Unsupported MySQL partial unique index');
      code = code.replace(/\s+WHERE\s+[\s\S]*$/i, '');
    }
    if (/^CREATE TABLE/i.test(code)) code += ' ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin';
  }
  if (/::|\bON CONFLICT\b|\bFILTER\s*\(/i.test(code)) throw new Error('Unsupported PostgreSQL syntax for MySQL');
  // Replace only placeholders in executable SQL; literal $1 stays literal.
  const values = [];
  code = code.replace(/\$(\d+)/g, (_, n) => {
    if (Number(n) < 1 || Number(n) > params.length) throw new Error('Missing SQL parameter');
    const value = params[Number(n) - 1];
    values.push(value != null && typeof value === 'object' && !(value instanceof Date) && !Buffer.isBuffer(value) ? JSON.stringify(value) : value ?? null);
    return '?';
  });
  return { text: restore(code), values, conflict };
}

// PostgreSQL accepts RFC3339 timestamp strings, while strict MariaDB DATETIME
// rejects their Z suffix. Normalize only parameters bound to timestamp columns;
// dates inside notes, JSON or other text remain byte-for-byte unchanged.
export function timestampParams(text, params, timestampColumns) {
  const {code} = protectSql(text);
  const result = [...params];
  const tables = [...code.matchAll(/\b(?:FROM|JOIN|UPDATE|INTO)\s+(\w+)/gi)].map(m => m[1]);
  const isTimestamp = column => tables.some(table => timestampColumns.has(`${table}.${column}`));
  function convert(column, expression) {
    if (!isTimestamp(column)) return;
    for (const match of expression.matchAll(/\$(\d+)/g)) {
      const i = Number(match[1]) - 1, value = result[i];
      if (typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,6})?Z$/.test(value)) result[i] = value.replace('T', ' ').slice(0, -1);
    }
  }
  for (const m of code.matchAll(/\b(\w+)\s*(?:=|>=|<=|>|<)\s*(\$\d+)/g)) convert(m[1], m[2]);
  const insert = code.match(/^\s*INSERT INTO\s+\w+\s*\(([^)]+)\)\s*VALUES\s*([\s\S]+)/i);
  if (insert) {
    const columns = insert[1].split(',').map(c => c.trim());
    let depth = 0, start = 0, values = [];
    const tail = insert[2];
    for (let i = 0; i < tail.length; i++) {
      if (tail[i] === '(') { if (depth === 0) start = i + 1; depth++; }
      else if (tail[i] === ')') {
        depth--;
        if (depth === 0) {
          values.push(tail.slice(start, i));
          values.forEach((v, n) => convert(columns[n], v)); values = [];
          const rest = tail.slice(i + 1).trimStart();
          if (!rest.startsWith(',')) break;
        }
      } else if (tail[i] === ',' && depth === 1) { values.push(tail.slice(start, i)); start = i + 1; }
    }
  }
  return result;
}
