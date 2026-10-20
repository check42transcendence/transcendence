import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  closeTestDatabase,
  getTestDatabaseUrl,
  resetTestDatabase,
  testDatabase,
} from './test-database.js';

describe('Database test foundation', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await testDatabase.query('DROP TABLE IF EXISTS "db_test_probe"');

    await closeTestDatabase();
  });

  it('refuses to run without TEST_DATABASE_URL', () => {
    const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;

    try {
      delete process.env.TEST_DATABASE_URL;

      expect(() => getTestDatabaseUrl()).toThrow(
        'TEST_DATABASE_URL is not defined',
      );
    } finally {
      if (originalTestDatabaseUrl === undefined) {
        delete process.env.TEST_DATABASE_URL;
      } else {
        process.env.TEST_DATABASE_URL = originalTestDatabaseUrl;
      }
    }
  });

  it('refuses to run against a non-test database', () => {
    const originalTestDatabaseUrl = process.env.TEST_DATABASE_URL;

    try {
      process.env.TEST_DATABASE_URL =
        'postgresql://user:password@localhost:5432/transcendence';

      expect(() => getTestDatabaseUrl()).toThrow(
        'The test database name must end with "_test".',
      );
    } finally {
      if (originalTestDatabaseUrl === undefined) {
        delete process.env.TEST_DATABASE_URL;
      } else {
        process.env.TEST_DATABASE_URL = originalTestDatabaseUrl;
      }
    }
  });

  it('connects to a dedicated test database', async () => {
    const result = await testDatabase.query<{
      currentDatabase: string;
    }>('SELECT current_database() AS "currentDatabase"');

    expect(result.rows[0]?.currentDatabase.endsWith('_test')).toBe(true);
  });

  it('has the schema created by committed migrations', async () => {
    const result = await testDatabase.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = 'user'
      ) AS "exists"
    `);

    expect(result.rows[0]?.exists).toBe(true);
  });

  it('preserves Prisma migration history when resetting data', async () => {
    const before = await testDatabase.query<{ count: string }>(`
    SELECT COUNT(*)::text AS count
    FROM "_prisma_migrations"
  `);

    expect(Number(before.rows[0]?.count ?? 0)).toBeGreaterThan(0);

    await resetTestDatabase();

    const after = await testDatabase.query<{ count: string }>(`
    SELECT COUNT(*)::text AS count
    FROM "_prisma_migrations"
  `);

    expect(after.rows[0]?.count).toBe(before.rows[0]?.count);
  });

  it('clears table data without dropping the table', async () => {
    await testDatabase.query(`
      CREATE TABLE IF NOT EXISTS "db_test_probe" (
        "id" SERIAL PRIMARY KEY,
        "value" TEXT NOT NULL
      )
    `);

    await testDatabase.query(`
      INSERT INTO "db_test_probe" ("value")
      VALUES ('before reset')
    `);

    await resetTestDatabase();

    const result = await testDatabase.query<{ count: string }>(`
      SELECT COUNT(*)::text AS count
      FROM "db_test_probe"
    `);

    expect(result.rows[0]?.count).toBe('0');
  });
});
