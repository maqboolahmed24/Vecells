# 312 Phase 5 Policy Tuple And Source Trust Rules

This document closes the Phase 5 gap where policy families, source trust, and ranking cues could otherwise bleed into each other.

## Tuple and disposition law

Every candidate snapshot binds one `NetworkCoordinationPolicyEvaluation` with separate disposition fields:

- `routingDisposition`
- `varianceDisposition`
- `serviceObligationDisposition`
- `practiceVisibilityDisposition`
- `capacityAdmissionDisposition`

These fields must never be collapsed into a single opaque status.

## Source-trust rules

1. Source trust is resolved before a candidate becomes bookable.
2. `trusted` means the candidate may participate in patient-offerable and direct-commit frontiers if routing and variance also allow it.
3. `degraded` means the candidate may remain visible only for diagnostic or callback reasoning.
4. `quarantined` means the candidate is excluded from bookable and patient-offerable frontiers.

## Ranking separation rules

1. `windowClass` is a hard band and remains outside the utility expression.
2. `baseUtility` is within-band only.
3. `uncertaintyRadius` is a persisted proof field rather than route-local stale-feed copy.
4. `robustFit` is the only within-band score used after window class and trust tier.
5. Service-obligation and practice-visibility rules may not influence rank order or frontier membership.

## Operational debt rules

| Policy family | What it may create | What it may never do |
| --- | --- | --- |
| Routing pack | Frontier gating or source admission only | Must not re-score candidates inside the same admissible frontier. Must not hide candidates for practice-visibility reasons. |
| Variance window pack | Frontier gating or source admission only | Window fit is a hard band, not a hidden term inside `baseUtility`. Window fit may not be counted twice through convenience scoring. |
| Service obligation pack | Ledgers or exceptions | May create ledgers or exception records only. May not quietly hide, demote, or reorder candidates. |
| Practice visibility pack | Acknowledgement debt or visibility deltas | May mint acknowledgement debt or visibility deltas only. May not suppress patient-offerable or direct-commit candidates. |
| Capacity ingestion pack | Frontier gating or source admission only | Quarantined supply may never become bookable or patient-offerable. Degraded supply may remain visible only for diagnostic or callback reasoning. |

## Typed seam carry-forward

The queue and patient-choice seams published alongside this contract exist so later Phase 5 tracks cannot hide new ranking logic in UI projections, offer composition, or queue workbench code.
