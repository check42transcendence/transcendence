import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AuthPasswordService,
  AuthUserConflictError,
  AuthUserRepository,
} from './auth.dependencies.js';
import type { RegisterDto } from './dto/register.dto.js';
import type { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @Inject(AuthUserRepository)
    private readonly users: AuthUserRepository,

    @Inject(AuthPasswordService)
    private readonly passwords: AuthPasswordService,
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
        const isEmail = error.field === 'email';

        throw new ConflictException({
          error: {
            code: isEmail ? 'EMAIL_ALREADY_EXISTS' : 'USERNAME_ALREADY_EXISTS',
            message: isEmail
              ? 'Email already exists'
              : 'Username already exists',
            details: {},
          },
        });
      }

      throw error;
    }
  }

  async login(input: LoginDto) {
    const user = await this.users.findByEmail(input.email);

    if (!user) {
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
