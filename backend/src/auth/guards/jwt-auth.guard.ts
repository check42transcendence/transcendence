import {
	CanActivate,
	ExecutionContext,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard implements CanActivate
{
	constructor(private jwtService: JwtService) {}
	async canActivate(context: ExecutionContext): Promise<boolean>
	{
		const request = context.switchToHttp().getRequest<Request>();
		const token = request.cookies?.token;
		if (!token)
		{
			throw new UnauthorizedException('You are not logged in or your credentials have expired');
		}
		try
		{
			const payload = await this.jwtService.verifyAsync(token);
			(request as any).user = payload;
		}
		catch
		{
			throw new UnauthorizedException('Invalid credentials or expired. Please log in again')
		}
		return true;
	}
}
