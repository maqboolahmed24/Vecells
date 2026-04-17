# 197 Request Claim, Resume, And Identity Hold Postures

`par_197` adds the patient-facing continuity posture family for claim, resume, narrowed access, identity hold, rebind, stale grant mapping, and wrong-patient freeze. The route family lives under `/portal/claim/*` and is resolved by `ClaimResumePostureResolver` instead of query strings or ad hoc frontend booleans.

## Resolver Contract

Every posture is built from a `ClaimResumePostureProjection`. The projection carries the current:

| Contract | Purpose |
| --- | --- |
| `PostAuthReturnIntent` | Confirms whether the sign-in or step-up return can preserve the same shell. |
| `RouteIntentBinding` | Determines open, read-only, recovery-only, or blocked route posture. |
| `AccessGrantScopeEnvelope` | Declares visible fields and whether writable action is allowed. |
| `AccessGrantRedemptionRecord` | Holds exact-once redemption state and settled outcome mapping. |
| `AccessGrantSupersessionRecord` | Maps stale or replaced grants to the current safe destination. |
| `PatientActionRecoveryProjection` | Publishes the next safe same-shell recovery action. |
| `PatientIdentityHoldProjection` | Distinguishes identity hold, rebind, and wrong-patient freeze. |
| `PatientAudienceCoverageProjection` | Gates visible patient detail before render. |
| `PatientRequestReturnBundle` | Preserves selected request anchor and last-safe summary. |

The live route uses one anatomy across the family: title, one-sentence explanation, `ContinuityContextPanel`, dominant next-safe action, optional secondary action when allowed, privacy boundary strip, and bounded live announcement.

## Route Family

| Path | Posture | Reason code | Patient-facing outcome |
| --- | --- | --- | --- |
| `/portal/claim/pending` | `claim_pending` | `access_grant_redemption_pending` | Sign-in worked, request is still attaching safely. |
| `/portal/claim/confirmed` | `claim_confirmed` | `access_grant_settled_same_lineage` | Same request lineage is connected. |
| `/portal/claim/read-only` | `read_only` | `scope_envelope_narrowed_read_only` | Safe summary remains visible; editing waits. |
| `/portal/claim/recover-only` | `recover_only` | `stale_link_already_settled` | Link enters same-shell recovery only. |
| `/portal/claim/identity-hold` | `identity_hold` | `identity_evidence_hold_active` | Detailed content is hidden while identity catches up. |
| `/portal/claim/rebind-required` | `rebind_required` | `subject_rebind_required` | Request must be safely reconnected before detail returns. |
| `/portal/claim/stale-link` | `stale_link_mapped` | `stale_link_already_settled` | Old link maps to the settled current result. |
| `/portal/claim/stale-grant` | `stale_grant_mapped` | `duplicate_redemption_mapped` | Duplicate or cross-device replay maps to the same result. |
| `/portal/claim/support-recovery` | `support_recovery_required` | `support_recovery_required` | Support recovery uses the same continuity shell. |
| `/portal/claim/wrong-patient-freeze` | `wrong_patient_freeze` | `wrong_patient_freeze_active` | Unsafe detail and actions freeze while safe context remains. |
| `/portal/claim/promoted-draft` | `promoted_draft_mapped` | `promoted_draft_already_request` | Old draft link opens request truth, not mutable editing. |

## Same-Shell Rules

The route never redirects to a generic landing page while `PatientRequestReturnBundle` and same-lineage continuity remain available. Replay, duplicate redemption, stale link, and stale promoted draft outcomes map to the known settled result or recovery path.

Read-only, identity hold, rebind, and wrong-patient freeze are visually distinct. Read-only uses a neutral blue accent and still explains the same request lineage. Hold and rebind use a safety accent and suppress message bodies, attachment previews, detailed request narrative, subject hashes, raw grant identifiers, and internal reason payloads.

## Sibling Seams

Task `196` is present and coherent, so this route shares the `/portal/*` shell family and preserves return to `/portal/requests`. Tasks `199` and `201` are not yet present, so `PARALLEL_INTERFACE_GAP_PHASE2_CLAIM_RESUME.json` publishes the temporary seam for signed-in request creation and receipt/status parity handoff.

## Validation

`tools/analysis/validate_claim_resume_and_identity_hold_postures.py` checks projection tokens, route gates, distinct visual treatments, privacy gating, gap artifacts, data matrices, Playwright coverage, and root script wiring. Browser proof lives in `tests/playwright/197_request_claim_resume_and_identity_hold_postures.spec.ts`.
