import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  Get,
  ValidationPipe,
  HttpCode,
  Req,
  Res,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';
import type { Request, Response } from 'express';
import { MockAuthSessionService } from './mocks/mock-auth-session.service.js';

// Handles auth HTTP requests and calls the user and session services.
@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,

    @Inject(MockAuthSessionService)
    private readonly sessions: MockAuthSessionService,
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

  // Starts a session only after credential verification succeeds.
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

  // Calls the session clear tool and returns an empty response.
  @Post('logout')
  @HttpCode(204)
  async logout(@Res({ passthrough: true }) response: Response): Promise<void> {
    await this.sessions.clear(response);
  }

  // Uses the identity supplied by the session tool to load the user.
  @Get('me')
  async me(@Req() request: Request) {
    const userId = await this.sessions.getCurrentUserId(request);
    return this.authService.me(userId);
  }
}
