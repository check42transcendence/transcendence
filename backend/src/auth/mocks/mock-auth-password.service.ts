import { Injectable } from '@nestjs/common';

@Injectable()
export class MockAuthPasswordService {
  verificationSucceeds = false;

  async verify(_password: string, _passwordHash: string): Promise<boolean> {
    console.log('Mock 密码验证： ', this.verificationSucceeds);
    return this.verificationSucceeds;
  }

  async hash(_password: string): Promise<string> {
    console.log('Mock 密码处理：返回固定测试标记');

    return 'mock-password-hash';
  }
}
