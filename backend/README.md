# Backend

NestJS and TypeScript API for Travel Planner, using PostgreSQL and Prisma.
For Docker, HTTPS, and environment setup, see the [project README](../README.md).

## Structure

- `src/main.ts`: starts the server, enables cookie parsing, and sets the `/api` prefix.
- `src/auth/`: registration, login, JWT cookies, and authentication guards.
- `src/users/`: user persistence and database conflict handling.
- `src/database/`: shared Prisma connection.
- `prisma/`: database schema and committed migrations.
- `test/`: end-to-end and database integration tests.

Request flow: Controller → Service → Repository → PostgreSQL.
Modules connect these components through dependency injection.

## Auth endpoints

| Method | Path | Behavior |
| --- | --- | --- |
| POST | `/api/auth/register` | Creates a user; returns 201 without logging in. |
| POST | `/api/auth/login` | Verifies credentials, sets a JWT cookie, and returns 200. |
| GET | `/api/auth/me` | Returns the current user; requires a valid JWT cookie. |
| POST | `/api/auth/logout` | Clears the cookie and returns 204. |
| GET | `/api/health` | Returns `{ "status": "ok" }`. |

Registration accepts `email`, `username`, and `password`; login accepts
`email` and `password`. User responses contain only `id`, `email`, and `username`.

Passwords use bcrypt. The `token` cookie is Secure, HttpOnly, and SameSite=Lax,
with a seven-day lifetime. Use the HTTPS gateway for authentication testing.
Logout clears the browser cookie; it does not revoke an existing JWT.

## Development

Run these commands from `backend/`, using the Node.js version in `../.nvmrc`.
Set `DATABASE_URL` to a reachable PostgreSQL database and provide `JWT_SECRET`
in the backend process environment. Keep the secret private and stable.
Compose supplies these variables when running the container stack.

```bash
npm ci
npm run prisma:generate
npm run prisma:migrate:deploy
npm run start:dev
```

After pulling schema changes, regenerate Prisma Client. Apply any new committed
migrations before using the updated backend. Generated files in
`src/generated/` are ignored by Git.

## Checks

With `DATABASE_URL` and `JWT_SECRET` set:

```bash
npm run format
npm run lint
npm run build
npm test
```

Auth tests use mock user storage and password handling. The application uses
PostgreSQL and bcrypt.

`npm run test:e2e` also requires a reachable database with migrations applied.
Use a dedicated test database.

For database integration tests, set `TEST_DATABASE_URL` to a dedicated database
whose name ends with `_test`, then run:

```bash
npm run test:db:prepare
npm run test:db
```

Database integration tests may clear test data. See the
[project README](../README.md#validation) for environment and validation details.
