// Identifies which unique user field caused a storage conflict.
export class AuthUserConflictError extends Error {
  constructor(public readonly field: 'email' | 'username') {
    super(`${field} already exists`);
    this.name = 'AuthUserConflictError';
  }
}
