import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUserConflictError } from '../users/auth-user-conflict.error.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';
import { AuthUserRepository } from './auth.dependencies.js';
import { MockAuthPasswordService } from './mocks/mock-auth-password.service.js';

// Coordinates user creation, credential checks, and current-user lookup.
@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthUserRepository)
    private readonly users: AuthUserRepository,

    @Inject(MockAuthPasswordService)
    private readonly passwords: MockAuthPasswordService,
  ) {}

  // Uses the same error for an unknown email and a wrong password.
  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException({
      error: {
        code: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password',
        details: {},
      },
    });
  }

  private authenticationRequired(): UnauthorizedException {
    return new UnauthorizedException({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
        details: {},
      },
    });
  }

  // Passes the password hash to storage and returns only public fields.
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
      // Converts known user conflicts into the contract's HTTP errors.
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

  // Verifies credentials; the controller handles the session step.
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

  // Rejects missing identity or a user that no longer exists.
  async me(userId: string | null) {
    if (userId === null) {
      throw this.authenticationRequired();
    }

    const user = await this.users.findById(userId);

    if (user === null) {
      throw this.authenticationRequired();
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
    };
  }
}
