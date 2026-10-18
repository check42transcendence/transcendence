# P0 Domain Model

Status: Frozen  
Scope: P0  
Owner: Tech Lead  
Depends on: `00-DOMAIN_VOCABULARY.md`, `01-ARCHITECTURE.md`

## Purpose

This document defines P0 domain objects, relationships, lifecycle rules, and business invariants. SQL syntax, REST payload details, and Socket.IO payload details belong to later contracts.

## 1. Core Domain Objects

```text
User
Trip
TripMembership
Invitation
ItineraryDay
Activity
Proposal
Vote
```

Owner/Member are Membership roles, not standalone entities.

## 2. Trip

Creation requires:

```text
Title
Destination
Start Date
End Date
```

Description is optional.

Invariant:

```text
endDate >= startDate
```

After creation, P0 does not edit Trip base fields.

Creator receives the initial `OWNER` Membership.

Owner authority always comes from current Membership role, not `created_by`.

Owner may delete Trip and may not Leave.

## 3. TripMembership

Roles:

```text
OWNER
MEMBER
```

Invariants:

- one current Membership per `(Trip, User)`;
- exactly one current Owner per Trip;
- Owner cannot Leave;
- Member may Leave;
- Leave immediately removes Workspace access;
- historical Activity/Proposal contributions remain;
- the leaving Member’s Vote rows for that Trip are physically deleted so old Votes cannot reactivate after rejoin.

## 4. Invitation

Status:

```text
PENDING
ACCEPTED
REJECTED
```

Rules:

- Owner only creates Invitation;
- target must already be registered;
- one effective Pending Invitation per `(Trip, Invitee)`;
- Pending grants no Workspace access;
- Accept creates `MEMBER` Membership;
- Reject creates no Membership;
- Reject allows future re-invitation.

## 5. ItineraryDay

`ItineraryDay` is a persisted first-class P0 entity.

Trip creation generates every date from Start Date through End Date, inclusive.

P0 has no Day CRUD and no Trip date mutation.

## 6. Activity

Every Activity:

- belongs to one Trip;
- belongs to one valid ItineraryDay of the same Trip;
- has required Title and Start Time;
- may have End Time, Location, Description;
- cannot cross midnight;
- satisfies `endTime >= startTime` when End Time exists;
- may overlap another Activity;
- is sorted by Start Time;
- records Creator, Last Editor, Created At, Last Edited At.

All current Owner/Member participants may CRUD Activities.

P0 has no:

```text
isLocked
participants
unscheduled state
custom drag order
```

### Concurrent update rule

A stale Activity update must never silently overwrite a newer committed update.

Exact OCC mechanics belong to 04/05.

## 7. Proposal

Fields conceptually include:

```text
Title
Description?
Creator
Created At
Status
```

Status:

```text
PENDING
ACCEPTED
```

Initial status:

```text
PENDING
```

`PENDING` is the only open Proposal lifecycle state in P0.

A `REJECT` Vote does not change Proposal status. P0 has no automatic rejection threshold and no persisted Proposal `REJECTED` state.

A Proposal remains `PENDING` until successful manual Adoption changes it to `ACCEPTED`.

## 8. Vote

Persisted decision:

```text
AGREE
REJECT
```

No row means not voted.

One current Vote per `(Proposal, User)`.

A participant may change:

```text
AGREE ↔ REJECT
```

while the Proposal is `PENDING`.

P0 defines no retract-to-no-vote action.

`ACCEPTED` Proposals do not accept Vote changes.

REJECT Votes remain part of the vote summary but do not close a Proposal.

## 9. Strict Majority

Let:

```text
N = current Trip participant count
A = current AGREE count
```

Adoption eligibility:

```text
A > N / 2
```

Equivalent:

```text
A >= floor(N / 2) + 1
```

Owner and non-voters count in `N`.

Former participants do not.

A change in Membership may change the current Adoption eligibility because it changes `N`, but it does not itself change Proposal status.

## 10. Adoption

Any current participant may request Adoption from a `PENDING` Proposal.

Backend must, at submit time:

1. verify current Membership;
2. verify Proposal belongs to Trip;
3. verify Proposal is `PENDING`;
4. recompute current participant count;
5. recompute current AGREE count;
6. require Strict Majority;
7. validate Activity scheduling;
8. create exactly one Proposal-sourced Activity;
9. set status to `ACCEPTED`;
10. commit before realtime broadcast.

Frontend `canAdopt` is convenience state only and never replaces submit-time validation.

### Lost-majority race

If majority disappears before submit:

```text
no Activity
status remains PENDING
business conflict returned
```

### Concurrent Adoption

At most one current Activity may originate from one Proposal.

Persistence must prevent duplicate successful Adoption.

## 11. Proposal-Sourced Activity Deletion

If an Activity has a Proposal origin:

```text
delete Activity
+ ACCEPTED → PENDING
```

in one atomic transaction.

Proposal and existing Vote rows remain.

Future Adoption recalculates current majority.

## 12. Important Lifecycles

```text
Create Trip
→ Trip
→ OWNER Membership
→ all ItineraryDays

Accept Invitation
→ Invitation PENDING → ACCEPTED
→ MEMBER Membership

Reject Invitation
→ Invitation PENDING → REJECTED
→ no Membership

Member Leave
→ delete Member Votes in Trip
→ delete Membership
→ access ends
→ historical Activity/Proposal remain

Create Proposal
→ Proposal PENDING

Proposal PENDING + strict majority + manual Adopt
→ Activity
→ Proposal ACCEPTED

Delete Proposal-sourced Activity
→ Proposal ACCEPTED → PENDING

Delete Trip
→ delete complete Trip Workspace
```

## 13. Explicit P0 Domain Non-Goals

```text
Trip Edit
Owner Transfer
Unscheduled Activity Pool
Activity Lock
Activity participants
Proposal Edit/Delete
Proposal Deadline/options
automatic Proposal rejection
Proposal REJECTED status/lifecycle
Rejected archive
Revise & Fork
Vote retract
automatic Proposal→Activity conversion
full audit history
```
