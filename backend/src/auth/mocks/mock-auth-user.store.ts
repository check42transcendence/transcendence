import { randomUUID } from 'node:crypto';
import { AuthUserConflictError } from '../auth.dependencies.js';
import { Injectable } from '@nestjs/common';

type MockUser = {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
};

@Injectable()
export class MockAuthUserStore {
  private readonly users: MockUser[] = [];

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
    console.log('Mock 中的用户数量：', this.users.length);
    return user;
  }

  async findByEmail(email: string): Promise<MockUser | null> {
    const user = this.users.find(
      (user) => user.email.toLowerCase() === email.toLowerCase(),
    );

    return user ?? null;
  }
}
