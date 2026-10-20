import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from './guards/jwt-auth.guard.js';

// TODO: after built, uncomment
// import { AuthController } from './auth.controller';
// import { AuthService } from './auth.service';
@Module({
	imports: [
		JwtModule.registerAsync({
		imports: [ConfigModule],
		inject: [ConfigService],
		useFactory: async (configService: ConfigService) => {
			const secret = configService.get<string>('JWT_SECRET');
			if (!secret)
			{
				throw new Error('Fatal: The JWT SECRET environment variable is missing, and the server refuses to start');
			}

			return {
			secret: secret,
			signOptions: { expiresIn: '7d' },
			};
		},
		}),
	],
	providers: [JwtAuthGuard],
	exports: [JwtModule, JwtAuthGuard],
})
export class AuthModule {}