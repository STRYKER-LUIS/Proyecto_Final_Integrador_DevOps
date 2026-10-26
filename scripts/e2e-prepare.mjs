import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(root, 'backend', '.env') });
dotenv.config({ path: path.join(root, '.env') });

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  console.error(
    'Falta TEST_DATABASE_URL. Configúrala en backend/.env apuntando a una base de datos aislada.',
  );
  process.exit(1);
}

const databaseName = new URL(testDatabaseUrl).pathname.replace(/^\//, '');

if (!databaseName.endsWith('_test')) {
  console.error(
    `Por seguridad, el nombre de la base E2E debe terminar en "_test". Valor recibido: "${databaseName}".`,
  );
  process.exit(1);
}

if (process.env.NODE_ENV === 'production') {
  console.error('La preparación E2E no puede ejecutarse con NODE_ENV=production.');
  process.exit(1);
}

process.env.DATABASE_URL = testDatabaseUrl;
process.env.NODE_ENV = 'test';
process.env.BCRYPT_ROUNDS = '10';

function findFirst(candidates) {
  const found = candidates.find((candidate) => existsSync(candidate));
  if (!found) {
    throw new Error(`No se encontró ninguno de estos ejecutables: ${candidates.join(', ')}`);
  }
  return found;
}

function run(label, command, args) {
  console.log(`\n[e2e] ${label}`);
  const result = spawnSync(command, args, {
    cwd: root,
    env: process.env,
    stdio: 'inherit',
    shell: false,
  });

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const prismaCli = findFirst([
  path.join(root, 'node_modules', 'prisma', 'build', 'index.js'),
  path.join(root, 'backend', 'node_modules', 'prisma', 'build', 'index.js'),
]);
const tsxCli = findFirst([
  path.join(root, 'node_modules', 'tsx', 'dist', 'cli.mjs'),
  path.join(root, 'backend', 'node_modules', 'tsx', 'dist', 'cli.mjs'),
]);

console.log(`[e2e] Base de datos aislada: ${databaseName}`);

run('Aplicando migraciones', process.execPath, [
  prismaCli,
  'migrate',
  'deploy',
  '--schema',
  path.join(root, 'database', 'prisma', 'schema.prisma'),
]);

const prisma = new PrismaClient();

try {
  console.log('\n[e2e] Limpiando datos de ejecuciones anteriores');
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "activities", "comments", "refresh_sessions", "incidents", "users" RESTART IDENTITY CASCADE',
  );
} finally {
  await prisma.$disconnect();
}

run('Sembrando datos de demostración', process.execPath, [
  tsxCli,
  path.join(root, 'database', 'seeds', 'seed.ts'),
]);

console.log('\n[e2e] Base de datos preparada correctamente.');
