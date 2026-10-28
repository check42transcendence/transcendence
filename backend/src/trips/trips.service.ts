import {
  Injectable,
  Inject,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CreateTripDto } from './dto/create-trip.dto.js';
import { PrismaService } from '../database/prisma.service.js';

@Injectable()
export class TripsService {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: PrismaService,
  ) {}

  // Create a trip with its owner membership and all days.
  async create(creatorId: string, input: CreateTripDto) {
    if (input.endDate < input.startDate) {
      throw new BadRequestException(
        'End date must not be earlier than start date',
      );
    }

    // Use UTC midnight to avoid local time-zone and daylight-saving shifts.
    const startDate = new Date(`${input.startDate}T00:00:00.000Z`);
    const endDate = new Date(`${input.endDate}T00:00:00.000Z`);
    const millisecondsPerDay = 24 * 60 * 60 * 1000;
    const dayCount =
      (endDate.getTime() - startDate.getTime()) / millisecondsPerDay + 1;

    // Build one day entry for each date in the trip.
    const days: { dayNumber: number; date: Date }[] = [];
    for (let index = 0; index < dayCount; index++) {
      const day = new Date(startDate.getTime() + index * millisecondsPerDay);

      days.push({
        dayNumber: index + 1,
        date: day,
      });
    }

    // Save the trip, owner membership, and days atomically.
    const trip = await this.prisma.trip.create({
      data: {
        title: input.title,
        destination: input.destination,
        description: input.description ?? null,
        startDate,
        endDate,
        createdBy: creatorId,
        members: {
          create: {
            userId: creatorId,
            role: 'OWNER',
          },
        },
        days: {
          create: days,
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    // Return the public trip detail in the API format.
    return {
      trip: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        description: trip.description,
        startDate: trip.startDate.toISOString().slice(0, 10),
        endDate: trip.endDate.toISOString().slice(0, 10),
        currentUserRole: 'OWNER',
        createdBy: {
          id: trip.creator.id,
          username: trip.creator.username,
        },
        createdAt: trip.createdAt.toISOString(),
      },
    };
  }

  // Find trips where the user has a current membership.
  async findAll(userId: string) {
    const trips = await this.prisma.trip.findMany({
      where: {
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        members: {
          where: {
            userId: userId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    // Convert database records to public trip summaries.
    return {
      trips: trips.map((trip) => {
        return {
          id: trip.id,
          title: trip.title,
          destination: trip.destination,
          description: trip.description,
          startDate: trip.startDate.toISOString().slice(0, 10),
          endDate: trip.endDate.toISOString().slice(0, 10),
          currentUserRole: trip.members[0].role,
        };
      }),
    };
  }

  // Return trip details only to a current member.
  async findOne(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
          },
        },
        members: {
          where: {
            userId: userId,
          },
          select: {
            role: true,
          },
        },
      },
    });

    // Do not reveal whether an inaccessible trip exists.
    if (!trip) {
      throw new NotFoundException({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found',
          details: {},
        },
      });
    }

    // Return the public detail with the caller's actual role.
    return {
      trip: {
        id: trip.id,
        title: trip.title,
        destination: trip.destination,
        description: trip.description,
        startDate: trip.startDate.toISOString().slice(0, 10),
        endDate: trip.endDate.toISOString().slice(0, 10),
        createdBy: {
          id: trip.creator.id,
          username: trip.creator.username,
        },
        createdAt: trip.createdAt.toISOString(),
        currentUserRole: trip.members[0].role,
      },
    };
  }

  // Return itinerary days only to a current member.
  async findDays(userId: string, tripId: string) {
    const trip = await this.prisma.trip.findFirst({
      where: {
        id: tripId,
        members: {
          some: {
            userId: userId,
          },
        },
      },
      select: {
        days: {
          orderBy: {
            dayNumber: 'asc',
          },
          select: {
            id: true,
            tripId: true,
            dayNumber: true,
            date: true,
          },
        },
      },
    });

    if (!trip) {
      throw new NotFoundException({
        error: {
          code: 'TRIP_NOT_FOUND',
          message: 'Trip not found',
          details: {},
        },
      });
    }

    // Convert day dates to the API's YYYY-MM-DD format.
    return {
      days: trip.days.map((day) => {
        return {
          id: day.id,
          tripId: day.tripId,
          dayNumber: day.dayNumber,
          date: day.date.toISOString().slice(0, 10),
        };
      }),
    };
  }
}
