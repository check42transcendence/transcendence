import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { PrismaService } from '../src/database/prisma.service.js';
import { UsersRepository } from '../src/users/users.repository.js';

describe('UsersRepository: PostgreSQL exact matching', () => {
  const prisma = new PrismaService();
  const users = new UsersRepository(prisma);

  const suffix = randomUUID().replaceAll('-', '');

  const plainEmail = `alice-${suffix}@example.invalid`;
  const plainUsername = `alice${suffix}`;

  const specialEmail = `a_b%c\\d-${suffix}@example.invalid`;
  const specialUsername = `a_b%c\\d${suffix}`;

  const createdIds: string[] = [];

  let specialUserId = '';

  beforeAll(async () => {
    await prisma.$connect();

    const plainUser = await users.create({
      email: plainEmail,
      username: plainUsername,
      passwordHash: 'test-placeholder',
    });

    createdIds.push(plainUser.id);

    const specialUser = await users.create({
      email: specialEmail,
      username: specialUsername,
      passwordHash: 'test-placeholder',
    });

    createdIds.push(specialUser.id);
    specialUserId = specialUser.id;
  });

  afterAll(async () => {
    try {
      if (createdIds.length > 0) {
        await prisma.user.deleteMany({
          where: {
            id: { in: createdIds },
          },
        });
      }
    } finally {
      await prisma.$disconnect();
    }
  });

  it('email: underscore does not match arbitrary character', async () => {
    const result = await users.findByEmail(
      plainEmail.replace('l', '_'),
    );

    expect(result).toBeNull();
  });

  it('email: percent does not match arbitrary characters', async () => {
    const result = await users.findByEmail(
      plainEmail.replace('li', '%'),
    );

    expect(result).toBeNull();
  });

  it('username: underscore does not match arbitrary character', async () => {
    const result = await users.findByUsername(
      plainUsername.replace('l', '_'),
    );

    expect(result).toBeNull();
  });

  it('username: percent does not match arbitrary characters', async () => {
    const result = await users.findByUsername(
      plainUsername.replace('li', '%'),
    );

    expect(result).toBeNull();
  });

  it('email: literal special characters still match ignoring case', async () => {
    const result = await users.findByEmail(
      `  ${specialEmail.toUpperCase()}  `,
    );

    expect(result?.id).toBe(specialUserId);
  });

  it('username: literal special characters still match ignoring case', async () => {
    const result = await users.findByUsername(
      `  ${specialUsername.toUpperCase()}  `,
    );

    expect(result?.id).toBe(specialUserId);
  });
});