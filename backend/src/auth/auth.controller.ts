import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Get,
  ValidationPipe,
  HttpCode,
  Res,
  UseGuards,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import type { Response } from 'express';
import { AuthSessionService } from './auth-session.service.js';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';
import { CurrentUser } from './decorators/current-user.decorator.js';

// Handles registration, login, logout, and current-user requests.
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,

    @Inject(AuthSessionService)
    private readonly sessions: AuthSessionService,
  ) {}

  // Validates registration input without starting a session.
  @Post('register')
  register(
    @Body(
      new ValidationPipe({
        expectedType: RegisterDto,
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: () =>
          new BadRequestException({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request input',
              details: {},
            },
          }),
      }),
    )
    input: RegisterDto,
  ) {
    console.log('Registration input validated. Username:', input.username);
    return this.authService.register(input);
  }

  // Verifies credentials and sets the authentication cookie.
  @Post('login')
  @HttpCode(200)
  async login(
    @Res({ passthrough: true }) response: Response,
    @Body(
      new ValidationPipe({
        expectedType: LoginDto,
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: true,
        exceptionFactory: () =>
          new BadRequestException({
            error: {
              code: 'VALIDATION_ERROR',
              message: 'Invalid request input',
              details: {},
            },
          }),
      }),
    )
    input: LoginDto,
  ) {
    const result = await this.authService.login(input);
    await this.sessions.start(result.user.id, response);
    return result;
  }

  // Clears the authentication cookie and returns 204.
  @Post('logout')
  @HttpCode(204)
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    await this.sessions.clear(response);
  }

  // Loads the current user after JWT authentication.
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: { sub: string }) {
    return this.authService.me(user.sub);
  }
}
