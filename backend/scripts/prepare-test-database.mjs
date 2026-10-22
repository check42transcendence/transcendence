import { spawnSync } from 'node:child_process';

const connectionString = process.env.TEST_DATABASE_URL;

if (!connectionString) {
  throw new Error('TEST_DATABASE_URL is not defined');
}

const url = new URL(connectionString);
const databaseName = decodeURIComponent(
  url.pathname.replace(/^\/+/, ''),
);

if (!databaseName) {
  throw new Error(
    'TEST_DATABASE_URL does not include a database name',
  );
}

if (!databaseName.endsWith('_test')) {
  throw new Error(
    `Refusing to prepare database "${databaseName}". ` +
      'The test database name must end with "_test".',
  );
}

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