import { randomUUID } from 'node:crypto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import {
  closeTestDatabase,
  resetTestDatabase,
  testDatabase,
} from './test-database.js';

describe('Activity database constraints', () => {
  let creatorId: string;
  let tripId: string;
  let dayId: string;

  // Same fixture pattern as trip.db-spec.ts and proposal.db-spec.ts.
  async function createTestUser(username: string): Promise<string> {
    const id = randomUUID();
    await testDatabase.query(
      `INSERT INTO "user" ("id", "email", "username", "password_hash")
       VALUES ($1, $2, $3, $4)`,
      [id, `${username}@example.invalid`, username, 'test-placeholder'],
    );
    return id;
  }

  async function createTestTrip(userId = creatorId): Promise<string> {
    const result = await testDatabase.query<{ id: string }>(
      `INSERT INTO "trip"
         ("title", "destination", "start_date", "end_date", "created_by")
       VALUES ($1, $2, $3, $4, $5)
       RETURNING "id"`,
      ['Test trip', 'Paris', '2026-11-03', '2026-11-04', userId],
    );
    return result.rows[0].id;
  }

  async function createTestDay(parentTripId = tripId): Promise<string> {
    const result = await testDatabase.query<{ id: string }>(
      `INSERT INTO "itinerary_day" ("trip_id", "day_number", "date")
       VALUES ($1, $2, $3)
       RETURNING "id"`,
      [parentTripId, 1, '2026-11-03'],
    );
    return result.rows[0].id;
  }

  async function createTestProposal(parentTripId = tripId): Promise<string> {
    const result = await testDatabase.query<{ id: string }>(
      `INSERT INTO "proposal" ("trip_id", "title", "created_by")
       VALUES ($1, $2, $3)
       RETURNING "id"`,
      [parentTripId, 'Museum proposal', creatorId],
    );
    return result.rows[0].id;
  }

  type ActivityInput = {
    tripId?: string;
    dayId?: string;
    proposalId?: string | null;
    startTime?: string;
    endTime?: string | null;
    createdBy?: string;
    updatedBy?: string;
  };

  async function createTestActivity(input: ActivityInput = {}): Promise<string> {
    const result = await testDatabase.query<{ id: string }>(
      `INSERT INTO "activity"
         ("trip_id", "itinerary_day_id", "proposal_id", "title",
          "start_time", "end_time", "created_by", "updated_by")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING "id"`,
      [
        input.tripId ?? tripId,
        input.dayId ?? dayId,
        input.proposalId ?? null,
        'Visit the museum',
        input.startTime ?? '09:00',
        input.endTime === undefined ? '11:00' : input.endTime,
        input.createdBy ?? creatorId,
        input.updatedBy ?? creatorId,
      ],
    );
    return result.rows[0].id;
  }

  beforeEach(async () => {
    await resetTestDatabase();
    creatorId = await createTestUser('activity-creator');
    tripId = await createTestTrip();
    dayId = await createTestDay();
  });

  afterAll(async () => {
    try {
      await resetTestDatabase();
    } finally {
      await closeTestDatabase();
    }
  });

  it('creates an Activity with default version, timestamps, and null origin', async () => {
    const activityId = await createTestActivity();
    const result = await testDatabase.query<{
      version: number;
      proposal_id: string | null;
      created_by: string;
      updated_by: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT "version", "proposal_id", "created_by", "updated_by",
              "created_at", "updated_at"
       FROM "activity" WHERE "id" = $1`,
      [activityId],
    );

    expect(result.rows[0]).toMatchObject({
      version: 1,
      proposal_id: null,
      created_by: creatorId,
      updated_by: creatorId,
    });
    expect(result.rows[0].created_at).toBeInstanceOf(Date);
    expect(result.rows[0].updated_at).toBeInstanceOf(Date);
  });

  it('allows a missing end time and an end time equal to the start time', async () => {
    await createTestActivity({ endTime: null });
    await createTestActivity({ startTime: '09:00', endTime: '09:00' });
    const result = await testDatabase.query(
      `SELECT "id" FROM "activity" WHERE "trip_id" = $1`,
      [tripId],
    );
    expect(result.rows).toHaveLength(2);
  });

  it('rejects an end time earlier than the start time', async () => {
    await expect(
      createTestActivity({ startTime: '18:00', endTime: '09:00' }),
    ).rejects.toMatchObject({
      code: '23514',
      constraint: 'activity_time_check',
    });
  });

  it('rejects a Day that belongs to another Trip', async () => {
    const otherTripId = await createTestTrip();
    const otherDayId = await createTestDay(otherTripId);
    await expect(
      createTestActivity({ dayId: otherDayId }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint: 'activity_trip_id_itinerary_day_id_fkey',
    });
  });

  it('rejects a nonexistent Day', async () => {
    await expect(
      createTestActivity({ dayId: randomUUID() }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint: 'activity_trip_id_itinerary_day_id_fkey',
    });
  });

  it('rejects a nonexistent Trip', async () => {
    await expect(
      createTestActivity({ tripId: randomUUID() }),
    ).rejects.toMatchObject({ code: '23503' });
  });

  it('rejects a Proposal that belongs to another Trip', async () => {
    const otherTripId = await createTestTrip();
    const otherProposalId = await createTestProposal(otherTripId);
    await expect(
      createTestActivity({ proposalId: otherProposalId }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint: 'activity_trip_id_proposal_id_fkey',
    });
  });

  it('rejects a nonexistent Proposal', async () => {
    await expect(
      createTestActivity({ proposalId: randomUUID() }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint: 'activity_trip_id_proposal_id_fkey',
    });
  });

  it('allows multiple direct Activities with null proposal_id', async () => {
    await createTestActivity({ proposalId: null });
    await createTestActivity({ proposalId: null });
    const result = await testDatabase.query(
      `SELECT "id" FROM "activity" WHERE "proposal_id" IS NULL`,
    );
    expect(result.rows).toHaveLength(2);
  });

  it('rejects two Activities originating from the same Proposal', async () => {
    const proposalId = await createTestProposal();
    await createTestActivity({ proposalId });
    await expect(createTestActivity({ proposalId })).rejects.toMatchObject({
      code: '23505',
      constraint: 'activity_proposal_id_key',
    });
  });

  it('rejects an invalid creator', async () => {
    await expect(
      createTestActivity({ createdBy: randomUUID() }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint: 'activity_created_by_fkey',
    });
  });

  it('rejects an invalid last editor', async () => {
    await expect(
      createTestActivity({ updatedBy: randomUUID() }),
    ).rejects.toMatchObject({
      code: '23503',
      constraint: 'activity_updated_by_fkey',
    });
  });

  it('rejects an UPDATE that moves an Activity to a Day in another Trip', async () => {
    const activityId = await createTestActivity();
    const otherTripId = await createTestTrip();
    const otherDayId = await createTestDay(otherTripId);
    await expect(
      testDatabase.query(
        `UPDATE "activity" SET "itinerary_day_id" = $1 WHERE "id" = $2`,
        [otherDayId, activityId],
      ),
    ).rejects.toMatchObject({
      code: '23503',
      constraint: 'activity_trip_id_itinerary_day_id_fkey',
    });
  });

  it('deletes Activity workspace data with Trip while preserving User', async () => {
    const proposalId = await createTestProposal();
    const activityId = await createTestActivity({ proposalId });
    await testDatabase.query(
      `INSERT INTO "proposal_vote" ("proposal_id", "user_id", "decision")
       VALUES ($1, $2, 'AGREE')`,
      [proposalId, creatorId],
    );

    await testDatabase.query(`DELETE FROM "trip" WHERE "id" = $1`, [tripId]);

    for (const [table, id] of [
      ['activity', activityId],
      ['itinerary_day', dayId],
      ['proposal', proposalId],
    ] as const) {
      const result = await testDatabase.query(
        `SELECT "id" FROM "${table}" WHERE "id" = $1`,
        [id],
      );
      expect(result.rows).toHaveLength(0);
    }
    const votes = await testDatabase.query(
      `SELECT "id" FROM "proposal_vote" WHERE "proposal_id" = $1`,
      [proposalId],
    );
    expect(votes.rows).toHaveLength(0);
    const user = await testDatabase.query(
      `SELECT "id" FROM "user" WHERE "id" = $1`,
      [creatorId],
    );
    expect(user.rows).toHaveLength(1);
  });
});
