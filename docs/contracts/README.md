# P0 Shared Technical Contracts

Status: Frozen  
Scope: P0  
Owner: Tech Lead  
Product baseline: Frozen P0 Scope / Business Rules — updated 2026-10-11

## Purpose

This directory contains the shared technical contracts for P0.

These contracts define the technical rules that multiple team members must follow when developing independent Vertical Slices.

They are based on the frozen P0 Scope and P0 Business Rules.

All contracts in this directory are now frozen for P0. Any future change must follow the Contract Change Rule defined in `08-ENVIRONMENT_AND_WORKFLOW.md`.

## Contract documents

0. `00-DOMAIN_VOCABULARY.md`
   - Canonical P0 terminology
   - Shared meanings for User, Trip, Membership, Activity, Proposal, Vote, and Adoption

1. `01-ARCHITECTURE.md`
   - Overall system structure
   - Technology stack
   - Frontend / backend / database responsibilities
   - Main communication paths
   - P0 i18n-ready frontend boundary

2. `02-DOMAIN_MODEL.md`
   - Core P0 domain objects
   - Entity meanings
   - Relationships and lifecycle rules
   - Membership roles
   - Proposal voting, rejection, adoption, and reopening rules

3. `03-AUTH_CONTRACT.md`
   - Authentication approach
   - Authorization rules
   - OWNER / MEMBER access boundaries
   - Proposal voting and adoption authorization

4. `04-DATABASE_CONTRACT.md`
   - Database conventions
   - Primary keys and foreign keys
   - Unique constraints
   - Deletion rules
   - Prisma migration rules
   - Concurrent update, voting, rejection, and adoption atomicity requirements

5. `05-REST_API_CONTRACT.md`
   - REST API naming conventions
   - Request / response conventions
   - HTTP status codes
   - Common error format
   - P0 shared API contracts

6. `06-REALTIME_CONTRACT.md`
   - Socket.IO connection rules
   - Trip room strategy
   - Event naming conventions
   - Reconnection and synchronization rules
   - Proposal voting, rejection, adoption, and reopening synchronization

7. `07-SHARED_TYPES.md`
   - Shared enums
   - Shared DTO conventions
   - Types used across REST and realtime contracts

8. `08-ENVIRONMENT_AND_WORKFLOW.md`
   - Node version
   - Docker services
   - Ports
   - Environment variables
   - CI baseline
   - Prisma migration workflow
   - i18n-ready frontend workflow
   - Contract change workflow

## Contract lifecycle

The P0 technical contracts have completed:

```text
Draft → Team Review → Frozen
```

Current state:

```text
Frozen
```

Feature implementations must follow these contracts.

Any proposed change to a frozen contract must be reviewed and agreed before implementation.

## Source of truth

For P0:

1. Frozen P0 Scope defines what P0 includes.
2. Frozen P0 Business Rules define how the product behaves.
3. `00-DOMAIN_VOCABULARY.md` defines the shared language.
4. `02-DOMAIN_MODEL.md` defines the core domain rules and lifecycles.
5. The remaining Technical Contracts define how the system supports those rules.
6. Feature implementations must follow the frozen technical contracts.

```text
P0 Scope / Business Rules
        ↓
Domain Vocabulary / Domain Model
        ↓
Technical Contracts
        ↓
ERD / Prisma / REST / Realtime implementation
```

## Development rule

Before opening a PR, check that the implementation does not conflict with any frozen contract.

If a conflict is found:

```text
do not silently change the implementation contract
→ raise the conflict
→ review the affected contract
→ agree the change
→ update the contract first
→ then implement
```
