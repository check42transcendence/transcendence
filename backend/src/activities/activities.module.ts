import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module.js';
import { RealtimeModule } from '../realtime/realtime.module.js';
import { ActivitiesController } from './activities.controller.js';
import { ActivitiesService } from './activities.service.js';

// RealtimeModule exports RealtimeService (used for post-commit events).
@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [ActivitiesController],
  providers: [ActivitiesService],
})
export class ActivitiesModule {}