import { Module } from '@nestjs/common';
import { PrismaModule } from '../database/prisma.module.js';
import { UsersRepository } from './users.repository.js';

@Module({
  imports: [PrismaModule],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
