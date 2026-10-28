import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, beforeAll, describe, it, vi } from 'vitest';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';

describe('Trip endpoint authentication', () => {
  let app: INestApplication<App>;

  // Use the real routes and guard without connecting to a database.
  beforeAll(async () => {
    vi.stubEnv('JWT_SECRET', 'local-trip-auth-test-secret');

    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  // Close the test server and restore environment overrides.
  afterAll(async () => {
    try {
      await app?.close();
    } finally {
      vi.unstubAllEnvs();
    }
  });

  // Reject unauthenticated requests before any database operation.
  it('requires authentication for all four trip endpoints', async () => {
    const tripId = '00000000-0000-4000-8000-000000000000';
    const authError = {
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
        details: {},
      },
    };

    await request(app.getHttpServer())
      .post('/api/trips')
      .send({
        title: 'Paris weekend',
        destination: 'Paris',
        startDate: '2026-11-03',
        endDate: '2026-11-04',
      })
      .expect(401, authError);

    for (const path of [
      '/api/trips',
      `/api/trips/${tripId}`,
      `/api/trips/${tripId}/days`,
    ]) {
      await request(app.getHttpServer()).get(path).expect(401, authError);
    }
  });
});
