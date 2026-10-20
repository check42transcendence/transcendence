import { Pool } from 'pg';

export function getTestDatabaseUrl(): string {
  const connectionString = process.env.TEST_DATABASE_URL;

  if (!connectionString) {
    throw new Error('TEST_DATABASE_URL is not defined');
  }

  const url = new URL(connectionString);
  const databaseName = url.pathname.replace(/^\//, '');

  if (!databaseName.endsWith('_test')) {
    throw new Error(
      `Refusing to run database tests against "${databaseName}". ` +
        'The test database name must end with "_test".',
    );
  }

  return connectionString;
}

function quoteIdentifier(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

export const testDatabase = new Pool({
  connectionString: getTestDatabaseUrl(),
});

export async function resetTestDatabase(): Promise<void> {
  const client = await testDatabase.connect();

  try {
    const result = await client.query<{ tablename: string }>(`
      SELECT tablename
      FROM pg_tables
      WHERE schemaname = 'public'
        AND tablename <> '_prisma_migrations'
    `);

    if (result.rows.length === 0) {
      return;
    }

    const tables = result.rows
      .map(
        ({ tablename }) =>
          `${quoteIdentifier('public')}.${quoteIdentifier(tablename)}`,
      )
      .join(', ');

    await client.query(`TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE`);
  } finally {
    client.release();
  }
}

export async function closeTestDatabase(): Promise<void> {
  await testDatabase.end();
}
