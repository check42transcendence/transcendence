# P0 Architecture Contract

Status: Frozen  
Scope: P0  
Owner: Tech Lead  
Depends on: `00-DOMAIN_VOCABULARY.md`

## Purpose

This document defines system structure and responsibility boundaries. Detailed business lifecycle rules belong to `02-DOMAIN_MODEL.md`.

## 1. Technology Baseline

```text
Frontend: React + TypeScript + Vite
Backend: NestJS + TypeScript
Database: PostgreSQL
ORM: Prisma
Realtime: Socket.IO inside NestJS
Containers: Docker + Docker Compose
Gateway: Nginx
Package manager: npm
Node.js: root .nvmrc
```

## 2. High-Level Architecture

```text
Browser
  ↓
React Frontend
  ↓ REST / Socket.IO
NestJS Backend
  ↓ Prisma
PostgreSQL
```

Backend/database state is authoritative.

## 3. Frontend Responsibilities

Frontend:

- renders UI;
- collects user input;
- calls REST APIs;
- receives realtime notifications;
- displays loading/success/error/conflict states;
- displays server-provided recent-editor data;
- uses a shared translation-key mechanism.

Frontend is not a security boundary and must not decide authoritative domain state.

## 4. Backend Responsibilities

Backend owns:

- authentication;
- authorization;
- Membership/role checks;
- domain/business-rule validation;
- Proposal/Vote/Adoption logic;
- Activity concurrency handling;
- transaction orchestration;
- persistence;
- realtime emission after commit.

## 5. Database Responsibilities

PostgreSQL stores authoritative P0 state and enforces reviewed persistence invariants where practical.

Prisma is the application ORM. Required PostgreSQL-specific constraints may use reviewed migration SQL.

## 6. Domain State Ownership

Proposal, Vote, Membership, Invitation, Activity, and Adoption lifecycle rules belong to the backend domain layer.

Frontend may display current state but may not directly set server-controlled lifecycle fields.

Detailed lifecycle rules are defined in `02-DOMAIN_MODEL.md`.

## 7. REST Boundary

REST is the P0 command/query interface.

All REST endpoints use:

```text
/api
```

REST owns domain writes. Socket.IO is not a second write API.

## 8. Realtime Boundary

Shared mutation flow:

```text
REST request
→ authenticate / authorize
→ validate business rules
→ database transaction
→ COMMIT
→ realtime notification
```

Only committed changes are broadcast.

## 9. Runtime Services

Canonical Compose services:

```text
frontend
backend
postgres
```

P0 adds no Redis, queue, microservice, or separate realtime service.

## 10. Ports / Browser Paths

```text
Vite development: 5173
NestJS: 3000
PostgreSQL internal: 5432
Container browser entry: 8080 by default
REST: /api
Socket.IO: /socket.io
```

The Vite `/api → 127.0.0.1:3000` proxy is a development-only path.

Container traffic uses Nginx and Compose service DNS.

## 11. i18n Boundary

P0 is i18n-ready through translation keys.

Complete EN/FR/ZH coverage and language switching remain outside P0 unless separately promoted.
