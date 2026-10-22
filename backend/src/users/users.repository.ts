import { Injectable } from '@nestjs/common';
import type { User } from '../generated/prisma/client.js';
import { PrismaService } from '../database/prisma.service.js';
import { AuthUserConflictError } from './auth-user-conflict.error.js';

export interface CreateUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}
  private escapeLikePattern(value: string): string {
    return value.replace(/[%_\\]/g, '\\$&');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        email: {
          equals: this.escapeLikePattern(email.trim()),
          mode: 'insensitive',
        },
      },
    });
  }
  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: {
        id: id,
      },
    });
  }
  async findByUsername(username: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        username: {
          equals: this.escapeLikePattern(username.trim()),
          mode: 'insensitive',
        },
      },
    });
  }
  async create(input: CreateUserInput): Promise<User> {
    try {
      return await this.prisma.user.create({
        data: {
          email: input.email.trim(),
          username: input.username.trim(),
          passwordHash: input.passwordHash,
        },
      });
    } catch (error: unknown) {
      if (typeof error !== 'object' || error === null) {
        throw error;
      }

      const failure = error as {
        code?: string;
        meta?: {
          driverAdapterError?: {
            cause?: {
              constraint?: {
                index?: string;
              };
              originalMessage?: string;
            };
          };
        };
      };

      if (failure.code !== 'P2002') {
        throw error;
      }

      const cause = failure.meta?.driverAdapterError?.cause;
      const index = cause?.constraint?.index;
      const message = cause?.originalMessage ?? '';

      if (
        index === 'user_email_ci_unique' ||
        message.includes('"user_email_ci_unique"')
      ) {
        throw new AuthUserConflictError('email');
      }

      if (
        index === 'user_username_ci_unique' ||
        message.includes('"user_username_ci_unique"')
      ) {
        throw new AuthUserConflictError('username');
      }

      throw error;
    }
  }
}
