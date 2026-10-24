export function assertTestDatabaseUrl(envName) {
  const connectionString = process.env[envName];

  if (!connectionString) {
    throw new Error(`${envName} is not defined`);
  }

  let url;

  try {
    url = new URL(connectionString);
  } catch {
    throw new Error(`${envName} is not a valid database URL`);
  }

  if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
    throw new Error(
      `${envName} must use the PostgreSQL protocol`,
    );
  }

  let databaseName;

  try {
    databaseName = decodeURIComponent(
      url.pathname.replace(/^\/+/, ''),
    );
  } catch {
    throw new Error(`${envName} has an invalid database name`);
  }

  if (!databaseName) {
    throw new Error(
      `${envName} does not include a database name`,
    );
  }

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to use database "${databaseName}". ` +
        `${envName} must point to a dedicated test database ` +
        'whose name ends with "_test".',
    );
  }

  return {
    connectionString,
    databaseName,
  };
}
