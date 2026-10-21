import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plain text password using bcrypt.
 * @param password The plain text password.
 * @returns The generated hash string.
 */
export async function hash(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plain text password against a stored hash.
 * @param password The plain text password.
 * @param hashString The hashed password stored in the database.
 * @returns True if passwords match, false otherwise.
 */
export async function verify(
  password: string,
  hashString: string,
): Promise<boolean> {
  return bcrypt.compare(password, hashString);
}
