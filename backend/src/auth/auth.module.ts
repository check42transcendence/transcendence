import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { MockAuthUserStore } from './mocks/mock-auth-user.store.js';
import { MockAuthPasswordService } from './mocks/mock-auth-password.service.js';

@Module({
  controllers: [AuthController],
  providers: [AuthService, MockAuthUserStore, MockAuthPasswordService],
})
export class AuthModule {}
