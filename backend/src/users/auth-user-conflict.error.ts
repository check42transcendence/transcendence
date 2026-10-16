export class AuthUserConflictError extends Error {
  constructor(public readonly field: 'email' | 'username') {
    super(`${field} already exists`);
    this.name = 'AuthUserConflictError';
  }
}