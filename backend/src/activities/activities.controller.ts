import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { ActivitiesService } from './activities.service.js';
import { CreateActivityDto } from './dto/create-activity.dto.js';
import { UpdateActivityDto } from './dto/update-activity.dto.js';

// Authentication is handled by the global JwtAuthGuard (private by default).
// The controller only extracts params and delegates; the service owns
// membership, cross-Trip and version rules.
@Controller('trips/:tripId/activities')
export class ActivitiesController {
  constructor(
    @Inject(ActivitiesService)
    private readonly activitiesService: ActivitiesService,
  ) {}

  // GET /api/trips/:tripId/activities
  @Get()
  findAll(
    @CurrentUser() user: { sub: string },
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
  ) {
    return this.activitiesService.findAll(user.sub, tripId);
  }

  // GET /api/trips/:tripId/activities/:activityId
  @Get(':activityId')
  findOne(
    @CurrentUser() user: { sub: string },
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
  ) {
    return this.activitiesService.findOne(user.sub, tripId, activityId);
  }

  // POST /api/trips/:tripId/activities  -> 201 (Nest default for POST)
  @Post()
  create(
    @CurrentUser() user: { sub: string },
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Body() input: CreateActivityDto,
  ) {
    return this.activitiesService.create(user.sub, tripId, input);
  }

  // PATCH /api/trips/:tripId/activities/:activityId  -> 200
  @Patch(':activityId')
  update(
    @CurrentUser() user: { sub: string },
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
    @Body() input: UpdateActivityDto,
  ) {
    return this.activitiesService.update(user.sub, tripId, activityId, input);
  }

  // DELETE /api/trips/:tripId/activities/:activityId
  // -> 200 { deletedActivityId, reopenedProposalId } (default status; no body in)
  @Delete(':activityId')
  remove(
    @CurrentUser() user: { sub: string },
    @Param('tripId', new ParseUUIDPipe()) tripId: string,
    @Param('activityId', new ParseUUIDPipe()) activityId: string,
  ) {
    return this.activitiesService.remove(user.sub, tripId, activityId);
  }
}