import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthController } from './auth.controller.js';
import { AuthUserRepository } from './auth.dependencies.js';
import { AuthService } from './auth.service.js';
import { MockAuthPasswordService } from './mocks/mock-auth-password.service.js';
import { MockAuthSessionService } from './mocks/mock-auth-session.service.js';

// Registers auth components with temporary mock dependencies.
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [
    AuthService,
    MockAuthPasswordService,
    MockAuthSessionService,
    {
      provide: AuthUserRepository,
      useExisting: UsersRepository,
    },
  ],
})
export class AuthModule {}
