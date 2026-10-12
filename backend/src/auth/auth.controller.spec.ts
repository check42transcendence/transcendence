import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { vi } from 'vitest';
import { AuthController } from './auth.controller.js';
import {
  AuthPasswordService,
  AuthUserRepository,
} from './auth.dependencies.js';
import { AuthService } from './auth.service.js';

describe('Auth HTTP', () => {
  let app: INestApplication<App>;

  const user = {
    id: 'test-user-id',
    email: 'alice@example.com',
    username: 'alice',
    passwordHash: 'test-password-hash',
    createdAt: new Date(),
  };

  const users = {
    findByEmail: vi.fn(),
    create: vi.fn(),
  };

  const passwords = {
    hash: vi.fn(),
    verify: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    users.findByEmail.mockResolvedValue(user);
    users.create.mockResolvedValue(user);
    passwords.hash.mockResolvedValue('test-password-hash');
    passwords.verify.mockResolvedValue(true);

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        AuthService,
        { provide: AuthUserRepository, useValue: users },
        { provide: AuthPasswordService, useValue: passwords },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('POST /api/auth/register returns 201 and public user information', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: ' alice@example.com ',
        username: ' alice ',
        password: 'example-password',
      })
      .expect(201)
      .expect({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });

    expect(users.create).toHaveBeenCalledWith({
      email: 'alice@example.com',
      username: 'alice',
      passwordHash: 'test-password-hash',
    });
  });

  it('rejects invalid registration input before calling the service', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        email: 'not-an-email',
        username: 'alice',
        password: 'example-password',
      })
      .expect(400)
      .expect({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request input',
          details: {},
        },
      });

    expect(passwords.hash).not.toHaveBeenCalled();
    expect(users.create).not.toHaveBeenCalled();
  });

  it('POST /api/auth/login returns 200 for valid credentials', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'example-password',
      })
      .expect(200)
      .expect({
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      });
  });

  it('returns 401 for invalid credentials', async () => {
    passwords.verify.mockResolvedValue(false);

    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'alice@example.com',
        password: 'wrong-password',
      })
      .expect(401)
      .expect({
        error: {
          code: 'INVALID_CREDENTIALS',
          message: 'Invalid email or password',
          details: {},
        },
      });
  });
});
