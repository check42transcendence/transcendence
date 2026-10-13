import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { MockAuthUserStore } from './mocks/mock-auth-user.store.js';
import { MockAuthPasswordService } from './mocks/mock-auth-password.service.js';
import { MockAuthSessionService } from './mocks/mock-auth-session.service.js';

// Registers auth components with temporary mock dependencies.
@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    MockAuthUserStore,
    MockAuthPasswordService,
    MockAuthSessionService,
  ],
})
export class AuthModule {}
