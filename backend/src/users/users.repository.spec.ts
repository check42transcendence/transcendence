import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { PrismaService } from '../database/prisma.service.js';
import { UsersRepository } from './users.repository.js';

const findFirst = vi.fn();
const findUnique = vi.fn();
const create = vi.fn();

const prisma = {
  user: {
    findFirst,
    findUnique,
    create,
  },
} as unknown as PrismaService;

const users = new UsersRepository(prisma);

const testUser = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'alice@example.com',
  username: 'Alice',
  passwordHash: 'test-placeholder',
  createdAt: new Date(),
};

const input = {
  email: 'alice@example.com',
  username: 'Alice',
  passwordHash: 'test-placeholder',
};

function duplicateError(index: string) {
  return {
    code: 'P2002',
    meta: {
      driverAdapterError: {
        cause: {
          originalMessage:
            `duplicate key value violates unique constraint "${index}"`,
        },
      },
    },
  };
}

describe('UsersRepository', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('findByEmail: trims and ignores case', async () => {
    findFirst.mockResolvedValue(testUser);

    const result = await users.findByEmail('  ALICE@EXAMPLE.COM  ');

    expect(result).toEqual(testUser);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        email: {
          equals: 'ALICE@EXAMPLE.COM',
          mode: 'insensitive',
        },
      },
    });
  });

  it('findByEmail: returns null when missing', async () => {
    findFirst.mockResolvedValue(null);

    await expect(users.findByEmail('missing@example.com'))
      .resolves.toBeNull();
  });

  it('findByEmail: escapes LIKE wildcard characters', async () => {
  findFirst.mockResolvedValue(testUser);

  const result = await users.findByEmail(
    '  A_B%C\\D@example.com  ',
  );

  expect(result).toEqual(testUser);

  expect(findFirst).toHaveBeenCalledWith({
    where: {
      email: {
        equals: 'A\\_B\\%C\\\\D@example.com',
        mode: 'insensitive',
      },
    },
  });
});

  it('findById: queries the exact ID', async () => {
    findUnique.mockResolvedValue(testUser);

    const result = await users.findById(testUser.id);

    expect(result).toEqual(testUser);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: testUser.id },
    });
  });

  it('findByUsername: trims and ignores case', async () => {
    findFirst.mockResolvedValue(testUser);

    const result = await users.findByUsername('  ALICE  ');

    expect(result).toEqual(testUser);
    expect(findFirst).toHaveBeenCalledWith({
      where: {
        username: {
          equals: 'ALICE',
          mode: 'insensitive',
        },
      },
    });
  });

it('findByUsername: escapes LIKE wildcard characters', async () => {
  findFirst.mockResolvedValue(testUser);

  const result = await users.findByUsername(
    '  A_B%C\\D  ',
  );

  expect(result).toEqual(testUser);

  expect(findFirst).toHaveBeenCalledWith({
    where: {
      username: {
        equals: 'A\\_B\\%C\\\\D',
        mode: 'insensitive',
      },
    },
  });
});

  it('create: trims fields and returns created user', async () => {
    create.mockResolvedValue(testUser);

    const result = await users.create({
      ...input,
      email: '  alice@example.com  ',
      username: '  Alice  ',
    });

    expect(result).toEqual(testUser);
    expect(create).toHaveBeenCalledWith({
      data: input,
    });
  });

  it('create: recognizes duplicate email', async () => {
    create.mockRejectedValue(
      duplicateError('user_email_ci_unique'),
    );

    await expect(users.create(input)).rejects.toMatchObject({
      name: 'AuthUserConflictError',
      field: 'email',
    });
  });

  it('create: recognizes duplicate username', async () => {
    create.mockRejectedValue(
      duplicateError('user_username_ci_unique'),
    );

    await expect(users.create(input)).rejects.toMatchObject({
      name: 'AuthUserConflictError',
      field: 'username',
    });
  });

  it('create: preserves unexpected errors', async () => {
    const originalError = new Error('Database connection failed');

    create.mockRejectedValue(originalError);

    await expect(users.create(input)).rejects.toBe(originalError);
  });
});