# P0 Realtime Contract

Status: Frozen  
Scope: P0  
Owner: Tech Lead  
Depends on: `03-AUTH_CONTRACT.md`, `05-REST_API_CONTRACT.md`, `07-SHARED_TYPES.md`

## Purpose

Defines P0 live synchronization after committed REST/domain mutations.

## 1. Source of Truth

Database/backend state is authoritative.

Socket.IO is a notification/synchronization layer, not a second write API.

Required invariant:

```text
no success event before DB COMMIT
```

Rollback emits no success event.

## 2. Socket.IO Path

Browser-facing path:

```text
/socket.io
```

Socket.IO runs inside NestJS.

Nginx must proxy this path with WebSocket upgrade support.

## 3. Authentication

Socket handshake uses the same HttpOnly-cookie identity as REST.

Client-supplied User ID is not proof of identity.

Invalid/missing auth rejects the connection.

## 4. Trip Rooms

Canonical room:

```text
trip:<tripId>
```

Only current OWNER/MEMBER may subscribe.

Pending Invitation is insufficient.

### trip:subscribe

Client:

```json
{ "tripId": "uuid" }
```

Server checks current Membership before joining.

### trip:unsubscribe

Removes only realtime subscription, not Membership.

## 5. Server-to-Client Events

```text
activity:created
activity:updated
activity:deleted

proposal:created
proposal:vote-updated
proposal:rejected
proposal:adopted
proposal:reopened
```

No domain writes use Socket.IO.

## 6. Common Envelope

```ts
{
  tripId: UUID
  occurredAt: ISODateTime
  data: ...
}
```

JSON uses camelCase.

## 7. Activity Events

### activity:created

Carries complete canonical Activity DTO.

### activity:updated

Carries complete latest Activity DTO including:

```text
version
updatedBy
updatedAt
```

Client may ignore an Activity event whose version is not newer than local canonical state.

Unsaved form input is not silently overwritten.

### activity:deleted

Carries:

```text
activityId
reopenedProposalId | null
```

If Proposal-sourced Activity deletion reopens a Proposal, `proposal:reopened` is also emitted after the same commit.

## 8. Proposal Events

### proposal:created

Carries `SharedProposal`.

Room broadcast excludes recipient-specific `currentUserDecision`.

### proposal:vote-updated

For a Vote change that leaves Proposal `PENDING`, broadcasts absolute shared vote summary.

No `+1/-1` delta logic.

### proposal:rejected

Emitted after committed:

```text
PENDING → REJECTED
```

caused by:

```text
rejectCount >= ceil(participantCount / 2)
```

Carries the latest `SharedProposal` with status `REJECTED`.

This event communicates the committed state change.

In P0, `REJECTED` is terminal: clients must disable further Vote mutation and Adoption actions for that Proposal.

When a Vote mutation itself causes rejection, emitting `proposal:rejected` is sufficient; a redundant `proposal:vote-updated` for the same state transition is not required.

### proposal:adopted

Emitted after successful committed Adoption.

Carries latest shared Proposal state (`ACCEPTED`) and created Activity.

Failed Adoption emits no `proposal:adopted`.

### proposal:reopened

Emitted after deleting the Proposal-sourced Activity and committing:

```text
ACCEPTED → PENDING
```

Carries latest shared Proposal state.

## 9. Broadcast Audience

Events go to currently authorized sockets in the Trip room, including possibly the mutating User's socket.

Clients must handle duplicates idempotently.

Use explicit state values, never “toggle” operations.

## 10. Membership Changes

After Member Leave succeeds, that User's active sockets must be removed from the Trip room.

After Trip deletion, the room must stop protected Workspace delivery.

P0 does not require a realtime Member-list feature.

## 11. Reconnection / Resync

P0 has no durable event replay.

Reconnect flow:

```text
reconnect
→ authenticate
→ resubscribe
→ refetch authoritative REST state
→ resume realtime
```

Relevant state includes Trip, visible Members, Days, Activities, Proposals/Vote summaries.

Frontend must avoid an older REST snapshot overwriting a newer event; buffering during resync or a consistent refetch/version strategy is acceptable.

## 12. Delivery Semantics

P0 guarantees:

```text
broadcast only after successful commit
```

P0 does not guarantee:

```text
exactly-once delivery
durable delivery
offline replay
cross-connection ordering
```

## 13. Payload Privacy

Do not broadcast:

```text
password/hash
JWT/cookie
other Users' Email by default
another User's currentUserDecision
raw DB errors
```

## 14. Required Realtime Tests

At minimum:

1. unauthenticated socket rejected;
2. non-member cannot subscribe;
3. Owner/Member can subscribe;
4. Pending Invitation cannot subscribe;
5. Activity create/update/delete events occur only after commit;
6. Activity update contains new version/editor data;
7. stale Activity REST update emits no success event;
8. Proposal create event;
9. PENDING Vote change updates summary;
10. threshold crossing emits `proposal:rejected`;
11. successful Adoption emits `proposal:adopted`;
12. failed/lost-majority Adoption emits no adopted event;
13. double Adoption produces one success;
14. Proposal-sourced Activity delete emits delete + reopen state;
15. Leave stops protected Trip delivery;
16. reconnect requires resubscription + REST resync.

Tests must verify that `REJECTED` is terminal in P0: no further Vote mutation or Adoption succeeds.

## 15. Explicit Realtime Non-Goals

```text
Chat
Notification Center
presence
typing
cursor sharing
durable event history/replay
Activity edit locks
PWA offline mutation sync
```
