import { randomUUID } from 'node:crypto';
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  vi,
  expect,
  it,
} from 'vitest';
import { PrismaService } from '../../src/database/prisma.service.js';
import { TripsService } from '../../src/trips/trips.service.js';
import {
  closeTestDatabase,
  getTestDatabaseUrl,
  resetTestDatabase,
} from './test-database.js';

describe('TripsService database integration', () => {
  let prisma: PrismaService;
  let tripsService: TripsService;
  let creatorId: string;

  // Connect the service to the dedicated test database.
  beforeAll(async () => {
    vi.stubEnv('DATABASE_URL', getTestDatabaseUrl());

    prisma = new PrismaService();
    tripsService = new TripsService(prisma);

    await prisma.$connect();
  });

  // Clear test data and create a trip creator before each test.
  beforeEach(async () => {
    await resetTestDatabase();

    const creatorUser = await prisma.user.create({
      data: {
        email: 'trip-service@example.invalid',
        username: 'trip-service',
        passwordHash: 'test-placeholder',
      },
    });

    creatorId = creatorUser.id;
  });

  // Clean up test data, connections, and environment overrides.
  afterAll(async () => {
    try {
      await resetTestDatabase();
    } finally {
      try {
        await prisma.$disconnect();
        await closeTestDatabase();
      } finally {
        vi.unstubAllEnvs();
      }
    }
  });

  // Create a trip with its owner and every day in the date range.
  it('creates a trip with an owner and all itinerary days', async () => {
    const createResult = await tripsService.create(creatorId, {
      title: 'Paris weekend',
      destination: 'Paris',
      startDate: '2026-11-03',
      endDate: '2026-11-04',
      description: null,
    });

    const savedTrip = await prisma.trip.findUniqueOrThrow({
      where: {
        id: createResult.trip.id,
      },
      include: {
        members: true,
        days: {
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
    });

    expect(savedTrip.createdBy).toBe(creatorId);

    expect(savedTrip.members).toHaveLength(1);
    expect(savedTrip.members[0]).toMatchObject({
      userId: creatorId,
      role: 'OWNER',
    });

    expect(
      savedTrip.days.map((day) => ({
        dayNumber: day.dayNumber,
        date: day.date.toISOString().slice(0, 10),
      })),
    ).toEqual([
      { dayNumber: 1, date: '2026-11-03' },
      { dayNumber: 2, date: '2026-11-04' },
    ]);
  });

  // Create exactly one day for a single-day trip.
  it('creates one day for a single-day trip', async () => {
    const createResult = await tripsService.create(creatorId, {
      title: 'Paris weekend',
      destination: 'Paris',
      startDate: '2026-11-03',
      endDate: '2026-11-03',
      description: null,
    });

    const savedTrip = await prisma.trip.findUniqueOrThrow({
      where: {
        id: createResult.trip.id,
      },
      select: {
        days: {
          orderBy: {
            dayNumber: 'asc',
          },
        },
      },
    });

    expect(savedTrip.days).toHaveLength(1);

    expect(
      savedTrip.days.map((day) => ({
        dayNumber: day.dayNumber,
        date: day.date.toISOString().slice(0, 10),
      })),
    ).toEqual([{ dayNumber: 1, date: '2026-11-03' }]);
  });

  // Allow the maximum duration, counting both start and end dates.
  it('allows a trip lasting exactly 365 days', async () => {
    const createResult = await tripsService.create(creatorId, {
      title: 'Maximum duration trip',
      destination: 'Paris',
      startDate: '2027-01-01',
      endDate: '2027-12-31',
      description: null,
    });

    const dayCount = await prisma.itineraryDay.count({
      where: {
        tripId: createResult.trip.id,
      },
    });

    expect(dayCount).toBe(365);
  });

  // Reject trips above the limit without saving workspace data.
  it('rejects a trip lasting 366 days without saving data', async () => {
    await expect(
      tripsService.create(creatorId, {
        title: 'Over-limit trip',
        destination: 'Paris',
        startDate: '2027-01-01',
        endDate: '2028-01-01',
        description: null,
      }),
    ).rejects.toThrow('Trip duration must not exceed 365 days');

    expect(await prisma.trip.count()).toBe(0);
    expect(await prisma.tripMember.count()).toBe(0);
    expect(await prisma.itineraryDay.count()).toBe(0);
  });

  // Reject reversed dates without saving a trip.
  it('rejects reversed dates without saving a trip', async () => {
    await expect(
      tripsService.create(creatorId, {
        title: 'Paris weekend',
        destination: 'Paris',
        startDate: '2026-11-04',
        endDate: '2026-11-03',
        description: null,
      }),
    ).rejects.toThrow('End date must not be earlier than start date');

    // Verify that the rejected request leaves no trip records.
    const tripCount = await prisma.trip.count();
    expect(tripCount).toBe(0);
  });

  // List only trips where the caller is a current member.
  it('lists only the current user’s trips', async () => {
    const createInput = {
      title: 'Paris weekend',
      destination: 'Paris',
      startDate: '2026-11-03',
      endDate: '2026-11-04',
      description: null,
    };

    const createResult = await tripsService.create(creatorId, createInput);

    const otherUser = await prisma.user.create({
      data: {
        email: 'other-user@example.invalid',
        username: 'other-user',
        passwordHash: 'test-placeholder',
      },
    });

    await tripsService.create(otherUser.id, createInput);

    const listResult = await tripsService.findAll(creatorId);

    expect(
      listResult.trips.map((trip) => ({
        id: trip.id,
        role: trip.currentUserRole,
      })),
    ).toEqual([
      {
        id: createResult.trip.id,
        role: 'OWNER',
      },
    ]);
  });

  // Allow owners and members to read trip details and ordered days.
  it('allows current members to read trip details and days', async () => {
    const createResult = await tripsService.create(creatorId, {
      title: 'Paris weekend',
      destination: 'Paris',
      startDate: '2026-11-03',
      endDate: '2026-11-04',
      description: null,
    });
    const tripId = createResult.trip.id;

    const memberUser = await prisma.user.create({
      data: {
        email: 'member@example.invalid',
        username: 'member',
        passwordHash: 'test-placeholder',
      },
    });

    await prisma.tripMember.create({
      data: {
        tripId: tripId,
        userId: memberUser.id,
        role: 'MEMBER',
      },
    });

    const callers = [
      { id: creatorId, role: 'OWNER' },
      { id: memberUser.id, role: 'MEMBER' },
    ];

    for (const caller of callers) {
      const listResult = await tripsService.findAll(caller.id);
      expect(listResult.trips).toHaveLength(1);
      expect(listResult.trips[0]).toMatchObject({
        id: tripId,
        currentUserRole: caller.role,
      });

      const detailResult = await tripsService.findOne(caller.id, tripId);

      expect(detailResult.trip).toMatchObject({
        id: tripId,
        currentUserRole: caller.role,
        createdBy: {
          id: creatorId,
          username: 'trip-service',
        },
      });

      const daysResult = await tripsService.findDays(caller.id, tripId);

      expect(
        daysResult.days.map((day) => ({
          dayNumber: day.dayNumber,
          date: day.date,
        })),
      ).toEqual([
        { dayNumber: 1, date: '2026-11-03' },
        { dayNumber: 2, date: '2026-11-04' },
      ]);
    }
  });

  // Roll back all trip data when a nested day insert fails.
  it('rolls back the trip, membership, and days when day creation fails', async () => {
    // Force a real database failure on day 2 in this test only.
    await prisma.$executeRaw`
      ALTER TABLE "itinerary_day"
      ADD CONSTRAINT "trip_service_test_reject_second_day"
      CHECK ("day_number" <> 2)
    `;

    try {
      await expect(
        tripsService.create(creatorId, {
          title: 'Paris weekend',
          destination: 'Paris',
          startDate: '2026-11-03',
          endDate: '2026-11-04',
          description: null,
        }),
      ).rejects.toThrow('trip_service_test_reject_second_day');

      expect(await prisma.trip.count()).toBe(0);
      expect(await prisma.tripMember.count()).toBe(0);
      expect(await prisma.itineraryDay.count()).toBe(0);
      expect(await prisma.user.count()).toBe(1);
    } finally {
      // Restore the test schema even if an assertion fails.
      await prisma.$executeRaw`
        ALTER TABLE "itinerary_day"
        DROP CONSTRAINT "trip_service_test_reject_second_day"
      `;
    }
  });

  // Hide both inaccessible and missing trips from detail and day queries.
  it('rejects non-members and missing trips without exposing trip data', async () => {
    const createResult = await tripsService.create(creatorId, {
      title: 'Paris weekend',
      destination: 'Paris',
      startDate: '2026-11-03',
      endDate: '2026-11-04',
      description: null,
    });

    const otherUser = await prisma.user.create({
      data: {
        email: 'other-user@example.invalid',
        username: 'other-user',
        passwordHash: 'test-placeholder',
      },
    });

    const requests = [
      { userId: otherUser.id, tripId: createResult.trip.id },
      { userId: creatorId, tripId: randomUUID() },
    ];

    for (const request of requests) {
      await expect(
        tripsService.findOne(request.userId, request.tripId),
      ).rejects.toMatchObject({
        status: 404,
        response: { error: { code: 'TRIP_NOT_FOUND' } },
      });

      await expect(
        tripsService.findDays(request.userId, request.tripId),
      ).rejects.toMatchObject({
        status: 404,
        response: { error: { code: 'TRIP_NOT_FOUND' } },
      });
    }
  });

  // Sort newest trips first and use descending IDs for equal timestamps.
  it('orders trips by creation time and then ID descending', async () => {
    const tripRecords = [
      {
        id: '00000000-0000-4000-8000-000000000003',
        createdAt: new Date('2027-01-01T00:00:00.000Z'),
      },
      {
        id: '00000000-0000-4000-8000-000000000001',
        createdAt: new Date('2027-01-02T00:00:00.000Z'),
      },
      {
        id: '00000000-0000-4000-8000-000000000002',
        createdAt: new Date('2027-01-02T00:00:00.000Z'),
      },
    ];

    for (const tripRecord of tripRecords) {
      await prisma.trip.create({
        data: {
          id: tripRecord.id,
          createdAt: tripRecord.createdAt,
          title: 'Sorting test',
          destination: 'Paris',
          startDate: new Date('2027-02-01T00:00:00.000Z'),
          endDate: new Date('2027-02-01T00:00:00.000Z'),
          createdBy: creatorId,
          members: {
            create: {
              userId: creatorId,
              role: 'OWNER',
            },
          },
        },
      });
    }

    const listResult = await tripsService.findAll(creatorId);

    expect(listResult.trips.map((trip) => trip.id)).toEqual([
      '00000000-0000-4000-8000-000000000002',
      '00000000-0000-4000-8000-000000000001',
      '00000000-0000-4000-8000-000000000003',
    ]);
  });
});
