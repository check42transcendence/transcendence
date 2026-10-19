import { afterAll, beforeEach, describe, expect, it } from 'vitest';

import {
  closeTestDatabase,
  resetTestDatabase,
  testDatabase,
} from './test-database.js';

describe('Database test foundation', () => {
  beforeEach(async () => {
    await resetTestDatabase();
  });

  afterAll(async () => {
    await testDatabase.query(
      'DROP TABLE IF EXISTS "db_test_probe"',
    );

    await closeTestDatabase();
  });

  it('connects to the dedicated test database', async () => {
    const result = await testDatabase.query<{
      currentDatabase: string;
    }>(
      'SELECT current_database() AS "currentDatabase"',
    );

    expect(result.rows[0]?.currentDatabase).toBe(
      'transcendence_test',
    );
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