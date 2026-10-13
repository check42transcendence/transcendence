import { Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';

// Simulates session calls without JWTs or real cookies.
@Injectable()
export class MockAuthSessionService {
  async start(userId: string, _response: Response): Promise<void> {
    console.log('Mock session start called. User ID:', userId);
    console.log('This mock does not issue JWTs or set cookies');
  }

  async clear(_response: Response): Promise<void> {
    console.log('Mock session clear called');
    console.log('This mock does not clear real cookies');
  }

  // Returns no identity unless a test overrides this method.
  async getCurrentUserId(_request: Request): Promise<string | null> {
    return null;
  }
}
