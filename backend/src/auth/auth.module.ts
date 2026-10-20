import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module.js';
import { UsersRepository } from '../users/users.repository.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import {
  AuthPasswordService,
  AuthUserRepository,
} from './auth.dependencies.js';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { hash, verify } from './utils/password.util.js';
import { MockAuthSessionService } from './mocks/mock-auth-session.service.js';

// Registers auth components with temporary mock dependencies.
@Module({
  imports: [
    UsersModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error(
            'Fatal: The JWT SECRET environment variable is missing, and the server refuses to start',
          );
        }

        return {
          secret: secret,
          signOptions: { expiresIn: '7d' },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    MockAuthSessionService,
    JwtAuthGuard,
    {
      provide: AuthUserRepository,
      useExisting: UsersRepository,
    },
    {
      provide: AuthPasswordService,
      useValue: { hash, verify },
    },
  ],
  exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}
