import { vi } from 'vitest';
import { AuthService } from './auth.service.js';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthUserConflictError } from './auth.dependencies.js';

describe('AuthService', () => {
  it('registers a user without exposing the password hash', async () => {
    const passwords = {
      hash: vi.fn().mockResolvedValue('test-password-hash'),
      verify: vi.fn(),
    };

    const users = {
      findByEmail: vi.fn(),
      create: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'alice@example.com',
        username: 'alice',
        passwordHash: 'test-password-hash',
        createdAt: new Date(),
      }),
    };

    const service = new AuthService(users, passwords);

    const result = await service.register({
      email: 'alice@example.com',
      username: 'alice',
      password: 'example-password',
    });

    expect(passwords.hash).toHaveBeenCalledWith('example-password');

    expect(users.create).toHaveBeenCalledWith({
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: 'test-password-hash',
    });

    expect(result).toEqual({
      user: {
        id: 'test-user-id',
        email: 'alice@example.com',
        username: 'alice',
      },
    });
  });

  it.each([
    ['email', 'EMAIL_ALREADY_EXISTS'],
    ['username', 'USERNAME_ALREADY_EXISTS'],
  ] as const)('reports a duplicate %s', async (field, code) => {
    const users = {
      findByEmail: vi.fn(),
      create: vi.fn().mockRejectedValue(new AuthUserConflictError(field)),
    };

    const passwords = {
      hash: vi.fn().mockResolvedValue('test-password-hash'),
      verify: vi.fn(),
    };

    const service = new AuthService(users, passwords);

    const error: unknown = await service
      .register({
        email: 'alice@example.com',
        username: 'alice',
        password: 'example-password',
      })
      .catch((caught: unknown) => caught);

    expect(error).toBeInstanceOf(ConflictException);

    if (!(error instanceof ConflictException)) {
      throw new Error('Expected a ConflictException');
    }

    expect(error.getStatus()).toBe(409);
    expect(error.getResponse()).toEqual({
      error: {
        code,
        message:
          field === 'email'
            ? 'Email already exists'
            : 'Username already exists',
        details: {},
      },
    });
  });

  it('returns public user information when credentials are valid', async () => {
    const users = {
      findByEmail: vi.fn().mockResolvedValue({
        id: 'test-user-id',
        email: 'alice@example.com',
        username: 'alice',
        passwordHash: 'test-password-hash',
        createdAt: new Date(),
      }),
      create: vi.fn(),
    };

    const passwords = {
      hash: vi.fn(),
      verify: vi.fn().mockResolvedValue(true),
    };

    const service = new AuthService(users, passwords);

    const result = await service.login({
      email: 'alice@example.com',
      password: 'example-password',
    });

    expect(users.findByEmail).toHaveBeenCalledWith('alice@example.com');
    expect(passwords.verify).toHaveBeenCalledWith(
      'example-password',
      'test-password-hash',
    );

    expect(result).toEqual({
      user: {
        id: 'test-user-id',
        email: 'alice@example.com',
        username: 'alice',
      },
    });
  });

  it.each(['unknown email', 'wrong password'])(
    'rejects %s with the same credentials error',
    async (scenario) => {
      const user = {
        id: 'test-user-id',
        email: 'alice@example.com',
        username: 'alice',
        passwordHash: 'test-password-hash',
        createdAt: new Date(),
      };

      const users = {
        findByEmail: vi
          .fn()
          .mockResolvedValue(scenario === 'unknown email' ? null : user),
        create: vi.fn(),
      };

      const passwords = {
        hash: vi.fn(),
        verify: vi.fn().mockResolvedValue(false),
      };

      const service = new AuthService(users, passwords);

      const error: unknown = await service
        .login({
          email: 'alice@example.com',
          password: 'wrong-password',
        })
        .catch((caught: unknown) => caught);

      expect(error).toBeInstanceOf(UnauthorizedException);

      if (!(error instanceof UnauthorizedException)) {
        throw new Error('Expected an UnauthorizedException');
      }

      expect(error.getStatus()).toBe(401);
      expect(error.getResponse()).toEqual({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          details: {},
        },
      });
    },
  );
});
