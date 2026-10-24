export interface TestDatabaseUrl {
  connectionString: string;
  databaseName: string;
}

export function assertTestDatabaseUrl(
  envName: string,
): TestDatabaseUrl;
