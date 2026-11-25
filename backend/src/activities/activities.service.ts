import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import type {
  ActivityListResponse,
  ActivityRealtimeEventData,
  ActivityRealtimeEventName,
  ActivityResponse,
  DeleteActivityResult,
} from '@tripcollab/shared';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { RealtimeService } from '../realtime/realtime.service.js';
import {
  ACTIVITY_INCLUDE,
  fromTime,
  toActivityDto,
  toTime,
} from './activities.mapper.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

type Tx = Prisma.TransactionClient;

// ---------------------------------------------------------------------------
// Error builders. All use the frozen envelope { error: { code, message, details } }
// so HttpExceptionFilter keeps them unchanged.
// ---------------------------------------------------------------------------

function apiError(code: string, message: string) {
  return { error: { code, message, details: {} } };
}

const tripNotFound = () =>
  new NotFoundException(apiError('TRIP_NOT_FOUND', 'Trip not found'));

const activityNotFound = () =>
  new NotFoundException(apiError('ACTIVITY_NOT_FOUND', 'Activity not found'));

// NOTE: contract 05 does not state the HTTP status for this code.
// 400 is used here (the Day id comes from the body, not the URL); confirm
// with the Tech Lead.
const dayInvalid = () =>
  new BadRequestException(
    apiError('ACTIVITY_DAY_INVALID', 'Invalid itinerary day for this Trip'),
  );

const validationError = () =>
  new BadRequestException(
    apiError('VALIDATION_ERROR', 'Invalid request input'),
  );

const versionConflict = () =>
  new ConflictException(
    apiError(
      'ACTIVITY_VERSION_CONFLICT',
      'Activity was updated by someone else',
    ),
  );

// ---------------------------------------------------------------------------
// Transaction helpers.
// ---------------------------------------------------------------------------

// Read-only membership check (no lock). Non-members get 404, never 403,
// following the existing Trip/Proposal services.
async function requireMember(
  tx: Tx,
  userId: string,
  tripId: string,
): Promise<void> {
  const membership = await tx.tripMember.findUnique({
    where: { tripId_userId: { tripId, userId } },
    select: { id: true },
  });

  if (!membership) {
    throw tripNotFound();
  }
}

// Write path: lock the Trip row FOR SHARE first (this conflicts with Leave's
// FOR UPDATE, so a leaving Member cannot slip a write in), then verify the
// current Membership. Lock order is always Trip first, Proposal second.
async function lockTripAndRequireMember(
  tx: Tx,
  userId: string,
  tripId: string,
): Promise<void> {
  const trips = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT "id"
    FROM "trip"
    WHERE "id" = ${tripId}::uuid
    FOR SHARE
  `;

  if (trips.length === 0) {
    throw tripNotFound();
  }

  await requireMember(tx, userId, tripId);
}

// The Day must exist AND belong to the URL Trip.
async function requireDayInTrip(
  tx: Tx,
  tripId: string,
  dayId: string,
): Promise<void> {
  const day = await tx.itineraryDay.findFirst({
    where: { id: dayId, tripId },
    select: { id: true },
  });

  if (!day) {
    throw dayInvalid();
  }
}

// "HH:mm" strings compare correctly as plain strings.
function assertTimeOrder(startTime: string, endTime: string | null): void {
  if (endTime !== null && endTime < startTime) {
    throw validationError();
  }
}

// Backstop: the DB CHECK constraint activity_time_check should never fire
// because we validate first, but map it to 400 instead of a 500 if it does.
function isTimeCheckViolation(error: unknown): boolean {
  if (typeof error !== 'object' || error === null) {
    return false;
  }

  try {
    return JSON.stringify(error, Object.getOwnPropertyNames(error)).includes(
      'activity_time_check',
    );
  } catch {
    return false;
  }
}

function translateDbError(error: unknown): unknown {
  return isTimeCheckViolation(error) ? validationError() : error;
}

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
    @Inject(RealtimeService)
    private readonly realtime: RealtimeService,
  ) {}

  // Broadcast AFTER the transaction committed. A broadcast failure must never
  // turn an already-committed write into an error response.
  private async emitAfterCommit<K extends ActivityRealtimeEventName>(
    tripId: string,
    eventName: K,
    data: ActivityRealtimeEventData[K],
  ): Promise<void> {
    try {
      await this.realtime.emitActivityToTrip(tripId, eventName, data);
    } catch (error: unknown) {
      this.logger.error(
        `Failed to broadcast ${eventName} (tripId=${tripId})`,
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  // List Activities of a Trip for a current participant.
  // Order: Day number, then start time, then id as a stable tie-breaker.
  // (Contract says "start-time order"; confirm whether the UI wants a global
  // start-time order across Days instead.)
  async findAll(userId: string, tripId: string): Promise<ActivityListResponse> {
    return this.prisma.$transaction(
      async (tx) => {
        await requireMember(tx, userId, tripId);

        const rows = await tx.activity.findMany({
          where: { tripId },
          orderBy: [
            { day: { dayNumber: 'asc' } },
            { startTime: 'asc' },
            { id: 'asc' },
          ],
          include: ACTIVITY_INCLUDE,
        });

        return { activities: rows.map(toActivityDto) };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  // Get one Activity. An Activity from another Trip simply is not found here.
  async findOne(
    userId: string,
    tripId: string,
    activityId: string,
  ): Promise<ActivityResponse> {
    return this.prisma.$transaction(
      async (tx) => {
        await requireMember(tx, userId, tripId);

        const row = await tx.activity.findFirst({
          where: { id: activityId, tripId },
          include: ACTIVITY_INCLUDE,
        });

        if (!row) {
          throw activityNotFound();
        }

        return { activity: toActivityDto(row) };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead },
    );
  }

  // Create a direct Activity. Identity, audit fields, version and Proposal
  // origin are all server-controlled.
  async create(
    userId: string,
    tripId: string,
    input: CreateActivityDto,
  ): Promise<ActivityResponse> {
    const endTime = input.endTime ?? null;
    assertTimeOrder(input.startTime, endTime);

    let record;
    try {
      record = await this.prisma.$transaction(async (tx) => {
        await lockTripAndRequireMember(tx, userId, tripId);
        await requireDayInTrip(tx, tripId, input.itineraryDayId);

        return tx.activity.create({
          data: {
            tripId,
            itineraryDayId: input.itineraryDayId,
            title: input.title,
            startTime: fromTime(input.startTime),
            endTime: endTime === null ? null : fromTime(endTime),
            location: input.location ?? null,
            description: input.description ?? null,
            createdBy: userId,
            updatedBy: userId,
          },
          include: ACTIVITY_INCLUDE,
        });
      });
    } catch (error: unknown) {
      throw translateDbError(error);
    }

    const activity = toActivityDto(record);
    await this.emitAfterCommit(tripId, 'activity:created', { activity });
    return { activity };
  }

  // Update with optimistic concurrency control (OCC).
  // Check order matters so that 404/400 are never misreported as 409:
  //   1. membership  2. Activity exists in this Trip  3. input valid
  //   4. atomic version-matched UPDATE  5. count === 0 => 404 or 409.
  async update(
    userId: string,
    tripId: string,
    activityId: string,
    input: UpdateActivityDto,
  ): Promise<ActivityResponse> {
    const { expectedVersion, ...changes } = input;

    let record;
    try {
      record = await this.prisma.$transaction(async (tx) => {
        // 1. Current participant (Trip locked FOR SHARE).
        await lockTripAndRequireMember(tx, userId, tripId);

        // 2. The Activity must exist inside THIS Trip.
        const current = await tx.activity.findFirst({
          where: { id: activityId, tripId },
          select: { startTime: true, endTime: true },
        });

        if (!current) {
          throw activityNotFound();
        }

		if (Object.values(changes).every(
			(value) => value === undefined,
		)) {
			throw validationError();
		}

        // 3. Validate the input against the Trip and the merged time range.
        if (changes.itineraryDayId !== undefined) {
          await requireDayInTrip(tx, tripId, changes.itineraryDayId);
        }

        const nextStart = changes.startTime ?? toTime(current.startTime);
        const nextEnd =
          changes.endTime === undefined
            ? current.endTime
              ? toTime(current.endTime)
              : null
            : changes.endTime;
        assertTimeOrder(nextStart, nextEnd);

        // Omitted = unchanged, null = clear (nullable fields), value = replace.
        const data: Prisma.ActivityUncheckedUpdateManyInput = {
          version: { increment: 1 },
          updatedBy: userId, // from the verified cookie, never from the body
          updatedAt: new Date(),
        };

        if (changes.title !== undefined) data.title = changes.title;
        if (changes.itineraryDayId !== undefined) {
          data.itineraryDayId = changes.itineraryDayId;
        }
        if (changes.startTime !== undefined) {
          data.startTime = fromTime(changes.startTime);
        }
        if (changes.endTime !== undefined) {
          data.endTime =
            changes.endTime === null ? null : fromTime(changes.endTime);
        }
        if (changes.location !== undefined) data.location = changes.location;
        if (changes.description !== undefined) {
          data.description = changes.description;
        }

        // 4. ATOMIC version-matched update. Under READ COMMITTED a competing
        // writer blocks on the row lock, then re-evaluates the WHERE clause
        // after the first commit; it sees the new version and matches 0 rows.
        const result = await tx.activity.updateMany({
          where: { id: activityId, tripId, version: expectedVersion },
          data,
        });

        // 5. Nothing updated: the row existed at step 2, so either it was
        // deleted concurrently (404) or the version is stale (409).
        if (result.count === 0) {
          const stillThere = await tx.activity.findFirst({
            where: { id: activityId, tripId },
            select: { id: true },
          });

          throw stillThere ? versionConflict() : activityNotFound();
        }

        return tx.activity.findUniqueOrThrow({
          where: { id: activityId },
          include: ACTIVITY_INCLUDE,
        });
      });
    } catch (error: unknown) {
      throw translateDbError(error);
    }

    // Reached only after COMMIT: rejected updates never broadcast.
    const activity = toActivityDto(record);
    await this.emitAfterCommit(tripId, 'activity:updated', { activity });
    return { activity };
  }

  // Delete an Activity. No expectedVersion (contract: DELETE is outside OCC).
  async remove(
    userId: string,
    tripId: string,
    activityId: string,
  ): Promise<DeleteActivityResult> {
    const result = await this.prisma.$transaction(async (tx) => {
      await lockTripAndRequireMember(tx, userId, tripId);

      const activity = await tx.activity.findFirst({
        where: { id: activityId, tripId },
        select: { id: true, proposalId: true },
      });

      if (!activity) {
        throw activityNotFound();
      }

      // Direct Activity: plain delete.
      if (activity.proposalId === null) {
        const deleted = await tx.activity.deleteMany({
          where: { id: activityId, tripId },
        });

        if (deleted.count !== 1) {
          throw activityNotFound(); // deleted by a concurrent request
        }

        return { deletedActivityId: activityId, reopenedProposalId: null };
      }

      // Proposal-sourced Activity: delete + ACCEPTED -> PENDING in this one
      // transaction (contract 04 section 19).
      // TODO(#47): the reopen rule belongs to Issue #47. When its shared
      // method exists, replace the body below with a call that receives `tx`,
      // so the logic is not duplicated. Lock order stays Trip -> Proposal.
      await tx.$queryRaw`
        SELECT "id"
        FROM "proposal"
        WHERE "id" = ${activity.proposalId}::uuid
          AND "trip_id" = ${tripId}::uuid
        FOR UPDATE
      `;

      const deleted = await tx.activity.deleteMany({
        where: { id: activityId, tripId },
      });

      if (deleted.count !== 1) {
        throw activityNotFound();
      }

      const reopened = await tx.proposal.updateMany({
        where: { id: activity.proposalId, tripId, status: 'ACCEPTED' },
        data: { status: 'PENDING' },
      });

      return {
        deletedActivityId: activityId,
        reopenedProposalId: reopened.count === 1 ? activity.proposalId : null,
      };
    });

    // Committed. (proposal:reopened is emitted by the #47 work, not here.)
    await this.emitAfterCommit(tripId, 'activity:deleted', {
      activityId: result.deletedActivityId,
      reopenedProposalId: result.reopenedProposalId,
    });

    return result;
  }
}