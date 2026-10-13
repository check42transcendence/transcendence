import { randomUUID } from 'node:crypto';
import { AuthUserConflictError } from '../auth.dependencies.js';
import { Injectable } from '@nestjs/common';

type MockUser = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
};

// Stores mock users in memory; restarting the app clears them.
@Injectable()
export class MockAuthUserStore {
  private readonly users: MockUser[] = [];

  // Checks case-insensitive uniqueness before adding a mock user.
  async create(input: {
    email: string;
    username: string;
    passwordHash: string;
  }): Promise<MockUser> {
    const emailExists = this.users.some(
      (user) => user.email.toLowerCase() === input.email.toLowerCase(),
    );
    if (emailExists) {
      throw new AuthUserConflictError('email');
    }

    const usernameExists = this.users.some(
      (user) => user.username.toLowerCase() === input.username.toLowerCase(),
    );
    if (usernameExists) {
      throw new AuthUserConflictError('username');
    }

    const user = {
      id: randomUUID(),
      email: input.email,
      username: input.username,
      passwordHash: input.passwordHash,
    };
    this.users.push(user);
    console.log('Mock user count:', this.users.length);
    return user;
  }

  // Looks up an email without changing its stored casing.
  async findByEmail(email: string): Promise<MockUser | null> {
    const user = this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );

    return user ?? null;
  }

  async findById(id: string): Promise<MockUser | null> {
    const user = this.users.find((user) => user.id === id);

    return user ?? null;
  }
}
