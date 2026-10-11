# P0 Domain Vocabulary

Status: Draft  
Scope: P0  
Owner: Tech Lead  
Depends on: Frozen P0 Scope and Frozen P0 Business Rules v2 (2026-10-09)

## Purpose

This document defines the canonical vocabulary used across P0 product documents, technical contracts, API design, database design, realtime events, and implementation.

---

## 1. User

A registered account with unique Email and Username.

---

## 2. Trip

A shared travel-planning workspace.

In P0, Trip base information is fixed after creation.

---

## 3. Trip Creator

The User who originally creates a Trip.

Creation is a historical fact.

When the Trip is created, the Creator receives the `OWNER` Membership Role.

Authorization must use current Membership Role, not historical Creator identity.

---

## 4. TripMembership

The current User-to-Trip relationship.

Every current Trip participant has one TripMembership with role:

```text
OWNER
MEMBER
```

A Pending Invitation is not Membership.

---

## 5. Owner

The current participant whose TripMembership role is `OWNER`.

P0 has exactly one Owner per Trip.

Only Owner may invite Users or delete the Trip.

Owner cannot Leave Trip.

P0 has no Owner Transfer.

---

## 6. Member

A current participant whose TripMembership role is `MEMBER`.

A User normally becomes a Member by accepting an Invitation.

---

## 7. Current Trip Participant

A User with a current TripMembership whose role is `OWNER` or `MEMBER`.

For Proposal majority calculations, all Current Trip Participants count in the denominator, including the Owner and users who have not voted.

---

## 8. Invitation

A request from the Owner to an already registered User.

Canonical technical states:

```text
PENDING
ACCEPTED
REJECTED
```

The UI may display `Decline`, but the technical rejected state is `REJECTED`.

---

## 9. My Trips

Trips where the authenticated User currently has a TripMembership.

Pending Invitations are shown separately.

---

## 10. ItineraryDay

One fixed calendar date inside the Trip Start Date–End Date range.

All Days are generated when the Trip is created.

P0 does not edit Trip dates, manually add/remove Days, or use an Unscheduled Activity Pool.

---

## 11. Activity

One scheduled item belonging to one valid ItineraryDay of its Trip.

An Activity may be created directly or created as the result of Proposal Adoption.

P0 Activity data includes Creator and recent-editor information.

P0 has no Activity Locking or Unscheduled state.

---

## 12. Activity Creator

The User who originally creates an Activity.

Creator status does not grant exclusive edit/delete permission.

---

## 13. Activity Last Editor

The User who most recently saves an Activity update.

The system also records the last-edited time.

This is not a full audit log.

---

## 14. Proposal

An optional suggestion used to collect opinions before a group decision.

A Proposal is not required before creating an Activity.

A Proposal contains a persisted status:

```text
PENDING
ACCEPTED
REJECTED
```

Canonical meaning:

```text
PENDING
→ Proposal is open for normal voting and may be manually Adopted when the current Strict Majority rule is satisfied.

ACCEPTED
→ Proposal has been successfully Adopted and has one current Proposal-sourced Activity.

REJECTED
→ Proposal has crossed the rejection threshold.

Whether Vote changes or manual Adoption remain available after `REJECTED` is not yet frozen.
```

`ProposalStatus` is a state field. It is not itself the Proposal-to-Activity relationship.

P0 defines an automatic rejection threshold for a `PENDING` Proposal.

Let:

```text
N = number of current Trip participants (OWNER + MEMBER)
R = number of current REJECT votes from those current participants
```

The Proposal is automatically rejected when:

```text
R >= ceil(N / 2)
```

At that moment:

```text
Proposal.status: PENDING → REJECTED
```

This is the Early Rejection / rejection kill-line.

It is intentionally asymmetric with Adoption:

```text
ACCEPTED requires AGREE > N / 2 and a manual Adopt action.
REJECTED triggers automatically once R >= ceil(N / 2).
```

For even `N`, exactly half REJECT is sufficient because a strict AGREE majority has become mathematically impossible.

Examples:

```text
N = 4 → reject threshold = 2
N = 5 → reject threshold = 3
N = 6 → reject threshold = 3
```

---

## 15. Vote

One current decision by one Current Trip Participant on one Proposal.

Canonical values:

```text
AGREE
REJECT
```

No Vote record means the User has not voted.

For UI/statistics purposes, this not-voted state may be displayed as:

```text
PENDING
```

`PENDING` is a derived logical/UI state only. It is **not** a third persisted `VoteDecision` value.

A User has at most one current Vote per Proposal.

`PENDING` Proposals accept Vote creation/change. `ACCEPTED` Proposals are closed to Vote changes by the existing Adoption rules.

Vote behaviour while `REJECTED` is not yet frozen.

---

## 16. Strict Majority

A Proposal is eligible for Adoption only when:

```text
AGREE votes > Current Trip Participant count / 2
```

Equivalent minimum:

```text
floor(currentParticipantCount / 2) + 1
```

The denominator includes the Owner and non-voters.

Vote statistics may expose:

```text
agreeCount
rejectCount
pendingCount
participantCount
```

where:

```text
pendingCount = participantCount - agreeCount - rejectCount
```

Rates/percentages are derived presentation values and are not persisted voting states.

For a `PENDING` Proposal, reaching the rejection threshold automatically changes status to `REJECTED` and closes further Vote changes and Adoption.

P0 still does not add a rejected-Proposal archive view or Revise & Fork workflow.

---

## 17. Adoption

The manual action that accepts an eligible Proposal and creates one Activity from it.

Any Current Trip Participant may Adopt when the current strict-majority rule is satisfied.

A successful Adoption performs:

```text
Proposal.status: PENDING → ACCEPTED
```

and creates one Proposal-sourced Activity.

P0 allows at most one current Activity created from the same Proposal.

Concurrent Adoption attempts must not create duplicates.

If that accepted Proposal-sourced Activity is deleted, the Proposal returns to:

```text
status: ACCEPTED → PENDING
```

and can be Adopted again only after the current majority requirement is satisfied again.

---

## 18. Realtime Update

A committed Activity, Proposal, Vote, or Adoption change pushed to other connected Trip participants.

Realtime delivery is not the authoritative stored state.

---

# Canonical technical values

```text
MembershipRole: OWNER | MEMBER
InvitationStatus: PENDING | ACCEPTED | REJECTED
VoteDecision: AGREE | REJECT
ProposalStatus: PENDING | ACCEPTED | REJECTED
```

# Explicit P0 exclusions

P0 excludes Chat, Notification Center, Friends, Budget, Files, Maps, Activity Locking, Unscheduled Activities, Proposal Deadline/Edit/Delete, automatic Proposal rejection/kill-line, rejected-Proposal archive, Revise & Fork, Ownership Transfer, Editor/Viewer roles, Archive/Restore, and full Activity audit history.
