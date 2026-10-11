# P0 Authentication & Authorization Contract

Status: Frozen  
Scope: P0  
Owner: Tech Lead  
Depends on: `00-DOMAIN_VOCABULARY.md`, `02-DOMAIN_MODEL.md`

## 1. Authentication

Register uses:

```text
Email + Username + Password
```

Login uses:

```text
Email + Password
```

Password plaintext is never persisted.

P0 stores a strong password hash (Argon2id recommended).

Authenticated identity is carried by a backend-issued JWT in an HttpOnly cookie.

JWT proves identity only. It does not contain authoritative Trip role state.

Recommended cookie baseline:

```text
HttpOnly
SameSite=Lax
Secure in HTTPS environments
```

## 2. Registration Session Behaviour

Freeze-candidate technical choice:

```text
Register creates the User but does not implicitly establish a login session.
```

The client uses the explicit Login endpoint to authenticate.

This avoids an undocumented side effect between Register and Login.

## 3. Trip Access

Workspace access requires a current TripMembership:

```text
OWNER
or
MEMBER
```

Pending Invitation is insufficient.

`trip.created_by` is never an authorization source.

## 4. Owner-Only Operations

Owner is determined only by:

```text
TripMembership.role == OWNER
```

Owner-only P0 operations:

```text
Invite User
Delete Trip
```

Owner cannot Leave.

## 5. Current Participant Operations

Both OWNER and MEMBER may:

- view Trip Workspace;
- view Members/Days/Activities/Proposals;
- CRUD Activities;
- create Proposal;
- use the normal PENDING Vote flow;
- request manual Adoption when the domain rules permit.

## 6. Invitation Authorization

Only Owner creates Invitations.

Only target User may Accept/Reject their Invitation.

## 7. Activity Authorization

Backend verifies:

- authenticated User;
- current TripMembership;
- Activity belongs to URL Trip;
- referenced Day belongs to same Trip;
- OCC requirements for update.

Creator does not receive exclusive Activity rights.

Recent-editor identity comes from backend identity, never client payload.

## 8. Proposal / Vote Authorization

Current participants may create Proposals.

Users may mutate only their own Vote.

For `PENDING`, normal Vote behaviour is defined by the Domain Contract.

For `ACCEPTED`, Vote mutation is not allowed.

For `REJECTED`, Vote mutation is not allowed in P0.

## 9. Adoption Authorization

Any current participant may request Adoption in the normal `PENDING` flow.

Backend verifies Membership, Trip relationship, current state, majority, scheduling input, and duplicate prevention.

For `REJECTED`, Adoption is not allowed in P0.

## 10. Server-Controlled Proposal Status

Clients do not directly set Proposal status.

Defined server transitions:

```text
Create Proposal → PENDING
PENDING + reject threshold → REJECTED
PENDING + successful manual Adoption → ACCEPTED
Delete Proposal-sourced Activity → ACCEPTED → PENDING
```

## 11. HTTP Auth Error Semantics

```text
401
→ missing/invalid authentication

403
→ authenticated but insufficient permission
```

Business conflicts are not auth failures.

## 12. Socket.IO Authentication

Socket.IO uses the same backend-authenticated identity.

Trip-room subscription requires current Membership.

When Membership ends, protected realtime delivery must stop.

## 13. Frontend Security Rules

Frontend must not:

- read the HttpOnly token;
- use localStorage/sessionStorage as auth authority;
- trust client-supplied role;
- use Creator as Owner authorization;
- send User ID as proof of identity.
