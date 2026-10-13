*This project has been created as part of the 42 curriculum by yihe, weiyang, yuczhang, yzhang2, and zhma.*

# Travel Planner

## Description

A collaborative travel planning platform for small groups who have
already decided to travel together.

The planned core features include trip workspaces, shared itineraries,
proposals, voting, and real-time collaboration.

## Current Status

Currently implemented:

- React/TypeScript frontend with Vite and a backend connectivity check.
- NestJS backend with a `GET /api/health` endpoint.
- Auth API flows for register, login, me, and logout using temporary mocks.
- PostgreSQL with persistent storage and Prisma database integration.
- Docker Compose stack with service health checks and a non-root backend.
- Nginx gateway with local HTTPS and HTTP-to-HTTPS redirection.
- GitHub Actions checks for the frontend, backend, Prisma, and container stack.

Auth currently uses in-memory users and mock password/session services.
Real user persistence, password hashing, JWT cookies, and authenticated
sessions are pending integration.

Domain database models and migrations, travel features, and real-time
collaboration are not implemented yet.

HTTPS currently uses a local self-signed certificate. Public deployment
and publicly trusted certificates are not configured yet.

## Project Structure

- `frontend/`: React application, frontend Dockerfile, and Nginx configuration.
- `backend/`: NestJS application, Prisma configuration and schema, and
  backend Dockerfile.
- `compose.yml`: frontend, backend, and PostgreSQL services.
- `scripts/generate-local-cert.sh`: local TLS certificate generation.
- `.env.example`: example local environment configuration.
- `.nvmrc`: Node.js version used for development.
- `.github/workflows/ci.yml`: automated project checks.

## Containerized Application

### Prerequisites

- Git.
- Docker with Docker Compose support.
- OpenSSL supporting `req -addext` (for example, OpenSSL 3).

Create the local environment file:

```bash
cp .env.example .env
```

Replace the example PostgreSQL password in `.env` with a local
development password. The `.env` file is ignored by Git and must not
be committed.

Generate your local certificate once from the repository root:

```bash
sh scripts/generate-local-cert.sh
```

The certificate and private key are stored in `certs/`, ignored by Git,
and mounted read-only into Nginx. The script refuses to overwrite existing
files. If your Mac's OpenSSL does not support `-addext`, run the script in
your Linux development container with the repository mounted.

Build and start the complete application:

```bash
docker compose up --build
```

Open:

```text
https://localhost:8443
```

The backend health endpoint is available through the Nginx gateway at:

```text
https://localhost:8443/api/health
```

HTTP on port 8080 redirects to HTTPS on port 8443. The HTTPS port and
redirect destination are currently fixed for local use.

For browser access, trust your own `certs/localhost.crt` for SSL in your
local certificate store. On macOS, import it into the **login** keychain
using Keychain Access, then set its **Secure Sockets Layer (SSL)** trust
to **Always Trust**. Restart the browser. Each developer generates and
trusts their own certificate; only the `.crt` file is imported.

To run the application in the background:

```bash
docker compose up --build --detach
```

View service status:

```bash
docker compose ps
```

Follow logs:

```bash
docker compose logs --follow
```

Stop and remove the application containers and network:

```bash
docker compose down
```

The PostgreSQL named volume is preserved by `docker compose down`.

To intentionally remove the local database data as well:

```bash
docker compose down --volumes
```

This last command permanently deletes the local PostgreSQL data.

## Local Development

### Prerequisites

- Git.
- Node.js matching `.nvmrc`, with npm.
- Optionally, nvm to install and select the Node.js version.

From the repository root, if using nvm:

```bash
nvm install
nvm use
```

The complete backend requires a reachable PostgreSQL database and a
`DATABASE_URL`. Use the containerized application workflow above to run
the integrated frontend, backend, and database stack.

To run the backend outside Compose, provide a `DATABASE_URL` for a
PostgreSQL instance reachable from the current environment:

```bash
cd backend
npm ci
export DATABASE_URL='postgresql://USER:PASSWORD@HOST:5432/DATABASE'
npm run prisma:generate
npm run start:dev
```

Replace the URL placeholders with your database settings. Compose's
PostgreSQL service is not published to the host, so this workflow requires
a separately reachable database.

Prisma Client is generated locally and ignored by Git. Re-run
`npm run prisma:generate` from `backend/` after changing or pulling schema
changes.

Start the frontend in another terminal:

```bash
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` and click **Check backend**.

The local backend health endpoint is available at:

```text
http://localhost:3000/api/health
```

The Vite development proxy targets `127.0.0.1:3000`. The frontend
development server and backend must therefore run on the same host
or inside the same development container.

## Validation

Frontend:

```bash
cd frontend
npm run lint
npm run build
```

Backend:

```bash
cd backend
export DATABASE_URL='postgresql://transcendence:validation_only@localhost:5432/transcendence'
npm run prisma:validate
npm run prisma:generate
npm run lint
npm run build
npm test
npm run test:e2e
```

Containerized stack:

Generate the local certificate first using the setup instructions above.

```bash
docker compose config --quiet
docker compose up --build --detach --wait
docker compose exec -T frontend nginx -t
curl -I http://localhost:8080/api/health
curl --cacert certs/localhost.crt --fail https://localhost:8443/api/health
docker compose down
```

Expect HTTP `308` with an HTTPS redirect, followed by HTTPS `200` and
`{"status":"ok"}`. `--cacert` verifies the locally generated certificate.

## Continuous Integration

GitHub Actions runs the following jobs for pull requests targeting
`main` and for pushes to `main`:

- `Frontend checks`: dependency installation, lint, and production build.
- `Backend checks`: dependency installation, Prisma schema validation,
  Prisma Client generation, lint, build, unit tests, and end-to-end tests.
- `Container checks`: temporary certificate generation, Compose validation,
  image builds, health checks, HTTP redirection, and HTTPS page/API checks.

## Resources

- React: https://react.dev/
- Vite: https://vite.dev/
- NestJS: https://docs.nestjs.com/
- Docker Compose: https://docs.docker.com/compose/
- PostgreSQL: https://www.postgresql.org/docs/
- Nginx: https://nginx.org/en/docs/
- Prisma ORM: https://www.prisma.io/docs/orm/

AI assistance was used to help draft the initial product proposal,
guide development environment setup, troubleshoot installation issues,
and explain and provide starter infrastructure configuration.
