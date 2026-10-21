import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Response } from 'express';

// Manages authentication cookies for login and logout.
@Injectable()
export class AuthSessionService {
  constructor(
    @Inject(JwtService)
    private readonly jwt: JwtService,
  ) {}

  // Signs a JWT and sets the authentication cookie.
  async start(userId: string, response: Response): Promise<void> {
    const token = await this.jwt.signAsync({ sub: userId });

    response.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  // Clears the authentication cookie on logout.
  async clear(response: Response): Promise<void> {
    response.clearCookie('token', {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
    });
  }
}
