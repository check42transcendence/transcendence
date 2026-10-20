const DEFAULT_POSTGRES_PORT = '5432';
const DEFAULT_POSTGRES_SCHEMA = 'public';

function readDatabaseTarget(variableName) {
  const connectionString = process.env[variableName];

  if (!connectionString) {
    throw new Error(`${variableName} is not defined`);
  }

  const url = new URL(connectionString);
  const databaseName = decodeURIComponent(
    url.pathname.replace(/^\/+/, ''),
  );

  if (!databaseName) {
    throw new Error(
      `${variableName} does not include a database name`,
    );
  }

  return {
    variableName,
    databaseName,
    hostname: url.hostname,
    port: url.port || DEFAULT_POSTGRES_PORT,
    schema:
      url.searchParams.get('schema') ||
      DEFAULT_POSTGRES_SCHEMA,
  };
}

function requireTestDatabase(target) {
  if (!target.databaseName.endsWith('_test')) {
    throw new Error(
      `${target.variableName} must point to a database whose name ends with "_test".`,
    );
  }
}

const migrationDatabase = readDatabaseTarget(
  'DATABASE_URL',
);
const testDatabase = readDatabaseTarget(
  'TEST_DATABASE_URL',
);

requireTestDatabase(migrationDatabase);
requireTestDatabase(testDatabase);

const sameTarget =
  migrationDatabase.hostname === testDatabase.hostname &&
  migrationDatabase.port === testDatabase.port &&
  migrationDatabase.databaseName ===
    testDatabase.databaseName &&
  migrationDatabase.schema === testDatabase.schema;

if (!sameTarget) {
  throw new Error(
    'DATABASE_URL and TEST_DATABASE_URL must point to the same dedicated test database.',
  );
}

console.log(
  `Validated dedicated test database "${testDatabase.databaseName}".`,
);