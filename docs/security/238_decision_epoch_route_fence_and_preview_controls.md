# 238 Decision Epoch Route Fence And Preview Controls

## Core Security Posture

The endpoint-decision engine is fenced by the live task lease, ownership epoch, fencing token, lineage fence, selected anchor, publication tuple, and trust posture.
If the current task lease has merely expired in place, the runtime may reacquire the lifecycle lease on the same authority key before registering the endpoint command. Actor identity is still carried in the command record, but lease freshness remains the enforced write gate in the current Phase 3 backbone.

Every mutating action resolves:

1. one canonical `CommandActionRecord`
2. one authoritative `CommandSettlementRecord`
3. one `EndpointDecisionActionRecord`
4. one `EndpointDecisionSettlement`

Local acknowledgement is never the source of truth.

## Drift Controls

The engine fails closed on:

- stale selected anchor
- stale publication tuple
- stale trust posture
- stale ownership epoch
- stale review version
- stale evidence snapshot
- stale approval burden

When drift is detected, the old epoch is superseded and stale preview posture becomes provenance only.

## Binding States

The security meaning of binding states is:

- `live`: full writable consequence-preparation posture
- `preview_only`: deterministic preview allowed, commit blocked
- `stale`: recovery or recommit required
- `blocked`: no writable consequence posture

`preview_only` is used when trust or publication policy allows observation but not commit.
`blocked` is used when the route fence or trust posture no longer permits safe mutation.

## Approval Bypass Prevention

Approval requirement is an epoch-bound object, not a task-local flag.
No direct-resolution or handoff continuation may treat `required`, `pending`, `rejected`, or `superseded` approval posture as submit-safe.

`submit_endpoint` returns `blocked_approval_gate` when approval is still required.

## Preview Provenance Controls

Preview artifacts are deterministic and reproducible for the same tuple.
They use the `235` summary builder and therefore remain explainable and auditable.

Superseded previews:

- remain visible as provenance
- move to `recovery_only`
- cannot remain commit-ready

This closes the stale preview survives supersession gap.

## Boundary Tuple Controls

`admin_resolution` and `self_care_and_safety_net` require an `EndpointBoundaryTuple`.
The tuple is bound to the same `DecisionEpoch`.
If the tuple hash no longer matches the endpoint decision and selected anchor, the binding becomes blocked.
