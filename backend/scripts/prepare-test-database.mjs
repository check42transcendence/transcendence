import { spawnSync } from 'node:child_process';
import { assertTestDatabaseUrl } from './test-database-url.mjs';

const { connectionString, databaseName } =
  assertTestDatabaseUrl('TEST_DATABASE_URL');

console.log(
  `Preparing dedicated test database "${databaseName}".`,
);

const npmCommand =
  process.platform === 'win32' ? 'npm.cmd' : 'npm';

const result = spawnSync(
  npmCommand,
  ['run', 'prisma:migrate:deploy'],
  {
    stdio: 'inherit',
    env: {
      ...process.env,
      DATABASE_URL: connectionString,
    },
  },
);

if (result.error) {
  throw result.error;
}

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}