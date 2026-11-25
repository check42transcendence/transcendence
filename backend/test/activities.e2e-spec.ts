import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

import { assertTestDatabaseUrl } from '../scripts/test-database-url.mjs';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/database/prisma.service.js';
import { RealtimeService } from '../src/realtime/realtime.service.js';

// Uses the existing E2E setup: real NestJS, JWT cookies and PostgreSQL.
// Only Realtime delivery is mocked so event assertions are deterministic.
describe('Activity HTTP integration (#95 / #96)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let ownerCookie: string;
  let memberCookie: string;
  let outsiderCookie: string;

  const ownerId = randomUUID();
  const memberId = randomUUID();
  const outsiderId = randomUUID();

  let tripId: string;
  let otherTripId: string;
  let dayId: string;
  let otherDayId: string;

  const realtimeMock = {
    emitActivityToTrip: vi.fn().mockResolvedValue(undefined),
    removeTripRoom: vi.fn().mockResolvedValue(undefined),
    removeUserFromTrip: vi.fn().mockResolvedValue(undefined),
  };

  const validInput = () => ({
    itineraryDayId: dayId,
    title: 'Visit Louvre',
    startTime: '09:00',
    endTime: '11:00',
    location: 'Paris',
    description: 'Museum visit',
  });

  const collectionPath = () => `/api/trips/${tripId}/activities`;
  const detailPath = (id: string, parentTripId = tripId) =>
    `/api/trips/${parentTripId}/activities/${id}`;

  async function createTrip(title: string) {
    const trip = await prisma.trip.create({
      data: {
        title,
        destination: 'Paris',
        startDate: new Date('2027-01-01T00:00:00.000Z'),
        endDate: new Date('2027-01-02T00:00:00.000Z'),
        createdBy: ownerId,
      },
    });

    await prisma.tripMember.create({
      data: { tripId: trip.id, userId: ownerId, role: 'OWNER' },
    });

    const day = await prisma.itineraryDay.create({
      data: {
        tripId: trip.id,
        dayNumber: 1,
        date: new Date('2027-01-01T00:00:00.000Z'),
      },
    });

    return { tripId: trip.id, dayId: day.id };
  }

  async function createActivity(cookie = ownerCookie) {
    const response = await request(app.getHttpServer())
      .post(collectionPath())
      .set('Cookie', cookie)
      .send(validInput())
      .expect(201);

    return response.body.activity as { id: string; version: number };
  }

  beforeAll(async () => {
    // Never run these tests against a production or regular development DB.
    assertTestDatabaseUrl('DATABASE_URL');
    vi.stubEnv('JWT_SECRET', 'local-activity-http-test-secret');

    const fixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(RealtimeService)
      .useValue(realtimeMock)
      .compile();

    app = fixture.createNestApplication();
    app.use(cookieParser());
    app.setGlobalPrefix('api');
    await app.init();

    prisma = fixture.get(PrismaService);
    await prisma.user.createMany({
      data: [
        {
          id: ownerId,
          email: `${ownerId}@example.invalid`,
          username: `activity-owner-${ownerId.slice(0, 8)}`,
          passwordHash: 'test-placeholder',
        },
        {
          id: memberId,
          email: `${memberId}@example.invalid`,
          username: `activity-member-${memberId.slice(0, 8)}`,
          passwordHash: 'test-placeholder',
        },
        {
          id: outsiderId,
          email: `${outsiderId}@example.invalid`,
          username: `activity-outsider-${outsiderId.slice(0, 8)}`,
          passwordHash: 'test-placeholder',
        },
      ],
    });

    const jwt = fixture.get(JwtService);
    ownerCookie = `token=${await jwt.signAsync({ sub: ownerId })}`;
    memberCookie = `token=${await jwt.signAsync({ sub: memberId })}`;
    outsiderCookie = `token=${await jwt.signAsync({ sub: outsiderId })}`;
  });

  beforeEach(async () => {
    const main = await createTrip('Activity test trip');
    const other = await createTrip('Another trip');
    tripId = main.tripId;
    dayId = main.dayId;
    otherTripId = other.tripId;
    otherDayId = other.dayId;

    await prisma.tripMember.create({
      data: { tripId, userId: memberId, role: 'MEMBER' },
    });

    vi.clearAllMocks();
  });

  afterEach(async () => {
    // Cascades remove Activities, Days and Memberships created in each test.
    await prisma.trip.deleteMany({ where: { createdBy: ownerId } });
  });

  afterAll(async () => {
    try {
      if (prisma) {
        await prisma.user.deleteMany({
          where: { id: { in: [ownerId, memberId, outsiderId] } },
        });
      }
    } finally {
      try {
        await app?.close();
      } finally {
        vi.unstubAllEnvs();
      }
    }
  });

  it('returns 401 when unauthenticated', async () => {
    const response = await request(app.getHttpServer())
      .get(collectionPath())
      .expect(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_REQUIRED');
  });

  it('allows OWNER and MEMBER to create direct Activities with server metadata', async () => {
    for (const [cookie, userId] of [
      [ownerCookie, ownerId],
      [memberCookie, memberId],
    ] as const) {
      const created = await request(app.getHttpServer())
        .post(collectionPath())
        .set('Cookie', cookie)
        .send({ ...validInput(), title: '  Louvre Museum  ' })
        .expect(201);

      expect(created.body.activity).toMatchObject({
        tripId,
        itineraryDayId: dayId,
        proposalId: null,
        title: 'Louvre Museum',
        startTime: '09:00',
        endTime: '11:00',
        version: 1,
        createdBy: { id: userId },
        updatedBy: { id: userId },
      });
    }

    expect(realtimeMock.emitActivityToTrip).toHaveBeenCalledTimes(2);
  });

  it('lists Activities and gets one in the requested Trip', async () => {
    const created = await createActivity();
    const listed = await request(app.getHttpServer())
      .get(collectionPath())
      .set('Cookie', memberCookie)
      .expect(200);
    expect(listed.body.activities.map((a: { id: string }) => a.id)).toEqual([
      created.id,
    ]);

    const detail = await request(app.getHttpServer())
      .get(detailPath(created.id))
      .set('Cookie', memberCookie)
      .expect(200);
    expect(detail.body.activity.id).toBe(created.id);
  });

  it('hides Trips and Activities from non-members and across Trips', async () => {
    const created = await createActivity();
    const ownPath = detailPath(created.id);

    for (const method of ['get', 'patch', 'delete'] as const) {
      let call = request(app.getHttpServer())[method](ownPath)
        .set('Cookie', outsiderCookie);
      if (method === 'patch') call = call.send({ expectedVersion: 1, title: 'No access' });
      const response = await call.expect(404);
      expect(response.body.error.code).toBe('TRIP_NOT_FOUND');
    }

    const crossTrip = await request(app.getHttpServer())
      .get(detailPath(created.id, otherTripId))
      .set('Cookie', ownerCookie)
      .expect(404);
    expect(crossTrip.body.error.code).toBe('ACTIVITY_NOT_FOUND');

    const crossTripPatch = await request(app.getHttpServer())
      .patch(detailPath(created.id, otherTripId))
      .set('Cookie', ownerCookie)
      .send({ expectedVersion: 1, title: 'No access' })
      .expect(404);
    expect(crossTripPatch.body.error.code).toBe('ACTIVITY_NOT_FOUND');
  });

  it('rejects invalid Day, reversed time and server-controlled create fields', async () => {
    const cases = [
      { ...validInput(), itineraryDayId: otherDayId },
      { ...validInput(), startTime: '18:00', endTime: '09:00' },
      { ...validInput(), title: '     ' },
      { ...validInput(), title: null },
      { ...validInput(), startTime: '25:30' },
      { ...validInput(), version: 99 },
      { ...validInput(), proposalId: randomUUID() },
      { ...validInput(), createdBy: outsiderId },
    ];

    for (const input of cases) {
      const response = await request(app.getHttpServer())
        .post(collectionPath())
        .set('Cookie', ownerCookie)
        .send(input)
        .expect(400);
      expect(['VALIDATION_ERROR', 'ACTIVITY_DAY_INVALID']).toContain(
        response.body.error.code,
      );
    }
    expect(await prisma.activity.count({ where: { tripId } })).toBe(0);
    expect(realtimeMock.emitActivityToTrip).not.toHaveBeenCalled();
  });

  it('enforces PATCH visibility before checking for an empty update', async () => {
    const created = await createActivity();
    vi.clearAllMocks();

    const outsider = await request(app.getHttpServer())
      .patch(detailPath(created.id))
      .set('Cookie', outsiderCookie)
      .send({ expectedVersion: 1 })
      .expect(404);
    expect(outsider.body.error.code).toBe('TRIP_NOT_FOUND');

    const missing = await request(app.getHttpServer())
      .patch(detailPath(randomUUID()))
      .set('Cookie', ownerCookie)
      .send({ expectedVersion: 1 })
      .expect(404);
    expect(missing.body.error.code).toBe('ACTIVITY_NOT_FOUND');

    const empty = await request(app.getHttpServer())
      .patch(detailPath(created.id))
      .set('Cookie', ownerCookie)
      .send({ expectedVersion: 1 })
      .expect(400);
    expect(empty.body.error.code).toBe('VALIDATION_ERROR');
    expect(realtimeMock.emitActivityToTrip).not.toHaveBeenCalled();
  });

  it('rejects null for non-nullable PATCH fields and accepts null for nullable fields', async () => {
    const created = await createActivity();
    vi.clearAllMocks();

    for (const changes of [
      { title: null },
      { startTime: null },
      { itineraryDayId: null },
    ]) {
      const response = await request(app.getHttpServer())
        .patch(detailPath(created.id))
        .set('Cookie', ownerCookie)
        .send({ expectedVersion: 1, ...changes })
        .expect(400);
      expect(response.body.error.code).toBe('VALIDATION_ERROR');
    }

    const updated = await request(app.getHttpServer())
      .patch(detailPath(created.id))
      .set('Cookie', memberCookie)
      .send({ expectedVersion: 1, endTime: null, location: null, description: null })
      .expect(200);

    expect(updated.body.activity).toMatchObject({
      version: 2,
      endTime: null,
      location: null,
      description: null,
      updatedBy: { id: memberId },
    });
  });

  it('rejects moving an Activity to a Day belonging to another Trip', async () => {
    const created = await createActivity();
    const response = await request(app.getHttpServer())
      .patch(detailPath(created.id))
      .set('Cookie', ownerCookie)
      .send({ expectedVersion: 1, itineraryDayId: otherDayId })
      .expect(400);
    expect(response.body.error.code).toBe('ACTIVITY_DAY_INVALID');
  });

  it('returns 409 for stale PATCH without changing persisted data or broadcasting', async () => {
    const created = await createActivity();
    await request(app.getHttpServer())
      .patch(detailPath(created.id))
      .set('Cookie', memberCookie)
      .send({ expectedVersion: 1, title: 'Updated by member' })
      .expect(200);

    const before = await prisma.activity.findUniqueOrThrow({ where: { id: created.id } });
    vi.clearAllMocks();

    const stale = await request(app.getHttpServer())
      .patch(detailPath(created.id))
      .set('Cookie', ownerCookie)
      .send({ expectedVersion: 1, title: 'Stale change' })
      .expect(409);
    expect(stale.body.error.code).toBe('ACTIVITY_VERSION_CONFLICT');

    const after = await prisma.activity.findUniqueOrThrow({ where: { id: created.id } });
    expect(after.title).toBe(before.title);
    expect(after.version).toBe(2);
    expect(after.updatedBy).toBe(memberId);
    expect(after.updatedAt.getTime()).toBe(before.updatedAt.getTime());
    expect(realtimeMock.emitActivityToTrip).not.toHaveBeenCalled();
  });

  it('allows only one of two concurrent PATCH requests with the same version', async () => {
    const created = await createActivity();
    vi.clearAllMocks();

    const [a, b] = await Promise.all([
      request(app.getHttpServer())
        .patch(detailPath(created.id))
        .set('Cookie', ownerCookie)
        .send({ expectedVersion: 1, title: 'From owner' }),
      request(app.getHttpServer())
        .patch(detailPath(created.id))
        .set('Cookie', memberCookie)
        .send({ expectedVersion: 1, title: 'From member' }),
    ]);

    expect([a.status, b.status].sort()).toEqual([200, 409]);
    const winning = a.status === 200 ? a : b;
    const losing = a.status === 409 ? a : b;
    expect(losing.body.error.code).toBe('ACTIVITY_VERSION_CONFLICT');

    const saved = await prisma.activity.findUniqueOrThrow({ where: { id: created.id } });
    expect(saved.version).toBe(2);
    expect(saved.title).toBe(winning.body.activity.title);
    expect(saved.updatedBy).toBe(
      winning.body.activity.updatedBy.id,
    );
    expect(realtimeMock.emitActivityToTrip).toHaveBeenCalledTimes(1);
    expect(realtimeMock.emitActivityToTrip).toHaveBeenCalledWith(
      tripId,
      'activity:updated',
      expect.objectContaining({
        activity: expect.objectContaining({ id: created.id, version: 2 }),
      }),
    );
  });

  it('deletes a direct Activity without an expectedVersion body', async () => {
    const created = await createActivity();
    vi.clearAllMocks();

    const response = await request(app.getHttpServer())
      .delete(detailPath(created.id))
      .set('Cookie', memberCookie)
      .expect(200);
    expect(response.body).toEqual({
      deletedActivityId: created.id,
      reopenedProposalId: null,
    });
    expect(await prisma.activity.findUnique({ where: { id: created.id } })).toBeNull();
    expect(realtimeMock.emitActivityToTrip).toHaveBeenCalledWith(
      tripId,
      'activity:deleted',
      { activityId: created.id, reopenedProposalId: null },
    );
  });
});
