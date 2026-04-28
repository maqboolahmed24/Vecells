# 252 Advice Admin Dependency And Reopen Engine

`252` makes `AdviceAdminDependencySet` the canonical reopen and blocker fence for Phase 3 self-care and bounded admin consequence.

## What this engine owns

- one durable `AdviceAdminDependencySet` per accepted tuple evaluation
- deterministic `dependencyState`:
  - `clear`
  - `repair_required`
  - `disputed`
  - `blocked_pending_identity`
  - `blocked_pending_consent`
  - `blocked_pending_external_confirmation`
- deterministic `reopenState`:
  - `stable`
  - `reopen_required`
  - `reopened`
  - `blocked_pending_review`
- one trigger registry for:
  - ordinary dependency blockers
  - reopen triggers
  - clinical reentry triggers
- one dominant blocker reason and one dominant recovery route

## Tuple law

Every accepted dependency set binds the live:

- `SelfCareBoundaryDecision`
- `boundaryTupleHash`
- unsuperseded `DecisionEpoch`
- lineage fence epoch
- current advice render and bounded-admin subtype context when present
- current reachability, consent, identity, and external dependency evidence when present

Mutations echo the current tuple and settle `stale_recoverable` when the caller presents a stale boundary hash, decision epoch, or dependency-set ref.

## Precedence

Dominant blocker and dominant recovery route use one fixed order:

1. clinical reentry or safety-critical reopen
2. identity repair
3. consent renewal
4. reachability or route repair
5. delivery dispute
6. external dependency confirmation

Repair blockers stay separate from reopen and clinical reentry triggers. A request can be repairable without clinician reentry, and it can require clinician reentry even when ordinary blockers are otherwise clear.

## Runtime composition

The command-api wrapper resolves one evaluation input from:

- `249` current `SelfCareBoundaryDecision`
- `250` current `AdviceRenderSettlement`
- `251` current `AdminResolutionCase` continuity posture
- `245` communication repair and reachability truth
- `247` patient conversation digest, consent checkpoint, delivery-dispute posture, and urgent diversion tuple
- request-level evidence and safety refs from the canonical control-plane request snapshot

`252` does not redefine any of those sources. It classifies and freezes consequence from them.

## Reopen law

`AdviceAdminDependencySet` is the sole reopen fence for advice and bounded admin follow-up. The engine reopens or blocks when any of these become true:

- boundary is blocked or already reopened
- safety preemption or urgent diversion is active
- material evidence tuple drifts
- advice render is invalidated or quarantined
- bounded admin continuity is frozen
- decision epoch or lineage fence drifts materially

## Accepted seams

Two seams stay explicit instead of hidden:

1. live request-scoped identity blocking is an injected backend port until the wider identity-access runtime exposes one narrow current-state query
2. older cross-package source registries still mention `AdviceAdminDependencySet` under identity-access ownership; operational ownership for this executable Phase 3 kernel now sits in `@vecells/domain-triage-workspace`

`253` and `254` consume this dependency truth. They do not redefine it.
