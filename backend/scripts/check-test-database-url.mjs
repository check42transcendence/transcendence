import { assertTestDatabaseUrl } from './test-database-url.mjs';

const envName = process.argv[2];

if (!envName) {
  throw new Error(
    'Usage: node ./scripts/check-test-database-url.mjs <ENV_VAR_NAME>',
  );
}

const { databaseName } = assertTestDatabaseUrl(envName);

console.log(`Verified dedicated test database "${databaseName}".`);
