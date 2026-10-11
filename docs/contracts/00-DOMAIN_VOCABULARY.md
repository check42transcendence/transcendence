# P0 Domain Vocabulary

Status: Frozen  
Scope: P0  
Owner: Tech Lead  
Product baseline: Frozen P0 Scope / Business Rules — updated 2026-10-11

## Purpose

This document defines the canonical P0 business vocabulary. Later contracts may add technical detail, but must not change these meanings.

## 1. User

A registered account with unique Email and Username.

- Email: authentication identity and exact Invitation lookup; not public by default.
- Username: normal visible identity and exact Invitation lookup.

## 2. Trip

A shared travel-planning Workspace.

P0 Trip base information is immutable after creation:

```text
Title
Destination
Start Date
End Date
Description
```

Owner may delete the Trip.

## 3. Creator vs Owner

`Trip Creator` is the User who historically created the Trip.

`Owner` is the current participant whose:

```text
TripMembership.role == OWNER
```

Creator identity is not an authorization source.

P0 has exactly one current Owner and no Owner Transfer.

## 4. TripMembership

The current User-to-Trip relationship.

Roles:

```text
OWNER
MEMBER
```

A Pending Invitation is not Membership.

## 5. Current Trip Participant

A User with a current TripMembership (`OWNER` or `MEMBER`).

Current Trip Participants form the denominator for Proposal voting rules.

## 6. Invitation

An Owner-created request to an already registered User.

Status:

```text
PENDING
ACCEPTED
REJECTED
```

Accept creates `MEMBER` Membership. Reject creates no Membership. Re-invitation after Reject is allowed.

## 7. ItineraryDay

A persisted calendar date inside the immutable Trip date range.

All Days are generated during Trip creation.

P0 has no manual Day CRUD and no Unscheduled Activity Pool.

## 8. Activity

A scheduled item bound to exactly one valid ItineraryDay of its Trip.

P0 Activity:

- has required Title and Start Time;
- may have End Time, Location, Description;
- records Creator and Last Editor;
- does not cross midnight;
- has no lock/confirmed state;
- has no participant list;
- has no custom drag order.

An Activity may be created directly or through Proposal Adoption.

## 9. Proposal

An optional suggestion used for group decision-making.

Persisted status:

```text
PENDING
ACCEPTED
REJECTED
```

Meaning:

```text
PENDING
→ normal voting state; may be manually Adopted when Strict Majority is satisfied.

ACCEPTED
→ a successful manual Adoption has created one current Proposal-sourced Activity.

REJECTED
→ the automatic rejection threshold was reached; this is terminal in P0.
```

Proposal status is server-controlled.

### Automatic rejection threshold

Let:

```text
N = number of Current Trip Participants
R = number of current REJECT Votes from those participants
```

For a `PENDING` Proposal:

```text
R >= ceil(N / 2)
→ status becomes REJECTED automatically
```

Examples:

```text
N=4 → 2 REJECT triggers
N=5 → 3 REJECT triggers
N=6 → 3 REJECT triggers
```

This threshold is mathematically the point at which a strict AGREE majority is impossible.

### REJECTED behaviour in P0

`REJECTED` is terminal for P0.

After a Proposal becomes `REJECTED`:

```text
no further Vote creation/change
no manual Adoption
no REJECTED → PENDING transition
no REJECTED → ACCEPTED transition
no automatic reopening after later Membership changes
```

Rejected archive, Revise & Fork, and other post-rejection workflows remain outside P0.

## 10. Vote

One current explicit decision by one Current Trip Participant on one Proposal.

Persisted values:

```text
AGREE
REJECT
```

No Vote row means “not voted”.

UI may display that logical state as:

```text
PENDING
```

but `PENDING` is not a persisted VoteDecision.

One User has at most one current Vote per Proposal.

P0 does not define Vote retraction back to no Vote.

## 11. Strict Majority

Let:

```text
N = Current Trip Participant count
A = current AGREE Vote count
```

Manual Adoption eligibility:

```text
A > N / 2
```

Equivalent:

```text
requiredAgreeCount = floor(N / 2) + 1
```

Owner and non-voters are included in `N`.

## 12. Vote Statistics

Derived counts may include:

```text
agreeCount
rejectCount
pendingCount
participantCount
requiredAgreeCount
```

with:

```text
pendingCount = participantCount - agreeCount - rejectCount
```

Percentages are presentation values, not persisted state.

## 13. Adoption

Adoption is a manual action by any Current Trip Participant.

For the currently defined normal flow:

```text
PENDING
+ current Strict Majority at submit time
→ create Proposal-sourced Activity
→ ACCEPTED
```

Adoption is not automatic.

At most one current Activity may originate from one Proposal.

## 14. Delete Proposal-Sourced Activity

Deleting the current Activity created through an accepted Proposal performs atomically:

```text
delete Activity
ACCEPTED → PENDING
```

Proposal and existing Votes remain.

Future Adoption must recompute current majority.

## 15. Realtime Update

A notification about already-committed shared state.

Realtime is not the authoritative persisted state.

## Canonical technical values

```text
MembershipRole: OWNER | MEMBER
InvitationStatus: PENDING | ACCEPTED | REJECTED
VoteDecision: AGREE | REJECT
ProposalStatus: PENDING | ACCEPTED | REJECTED
```

## Explicit P0 exclusions

P0 excludes:

```text
Trip Chat
Notification Center
Friends
Budget
Files
Maps
PWA/offline mutations
Activity Locking
Unscheduled Activity Pool
Activity participants
Owner Transfer
Proposal Edit/Delete
Proposal Deadline/options
Rejected-Proposal archive
Revise & Fork
Vote retract
full audit history
```
