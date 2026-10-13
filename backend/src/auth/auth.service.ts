import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUserConflictError } from './auth.dependencies.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { MockAuthUserStore } from './mocks/mock-auth-user.store.js';
import { MockAuthPasswordService } from './mocks/mock-auth-password.service.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(MockAuthUserStore)
    private readonly users: MockAuthUserStore,

    @Inject(MockAuthPasswordService)
    private readonly passwords: MockAuthPasswordService,
  ) {}

  async register(input: RegisterDto) {
    const passwordHash = await this.passwords.hash(input.password);
    try {
      const user = await this.users.create({
        email: input.email,
        username: input.username,
        passwordHash,
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      if (error instanceof AuthUserConflictError) {
        if (error.field === 'email') {
          throw new ConflictException({
            error: {
              code: 'EMAIL_ALREADY_EXISTS',
              message: 'Email already exists',
              details: {},
            },
          });
        }

        if (error.field === 'username') {
          throw new ConflictException({
            error: {
              code: 'USERNAME_ALREADY_EXISTS',
              message: 'Username already exists',
              details: {},
            },
          });
        }
      }

      throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.users.findByEmail(input.email);

    if (user === null) {
      throw this.invalidCredentials();
    }

    const passwordMatches = await this.passwords.verify(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        details: {},
      },
    });
  }
}
