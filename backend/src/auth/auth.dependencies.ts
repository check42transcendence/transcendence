// Contracts for user storage and password handling.
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
  abstract create(input: CreateAuthUserInput): Promise<AuthUserRecord>;

  abstract findByEmail(email: string): Promise<AuthUserRecord | null>;

  abstract findById(id: string): Promise<AuthUserRecord | null>;
}

export abstract class AuthPasswordService {
  abstract hash(password: string): Promise<string>;

  abstract verify(password: string, passwordHash: string): Promise<boolean>;
}
