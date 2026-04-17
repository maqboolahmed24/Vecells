# 207 Duplicate Follow-Up And Re-Safety Matrix

Task: `seq_207`

The duplicate matrix proves that late evidence cannot silently merge into a request. It must be frozen, assigned a duplicate class, checked against continuity witness rules, and then either reuse an existing lineage or extend the lineage with re-safety records.

This matrix is paired with the PDS enrichment boundary matrix so optional PDS provenance and duplicate follow-up safety truth are validated together.

| Case                                  | Duplicate class        | Re-safety decision                           | Lineage decision                                       | Patient-visible status                         | Audit and provenance truth                                   |
| ------------------------------------- | ---------------------- | -------------------------------------------- | ------------------------------------------------------ | ---------------------------------------------- | ------------------------------------------------------------ |
| `FUP207_EXACT_REPLAY_PHONE`           | `exact_replay`         | No re-safety.                                | Reuse the settled assimilation chain.                  | No new receipt or reassurance drift.           | Same idempotency and exact digest returned.                  |
| `FUP207_SAME_AUDIO_PROVIDER_RETRY`    | `exact_retry_collapse` | No re-safety.                                | Reuse duplicate digest after provider retry.           | Retry is collapsed without a second receipt.   | Provider retry is marked as a replay.                        |
| `FUP207_SAME_FACTS_RESTATED`          | `semantic_replay`      | No re-safety.                                | Reuse the existing assimilation record.                | Existing detail-received state remains stable. | Semantic digest proves the facts already settled.            |
| `FUP207_MATERIAL_SYMPTOMS`            | `same_request_attach`  | Re-safety required.                          | Extend request lineage with safety preemption.         | `detail_received_being_checked`.               | Continuity witness accepted and material delta recorded.     |
| `FUP207_MATERIAL_RISK_FACTORS`        | `same_request_attach`  | Urgent re-safety required.                   | Extend lineage with urgent review.                     | `urgent_review_opened`.                        | No stale calm status can be exposed.                         |
| `FUP207_ADMIN_METADATA_ONLY`          | `same_request_attach`  | No re-safety.                                | Extend lineage without preemption.                     | `detail_added`.                                | Technical metadata allow-list is recorded.                   |
| `FUP207_DUPLICATE_ATTACHMENT`         | `duplicate_attachment` | No re-safety.                                | Same-request attach with continuity witness.           | No new receipt.                                | Duplicate attachment digest is reused.                       |
| `FUP207_LATE_EVIDENCE_RESAFETY`       | `same_request_attach`  | Re-safety required.                          | Extend lineage with a new safety epoch.                | `detail_received_being_checked`.               | Material delta and preemption refs are recorded.             |
| `FUP207_LATE_EVIDENCE_CLOSED_REQUEST` | `review_required`      | Review required before re-safety can settle. | Lineage attach blocked until release fence is current. | `review_pending`.                              | Release fence failure blocks stale closed-status projection. |
| `FUP207_IDENTITY_HOLD_ACTIVE`         | `review_required`      | No re-safety until identity settles.         | Lineage attach blocked until subject fence is current. | `review_pending`.                              | Subject fence failure suppresses PHI and calm projection.    |

## Required Assertions

- Duplicate class is explicit for every late follow-up.
- Re-safety triggers only for material clinical, contact-safety, urgent, or degraded evidence.
- Admin-only and duplicate-attachment evidence must not open a second safety chain.
- Lineage reuse is limited to exact and semantic replays; material changes extend the lineage.
- Closed/resolved and identity-held requests cannot show stale calm status while evidence is unresolved.
- Audit truth records digest basis, continuity witness outcome, projection hold, and material-delta decision.

## Validation Posture

Mock-now status is `passed` for all repository-owned rows. Live carrier or PDS provider evidence is `not_applicable` for this matrix. Playwright covers exact duplicate and material re-safety visual states.
