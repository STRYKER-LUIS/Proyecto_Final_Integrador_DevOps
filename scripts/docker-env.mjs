import { randomBytes } from 'node:crypto';
import { chmodSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const examplePath = path.join(root, '.env.docker.example');
const targetPath = path.join(root, '.env.docker');

if (!existsSync(examplePath)) {
  console.error('No se encontró .env.docker.example.');
  process.exit(1);
}

const existing = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : '';
const base = existing.trim().length > 0 ? existing : readFileSync(examplePath, 'utf8');

const replacements = {
  __GENERATE_DB__: randomBytes(24).toString('base64url'),
  __GENERATE_ACCESS__: randomBytes(48).toString('base64url'),
  __GENERATE_REFRESH__: randomBytes(48).toString('base64url'),
};

let content = base;

for (const [placeholder, value] of Object.entries(replacements)) {
  content = content.replaceAll(placeholder, value);
}

if (content === base && existsSync(targetPath)) {
  console.log('[docker] .env.docker ya contiene secretos configurados; no se modifica.');
  process.exit(0);
}

writeFileSync(targetPath, content, { encoding: 'utf8', mode: 0o600 });

try {
  chmodSync(targetPath, 0o600);
} catch {
  // En sistemas sin permisos POSIX (por ejemplo, FAT32) se mantiene el archivo igual.
}

console.log('[docker] .env.docker generado con secretos aleatorios.');
