import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Inject,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { isUUID } from 'class-validator';

// Describes a request with an optional verified user identity.
type AuthenticatedRequest = Request & {
  user?: {
    sub: string;
  };
};

// Checks the JWT cookie before allowing access.
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    @Inject(JwtService)
    private jwtService: JwtService,
  ) {}

  // Creates the standard authentication error.
  private authenticationRequired(): UnauthorizedException {
    return new UnauthorizedException({
      error: {
        code: 'AUTHENTICATION_REQUIRED',
        message: 'Authentication required',
        details: {},
      },
    });
  }

  // Validates the JWT and attaches its user ID to the request.
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const token: unknown = request.cookies?.token;

    if (typeof token !== 'string' || token.length === 0) {
      throw this.authenticationRequired();
    }

    try {
      const payload = await this.jwtService.verifyAsync<{
        sub?: unknown;
      }>(token);

      if (typeof payload.sub !== 'string' || !isUUID(payload.sub)) {
        throw this.authenticationRequired();
      }

      request.user = { sub: payload.sub };

      return true;
    } catch {
      throw this.authenticationRequired();
    }
  }
}
