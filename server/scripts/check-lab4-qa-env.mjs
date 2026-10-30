// Fail closed before any older fixture helper can read server/.env.
const database=new URL(process.env.DATABASE_URL??'http://invalid');
const admin=new URL(process.env.LAB4_TEST_ADMIN_URL??'http://invalid');
if(database.protocol!=='postgresql:'||database.hostname!=='127.0.0.1'||database.port!=='55484'||!/^\/lab4_p[78]_reg_[a-z0-9_]+$/.test(database.pathname)||admin.protocol!=='postgresql:'||admin.hostname!=='127.0.0.1'||admin.port!=='55484'||admin.pathname!=='/postgres'||!process.env.LAB4_PG_BIN||process.env.LAB4_PERF_TEST!=='1'){
  console.error('Refusing full QA: explicit dedicated127.0.0.1:55484/lab4_p[78]_reg_* DATABASE_URL, LAB4_TEST_ADMIN_URL ending /postgres, LAB4_PG_BIN and LAB4_PERF_TEST=1 required. Never use the working database.');process.exit(1);
}
console.log('QA environment accepted: isolated reserved regression database; DB/performance suites enabled.');
