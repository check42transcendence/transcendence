import {
  BadRequestException,
  Body,
  Controller,
  Inject,
  Post,
  ValidationPipe,
  HttpCode,
} from '@nestjs/common';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { AuthService } from './auth.service.js';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    private readonly authService: AuthService,
  ) {}

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
    console.log('注册输入校验通过，用户名： ', input.username);
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(200)
  login(
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
    return this.authService.login(input);
  }
}
