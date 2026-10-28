// Explicit command fails instead of silently skipping DB evidence. The general
// suite skips these isolated-cluster tests when no opt-in environment is given.
const target = process.env.LAB4_TEST_ADMIN_URL;
if (!target || !process.env.LAB4_PG_BIN) {
  console.error('Set LAB4_TEST_ADMIN_URL (dedicated loopback:55484/postgres cluster) and LAB4_PG_BIN. No product database is inferred.');
  process.exit(1);
}
const url = new URL(target);
if (!['127.0.0.1', 'localhost'].includes(url.hostname) || url.port !== '55484' || url.pathname !== '/postgres') {
  console.error('Refusing non-test cluster. Requires loopback:55484/postgres.');
  process.exit(1);
}
