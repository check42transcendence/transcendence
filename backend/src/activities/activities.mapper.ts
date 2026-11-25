import type { Activity } from '@tripcollab/shared';
import type { Prisma } from '../generated/prisma/client.js';

// One shared include so every query returns the same record shape.
export const ACTIVITY_INCLUDE = {
  creator: { select: { id: true, username: true } },
  editor: { select: { id: true, username: true } },
} satisfies Prisma.ActivityInclude;

export type ActivityRecord = Prisma.ActivityGetPayload<{
  include: typeof ACTIVITY_INCLUDE;
}>;

// PostgreSQL TIME -> "HH:mm". Prisma returns a Date on 1970-01-01 (UTC).
export function toTime(value: Date): string {
  return value.toISOString().slice(11, 16);
}

// "HH:mm" -> Date on 1970-01-01 (UTC), the shape Prisma expects for TIME.
export function fromTime(value: string): Date {
  return new Date(`1970-01-01T${value}:00.000Z`);
}

// Convert a database record into the public API shape from @tripcollab/shared.
export function toActivityDto(record: ActivityRecord): Activity {
  return {
    id: record.id,
    tripId: record.tripId,
    itineraryDayId: record.itineraryDayId,
    proposalId: record.proposalId,
    title: record.title,
    startTime: toTime(record.startTime),
    endTime: record.endTime ? toTime(record.endTime) : null,
    location: record.location,
    description: record.description,
    version: record.version,
    createdBy: { id: record.creator.id, username: record.creator.username },
    updatedBy: { id: record.editor.id, username: record.editor.username },
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}
