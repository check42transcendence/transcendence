import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

// TODO: after built, uncomment
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({

        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { 
          expiresIn: '7d'
        },
      }),
    }),
  ],
  // TODO: after built, uncomment
  // controllers: [AuthController],
  // providers: [AuthService],
})
export class AuthModule {}