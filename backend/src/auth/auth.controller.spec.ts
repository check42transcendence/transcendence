import { Test } from '@nestjs/testing';
import request from 'supertest';
import { vi } from 'vitest';
import { AuthModule } from './auth.module.js';
import { MockAuthPasswordService } from './mocks/mock-auth-password.service.js';
import { MockAuthSessionService } from './mocks/mock-auth-session.service.js';
import { MockAuthUserStore } from './mocks/mock-auth-user.store.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  AuthPasswordService,
  AuthUserRepository,
} from './auth.dependencies.js';

// Checks HTTP responses and session calls using mock dependencies.
describe('AuthController login', () => {
  it('calls the session tool after successful verification', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthUserRepository)
      .useClass(MockAuthUserStore)
      .overrideProvider(AuthPasswordService)
      .useClass(MockAuthPasswordService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const passwords = module.get<MockAuthPasswordService>(AuthPasswordService);
    passwords.verificationSucceeds = true;

    const sessions = module.get(MockAuthSessionService);
    const startSpy = vi.spyOn(sessions, 'start');

    const app = module.createNestApplication();
    app.setGlobalPrefix('api');

    try {
      await app.init();

      await request(app.getHttpServer())
        .post('/api/auth/register')
        .send({
          email: 'yihe@example.com',
          username: 'yihe',
          password: 'example-password',
        })
        .expect(201);

      expect(startSpy).not.toHaveBeenCalled();

      const response = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({
          email: 'yihe@example.com',
          password: 'example-password',
        })
        .expect(200);

      expect(response.body).toEqual({
        user: {
          id: expect.any(String),
          email: 'yihe@example.com',
          username: 'yihe',
        },
      });

      expect(startSpy).toHaveBeenCalledTimes(1);
      expect(startSpy).toHaveBeenCalledWith(
        expect.any(String),
        expect.anything(),
      );
    } finally {
      await app.close();
      vi.restoreAllMocks();
    }
  });

  it('returns the user identified by the session tool', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthUserRepository)
      .useClass(MockAuthUserStore)
      .overrideProvider(AuthPasswordService)
      .useClass(MockAuthPasswordService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const users = module.get(AuthUserRepository);

    const user = await users.create({
      email: 'yihe@example.com',
      username: 'yihe',
      passwordHash: 'mock-password-hash',
    });

    const sessions = module.get(MockAuthSessionService);

    vi.spyOn(sessions, 'getCurrentUserId').mockResolvedValue(user.id);

    const app = module.createNestApplication();
    app.setGlobalPrefix('api');

    try {
      await app.init();

      await request(app.getHttpServer())
        .get('/api/auth/me')
        .expect(200)
        .expect({
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
          },
        });
    } finally {
      await app.close();
      vi.restoreAllMocks();
    }
  });

  it('calls the session clear tool and returns 204', async () => {
    const module = await Test.createTestingModule({
      imports: [AuthModule],
    })
      .overrideProvider(AuthUserRepository)
      .useClass(MockAuthUserStore)
      .overrideProvider(AuthPasswordService)
      .useClass(MockAuthPasswordService)
      .overrideProvider(PrismaService)
      .useValue({})
      .compile();

    const sessions = module.get(MockAuthSessionService);
    const clearSpy = vi.spyOn(sessions, 'clear');

    const app = module.createNestApplication();
    app.setGlobalPrefix('api');

    try {
      await app.init();

      const response = await request(app.getHttpServer())
        .post('/api/auth/logout')
        .expect(204);

      expect(response.text).toBe('');
      expect(clearSpy).toHaveBeenCalledTimes(1);
    } finally {
      await app.close();
      vi.restoreAllMocks();
    }
  });
});
