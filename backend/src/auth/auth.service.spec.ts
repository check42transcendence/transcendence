import { ConflictException } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { MockAuthUserStore } from './mocks/mock-auth-user.store.js';
import { MockAuthPasswordService } from './mocks/mock-auth-password.service.js';

describe('AuthService register', () => {
  let service: AuthService;

  beforeEach(() => {
    const users = new MockAuthUserStore();
    const passwords = new MockAuthPasswordService();
    service = new AuthService(users, passwords);
  });

  it('returns public user information', async () => {
    const result = await service.register({
      email: 'yihe@example.com',
      username: 'yihe',
      password: 'example-password',
    });

    expect(result).toEqual({
      user: {
        id: expect.any(String),
        email: 'yihe@example.com',
        username: 'yihe',
      },
    });
  });

  it('rejects a duplicate email regardless of casing', async () => {
    await service.register({
      email: 'yihe@example.com',
      username: 'yihe',
      password: 'example-password',
    });

    try {
      await service.register({
        email: 'YIHE@example.com',
        username: 'another',
        password: 'example-password',
      });
    } catch (error) {
      if (!(error instanceof ConflictException)) {
        throw error;
      }

      expect(error.getStatus()).toBe(409);
      expect(error.getResponse()).toMatchObject({
        error: { code: 'EMAIL_ALREADY_EXISTS' },
      });
      return;
    }

    throw new Error('Expected an email conflict');
  });

  it('rejects a duplicate username regardless of casing', async () => {
    await service.register({
      email: 'yihe@example.com',
      username: 'yihe',
      password: 'example-password',
    });

    try {
      await service.register({
        email: 'another@example.com',
        username: 'YIHE',
        password: 'example-password',
      });
    } catch (error) {
      if (!(error instanceof ConflictException)) {
        throw error;
      }

      expect(error.getStatus()).toBe(409);
      expect(error.getResponse()).toMatchObject({
        error: { code: 'USERNAME_ALREADY_EXISTS' },
      });
      return;
    }

    throw new Error('Expected a username conflict');
  });

  it('returns public user information when verification succeeds', async () => {
    const users = new MockAuthUserStore();
    const passwords = new MockAuthPasswordService();

    passwords.verificationSucceeds = true;

    const auth = new AuthService(users, passwords);

    const registered = await auth.register({
      email: 'yihe@example.com',
      username: 'yihe',
      password: 'example-password',
    });

    const result = await auth.login({
      email: 'yihe@example.com',
      password: 'example-password',
    });

    expect(result).toEqual(registered);
  });
});
