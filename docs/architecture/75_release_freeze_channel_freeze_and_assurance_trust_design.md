# 75 Release Freeze, Channel Freeze, and Assurance Trust Design

## Core law
`ReleaseApprovalFreeze` is the immutable approved release tuple, `ChannelReleaseFreezeRecord` is the channel-specific write gate, `AssuranceSliceTrustRecord` is the per-slice trust authority, and `ReleaseTrustFreezeVerdict` is the only legal live-authority decision once published.

## Model set
This pack freezes 6 release freezes, 6 channel-freeze rows, 12 assurance-slice rows, and 6 published verdicts across the Phase 0 control-plane cases required by prompt `075`.

The supporting objects remain explicit:
- `GovernanceReviewPackage` carries the reviewed baseline, compilation, approval, watch, and settlement lineage hashes.
- `StandardsDependencyWatchlist` carries candidate-bound hygiene and drift state.
- `ReleaseApprovalFreeze` binds those exact reviewed rows rather than relying on floating bundle or schema hashes.
- `ReleaseTrustFreezeVerdict` joins watch tuple, guardrail, publication, parity, provenance, channel freeze, and slice trust into one publishable posture.

## Simulation scenarios
The simulator now covers:
- exact live authority with trusted slices
- degraded slice posture forcing `diagnostic_only`
- active channel freeze forcing `recovery_only`
- missing inputs forcing `blocked`
- standards watchlist drift superseding an otherwise exact freeze
- parity or provenance drift suppressing calm truth and writable posture

## Persistence and shared contract surface
The authoritative rows persist through the command-api seam and are republished for downstream consumers through `@vecells/release-controls`, so later gateways and shells do not depend on private domain-package internals to interpret release trust.
