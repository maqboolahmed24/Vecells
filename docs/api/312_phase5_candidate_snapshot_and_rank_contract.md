# 312 Phase 5 Candidate Snapshot And Rank Contract

This document freezes the machine-readable objects that later Phase 5 tracks must consume for network candidate reasoning.

## Core objects

| Contract | Purpose | Mandatory binding |
| --- | --- | --- |
| EnhancedAccessPolicy | Compiled tuple root for the five policy families plus ranking versions. | `policyTupleHash`, family refs, rank-plan version, uncertainty-model version |
| NetworkCoordinationPolicyEvaluation | One bound evaluation vocabulary per candidate snapshot. | `routingDisposition`, `varianceDisposition`, `serviceObligationDisposition`, `practiceVisibilityDisposition`, `capacityAdmissionDisposition` |
| NetworkSlotCandidate | Normalized candidate row with proof-bearing features. | `sourceTrustState`, `requiredWindowFit`, `baseUtility`, `uncertaintyRadius`, `robustFit` |
| NetworkCandidateSnapshot | Durable candidate batch with proof refs. | `policyTupleHash`, `rankPlanVersionRef`, `uncertaintyModelVersionRef`, `capacityRankProofRef` |
| CrossSiteDecisionPlan | Ordered frontier plan across sites. | `orderedCandidateRefs[]`, dominance decisions, frontier slices |

## Canonical candidate fields

| Field | Why it is mandatory |
| --- | --- |
| `siteId` | Supports site-aware capacity reasoning and later open-choice diversity. |
| `modality` | Feeds modality compatibility and patient explanation cues. |
| `clinicianType` | Keeps operational suitability explicit. |
| `sourceTrustState` | Governs bookability and visibility. |
| `sourceFreshnessState` | Separates fresh, aging, and stale feed posture. |
| `requiredWindowFit` | Defines the hard clinical band used by `windowClass(c,s)`. |
| `manageCapabilityState` | Stops stale manage CTAs from remaining live. |
| `accessibilityFitScore` | Preserves patient-access needs as an explicit normalized feature. |
| `capacityRankExplanationRef` | Stops surfaces from inventing fresh cues locally. |

## Proof contract

The proof-bearing ranking contract persists:

- `baseUtility`
- `uncertaintyRadius`
- `robustFit`
- source trust tier
- dominance decisions
- the final lexicographic order

Later queue work, patient-choice work, support replay, and operations diagnostics must all reuse the same persisted proof instead of recalculating ordinals or reason cues.

## Sample ordered frontier

| Rank | Candidate | Window | Trust | Offerability | Robust fit |
| --- | --- | --- | --- | --- | --- |
| 1 | 18:45 Riverside Hub (video capable) | 2 | trusted | direct_commit | 0.85 |
| 2 | 18:35 Northway Clinic (phone only) | 2 | degraded | callback_only_reasoning | 0.64 |
| 3 | 19:40 Central Hub (face to face) | 1 | trusted | patient_offerable | 0.76 |
| 4 | 18:50 Southbank Outreach (frozen feed) | 2 | quarantined | diagnostic_only | 0.39 |
| 5 | 20:30 West Hub (explanation only) | 0 | trusted | callback_only_reasoning | 0.64 |
