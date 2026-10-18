# P0 REST API Contract

Status: Frozen  
Scope: P0  
Owner: Tech Lead  
Depends on: `02-DOMAIN_MODEL.md`, `03-AUTH_CONTRACT.md`, `04-DATABASE_CONTRACT.md`

## Purpose

Defines the browser-facing P0 REST surface, canonical DTO conventions, status codes, and stable error codes.

## 1. Global Rules

Prefix:

```text
/api
```

JSON naming:

```text
camelCase
```

Identifiers:

```text
UUID strings
```

Dates:

```text
YYYY-MM-DD
```

Activity local time:

```text
HH:mm
```

Authentication is carried by the HttpOnly cookie; frontend does not manually attach JWT identity.

## 2. Success / Error Conventions

Use resource-specific response keys such as:

```json
{ "user": {} }
{ "trip": {} }
{ "activity": {} }
{ "proposal": {} }
```

Common error:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

Status semantics:

```text
200 OK            successful read/update/action
201 Created       resource created
204 No Content    successful action with no response body
400 Bad Request   malformed input or validation failure
401 Unauthorized  missing/invalid authentication
403 Forbidden     authenticated but insufficient permission
404 Not Found     resource absent in requested parent context
409 Conflict      current persisted state conflicts with request
500               unexpected server failure
```

P0 uses `400`, not a custom `422`, for request validation.

## 3. Authentication

### POST /api/auth/register

Request:

```json
{
  "email": "alice@example.com",
  "username": "alice",
  "password": "example-password"
}
```

Success:

```text
201
```

Returns the new User.

Freeze-candidate choice: Register does **not** establish an authenticated session. Login remains explicit.

Conflicts:

```text
409 EMAIL_ALREADY_EXISTS
409 USERNAME_ALREADY_EXISTS
```

### POST /api/auth/login

Request:

```json
{
  "email": "alice@example.com",
  "password": "example-password"
}
```

Success `200` and sets auth cookie.

Invalid credentials:

```text
401 INVALID_CREDENTIALS
```

Do not reveal whether Email exists.

### POST /api/auth/logout

```text
204
```

Clears auth cookie.

### GET /api/auth/me

Protected. Returns current User.

## 4. Trips

```text
GET    /api/trips
POST   /api/trips
GET    /api/trips/:tripId
DELETE /api/trips/:tripId
```

No Trip PATCH/PUT in P0.

### GET /api/trips

Returns only Trips where current User has current Membership.

Each item includes `currentUserRole`.

### POST /api/trips

Request:

```json
{
  "title": "Barcelona",
  "destination": "Barcelona",
  "startDate": "2026-10-12",
  "endDate": "2026-10-15",
  "description": null
}
```

Backend atomically creates Trip, OWNER Membership, and all Days.

### DELETE /api/trips/:tripId

Owner only.

Success:

```text
204
```

## 5. Members

```text
GET  /api/trips/:tripId/members
POST /api/trips/:tripId/leave
```

Member list does not expose other Users' Email by default.

Leave:

- MEMBER only;
- Owner receives `409 OWNER_CANNOT_LEAVE`;
- success `204`;
- Leave transaction removes Membership and that User's Votes for the Trip.

## 6. Invitations

```text
GET  /api/invitations?status=PENDING
POST /api/trips/:tripId/invitations
POST /api/invitations/:invitationId/accept
POST /api/invitations/:invitationId/reject
```

Create Invitation is Owner only.

Request contains exactly one identifier:

```json
{ "username": "alice" }
```

or:

```json
{ "email": "alice@example.com" }
```

Both/neither is `400 VALIDATION_ERROR`.

Unknown registered target:

```text
404 INVITEE_NOT_FOUND
```

Duplicate Pending / already current Member:

```text
409
```

Accept creates Membership.

Reject creates no Membership.

## 7. ItineraryDays

```text
GET /api/trips/:tripId/days
```

No Day CRUD.

## 8. Activity DTO

Canonical Activity fields:

```text
id
tripId
itineraryDayId
proposalId | null
title
startTime
endTime | null
location | null
description | null
version
createdBy
updatedBy
createdAt
updatedAt
```

## 9. Activity Endpoints

```text
GET    /api/trips/:tripId/activities
POST   /api/trips/:tripId/activities
GET    /api/trips/:tripId/activities/:activityId
PATCH  /api/trips/:tripId/activities/:activityId
DELETE /api/trips/:tripId/activities/:activityId
```

### Create

Client may set:

```text
itineraryDayId
title
startTime
endTime?
location?
description?
```

Client may not set Proposal origin or audit/version fields.

### Update

Request requires:

```text
expectedVersion
```

plus at least one editable field.

Stale update:

```text
409 ACTIVITY_VERSION_CONFLICT
```

Response may include latest Activity in `details`.

### Delete

Freeze-candidate choice: DELETE does **not** require an `expectedVersion` request body.

Successful direct Activity delete returns `200`:

```json
{
  "deletedActivityId": "uuid",
  "reopenedProposalId": null
}
```

Proposal-sourced Activity delete returns:

```json
{
  "deletedActivityId": "uuid",
  "reopenedProposalId": "proposal-uuid"
}
```

and atomically performs `ACCEPTED→PENDING`.

## 10. Proposal DTO

Canonical status:

```text
PENDING
ACCEPTED
```

Canonical vote summary:

```text
agreeCount
rejectCount
pendingCount
participantCount
requiredAgreeCount
canAdopt
```

Recipient-specific:

```text
currentUserDecision = AGREE | REJECT | null
```

`pendingCount` is derived.

`canAdopt` is convenience only.

P0 has no Proposal `REJECTED` status. A REJECT Vote changes only the vote data/summary and does not close the Proposal.

## 11. Proposal Endpoints

```text
GET  /api/trips/:tripId/proposals
POST /api/trips/:tripId/proposals
GET  /api/trips/:tripId/proposals/:proposalId
```

Create request:

```json
{
  "title": "Visit Montserrat",
  "description": "Day trip outside Barcelona"
}
```

Initial status is server-controlled `PENDING`.

No Proposal Edit/Delete.

## 12. Vote Endpoint

```text
PUT /api/trips/:tripId/proposals/:proposalId/vote
```

Request:

```json
{ "decision": "AGREE" }
```

or:

```json
{ "decision": "REJECT" }
```

No Vote DELETE/retract endpoint.

For a `PENDING` Proposal, backend upserts the current User's Vote and returns the updated Proposal/vote summary.

A REJECT Vote does not create any Proposal status transition.

`ACCEPTED` Vote mutation:

```text
409 PROPOSAL_VOTING_CLOSED
```

## 13. Adoption Endpoint

```text
POST /api/trips/:tripId/proposals/:proposalId/adopt
```

Any current participant while the Proposal is `PENDING`.

Request:

```json
{
  "itineraryDayId": "uuid",
  "title": "Visit Montserrat",
  "startTime": "08:30",
  "endTime": "17:00",
  "location": "Montserrat",
  "description": "Adopted from proposal"
}
```

Client cannot set Proposal status, Proposal ID, Vote counts, Creator, or Activity version.

Backend recomputes current state inside the transaction.

Success:

```text
201
```

returns:

```json
{
  "proposal": {},
  "activity": {}
}
```

### Majority lost

If strict majority is no longer satisfied:

```text
409 PROPOSAL_MAJORITY_LOST
```

No Activity is created and Proposal remains `PENDING`.

### Already accepted / concurrent double submit

```text
409 PROPOSAL_ALREADY_ACCEPTED
```

No second Activity.

## 14. Cross-Trip Safety

For nested resources, backend verifies parent relationship.

A valid ID from another Trip is treated as not found in the requested parent context.

## 15. Canonical Error Codes

```text
INVALID_CREDENTIALS
AUTHENTICATION_REQUIRED

EMAIL_ALREADY_EXISTS
USERNAME_ALREADY_EXISTS

TRIP_NOT_FOUND
TRIP_OWNER_REQUIRED
MEMBERSHIP_REQUIRED
MEMBERSHIP_ALREADY_EXISTS
OWNER_CANNOT_LEAVE

INVITATION_NOT_FOUND
INVITEE_NOT_FOUND
INVITATION_ALREADY_PENDING
INVITATION_NOT_PENDING

ACTIVITY_NOT_FOUND
ACTIVITY_DAY_INVALID
ACTIVITY_VERSION_CONFLICT

PROPOSAL_NOT_FOUND
PROPOSAL_VOTING_CLOSED
PROPOSAL_MAJORITY_LOST
PROPOSAL_ALREADY_ACCEPTED

VALIDATION_ERROR
MALFORMED_REQUEST
INTERNAL_ERROR
```

## 16. Realtime Relationship

REST owns writes.

Required invariant:

```text
DB commit happens before any success realtime event
```

The implementation does not need to guarantee whether the HTTP response reaches the client before or after the already-post-commit event.

## 17. Explicit REST Non-Goals

No endpoints for:

```text
Trip Edit
manual Day CRUD
Unscheduled Pool
Activity locks/participants
Proposal Edit/Delete
automatic Proposal rejection
Proposal REJECTED status/lifecycle
Rejected archive
Revise & Fork
Vote retract
Proposal Deadline/options
automatic Proposal→Activity conversion
Owner Transfer
Invite link/code
Chat
Notifications
Files
Budget
Maps
PWA/offline
```
