import { randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// Explicit opt-in, loopback-only, separate temporary cluster. Never infer a
// production target from DATABASE_URL or .env. No database is reset/dropped.
export function testAdminUrl() {
  const value = process.env.LAB4_TEST_ADMIN_URL;
  if (!value) throw new Error('Set LAB4_TEST_ADMIN_URL to a dedicated disposable PostgreSQL cluster');
  const url = new URL(value);
  if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '55484'
      || url.pathname !== '/postgres') throw new Error('Refusing non-test PostgreSQL target (requires loopback:55484/postgres)');
  return url;
}
export function pg(tool: string, args: string[]) {
  const bin = process.env.LAB4_PG_BIN;
  if (!bin) throw new Error('Set LAB4_PG_BIN to the PostgreSQL tools directory');
  return execFileSync(join(bin, process.platform === 'win32' ? `${tool}.exe` : tool), args,
    { encoding: 'utf8', timeout: 60_000, stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
}
export function sql(url: string, statement: string) {
  return pg('psql', ['-X', '--set=ON_ERROR_STOP=1', '-At', '--dbname', url, '-c', statement]).trim();
}
export function newDatabase(label: string) {
  const admin = testAdminUrl();
  const name = `lab4_p2_${label}_${randomUUID().replaceAll('-', '')}`;
  sql(admin.href, `CREATE DATABASE "${name}" TEMPLATE template0`);
  const url = new URL(admin);
  url.pathname = `/${name}`;
  return url.href;
}
export function applySqlMigrations(url: string, includeLab4: boolean) {
  for (const name of readdirSync('prisma/migrations').sort()) {
    if (!/^\d{14}_/.test(name) || (!includeLab4 && name.startsWith('20261028'))) continue;
    pg('psql', ['-X', '--set=ON_ERROR_STOP=1', '--dbname', url,
      '-f', resolve('prisma/migrations', name, 'migration.sql')]);
  }
}
export function prismaCommand(url: string, args: string[]) {
  return execFileSync(process.execPath, [resolve('node_modules/prisma/build/index.js'), ...args],
    { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8', timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
}
export function runSeed(url: string) {
  return execFileSync(process.execPath, ['--import', 'tsx', resolve('prisma/seed.ts')],
    { env: { ...process.env, DATABASE_URL: url }, encoding: 'utf8', timeout: 120_000,
      stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
}
export const legacyTables = ['Category', 'RelatedSystem', 'DevelopmentRequester', 'User',
  'AuthSession', 'Ticket', 'Attachment', 'PublicComment', 'InternalNote'];
export function snapshot(url: string, tables = legacyTables, legacyTicketProjection = false) {
  return Object.fromEntries(tables.map(table => [table, JSON.parse(sql(url,
    `SELECT COALESCE(jsonb_agg(row_data ORDER BY id), '[]'::jsonb) FROM
      (SELECT id, to_jsonb(t) ${legacyTicketProjection && table === 'Ticket' ? "- 'version' - 'lastResolvedAt'" : ''}
       AS row_data FROM "${table}" t) rows`))]));
}
export function backup(url: string) {
  const file = join(mkdtempSync(join(tmpdir(), 'toktickit-lab4-p2-')), 'legacy.dump');
  pg('pg_dump', ['--format=custom', '--no-owner', '--file', file, '--dbname', url]);
  return file;
}
