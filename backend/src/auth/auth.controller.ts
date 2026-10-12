import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Inject,
  Post,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

function validationFor(dto: typeof RegisterDto | typeof LoginDto) {
  return new ValidationPipe({
    expectedType: dto,
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
  });
}

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  @HttpCode(201)
  register(@Body(validationFor(RegisterDto)) input: RegisterDto) {
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(200)
  login(@Body(validationFor(LoginDto)) input: LoginDto) {
    return this.authService.login(input);
  }
}
