export interface AuthUserRecord {
  id: string;
  email: string;
  username: string;
  passwordHash: string;
  createdAt: Date;
}

export interface CreateAuthUserInput {
  email: string;
  username: string;
  passwordHash: string;
}

export abstract class AuthUserRepository {
  abstract findByEmail(email: string): Promise<AuthUserRecord | null>;

  abstract create(input: CreateAuthUserInput): Promise<AuthUserRecord>;
}

export abstract class AuthPasswordService {
  abstract hash(password: string): Promise<string>;

  abstract verify(password: string, passwordHash: string): Promise<boolean>;
}

export class AuthUserConflictError extends Error {
  constructor(public readonly field: 'email' | 'username') {
    super(`${field} already exists`);
    this.name = 'AuthUserConflictError';
  }
}
