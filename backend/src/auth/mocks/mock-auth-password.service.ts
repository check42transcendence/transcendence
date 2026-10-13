import { Injectable } from '@nestjs/common';

// Simulates password results without real hashing or verification.
@Injectable()
export class MockAuthPasswordService {
  // Tests can enable the successful verification branch.
  verificationSucceeds = false;

  async verify(_password: string, _passwordHash: string): Promise<boolean> {
    console.log(
      'Mock password verification result:',
      this.verificationSucceeds,
    );
    return this.verificationSucceeds;
  }

  async hash(_password: string): Promise<string> {
    console.log('Mock password hashing: returning a fixed test value');

    return 'mock-password-hash';
  }
}
