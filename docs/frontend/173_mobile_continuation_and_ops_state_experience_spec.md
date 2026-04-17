# Mobile Continuation And Ops State Experience Spec

Sequence: `seq_173_phase2_freeze_telephony_call_session_and_evidence_readiness_contracts`
Surface mode: `Telephony_Readiness_Board`

## Visual Thesis

The patient surface is a quiet mobile handoff with one safe next action; the internal board is a calm telephony evidence room where state, readiness, and continuation truth are visible without raw patient evidence.

## Content Plan

- Mobile preview: short call summary, current continuation posture, one primary CTA, save or sync note, and a bounded recovery note when needed.
- Ops summary: dominant readiness verdict, current call state, next constrained action, and supporting tables.
- Diagrams: call-state braid, readiness ladder, continuation gate strip, and mobile continuation preview.
- Parity: every diagram has adjacent table or list parity sourced from the same CSV and JSON artifacts.

## Interaction Thesis

- Selection sync moves the same call-state, readiness, provider-event, mobile preview, and inspector context together in `180ms`.
- The inspector reveals the reason-code and boundary implications in `220ms` without changing the underlying truth.
- Reduced motion removes animation while preserving selection, focus, and parity announcements.

## Patient Mobile Continuation Grammar

Mobile continuation is same-lineage and minimal:

| Grammar State        | Source Truth                                                                                 | Patient Copy Shape                                                    | Primary Action       | Forbidden Meaning                                                         |
| -------------------- | -------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------- |
| `seeded_verified`    | `TelephonyContinuationEligibility.continuation_seeded_verified` plus canonical `AccessGrant` | We have captured some details from your call. Add anything missing.   | Continue request     | Do not imply the call is fully processed before routine readiness settles |
| `challenge_required` | `continuation_challenge`                                                                     | Confirm it is you before we show or use any saved details.            | Confirm first        | Do not show existing patient data                                         |
| `urgent_live_only`   | `TelephonyEvidenceReadinessAssessment.usabilityState = urgent_live_only`                     | We are handling the urgent part. We may still need more detail later. | Follow urgent advice | Do not offer routine submit                                               |
| `manual_review_only` | manual disposition open or `manual_only` eligibility                                         | We need to review the call before a link can continue this request.   | Wait for follow-up   | Do not create or imply a redeemable grant                                 |
| `bounded_recovery`   | stale grant, stale binding fence, or channel freeze                                          | We kept your call summary. Refresh access before continuing.          | Refresh access       | Do not reopen a fresh seeded state                                        |

Dimensional requirements:

- mobile artboard width: `390px`;
- content max width: `344px`;
- top spacing: `24px`;
- single bottom-sticky CTA reserve: `88px`;
- no dense chrome, transcript text, raw phone number, or patient demographic comparison.

## Internal Readiness Board Grammar

The internal board must show:

- restrained Vecells wordmark and inline SVG `telephony_echo_mark`;
- masthead `72px`;
- optional upper preview band containing the `390px` mobile artboard and readiness summary strip;
- left event and state rail `300px`;
- center braid/ladders canvas;
- right inspector `408px`;
- lower parity tables for state transitions, readiness truth, and provider-event mappings;
- max width `1640px`.

Palette tokens:

- `#F7F8FA` canvas;
- `#EEF2F6` shell;
- `#FFFFFF` panel;
- `#E8EEF3` inset;
- `#0F1720` strong text;
- `#24313D` default text;
- `#5E6B78` muted text;
- `#2F6FED` call;
- `#0E7490` audio;
- `#5B61F6` continuation;
- `#B42318` urgent;
- `#B7791F` manual;
- `#117A55` ready.

Typography uses the canonical shell stack and roles: board title `36/44`, section title `20/28`, card heading `16/24`, body `15/24`, helper `13/20`, tabular ids `12/18`.

## Required Test Coverage

The board proof must cover:

- state selection synchronization;
- provider-event and readiness-table parity;
- urgent-live-only and manual-review-only rendering;
- mobile continuation preview parity;
- keyboard traversal and landmarks;
- reducedMotion equivalence;
- diagram/table parity.

## Board Data Sources

The board reads:

- [173_call_state_transition_matrix.csv](/Users/test/Code/V/data/analysis/173_call_state_transition_matrix.csv)
- [173_readiness_truth_table.csv](/Users/test/Code/V/data/analysis/173_readiness_truth_table.csv)
- [173_provider_event_mapping.csv](/Users/test/Code/V/data/analysis/173_provider_event_mapping.csv)
- [173_telephony_gap_log.json](/Users/test/Code/V/data/analysis/173_telephony_gap_log.json)

Meaning not present in those sources must not appear in the board.

The board must show `TelephonyEvidenceReadinessAssessment`, `TelephonyContinuationEligibility`, and `TelephonyManualReviewDisposition` as separate authorities. A `manual_only` continuation row means no redeemable grant, and canonical intake wording is legal only when the readiness table says `safety_usable` plus `ready_to_promote`.
Provider details shown on the board stop at the normalization boundary: only canonical event family, payload-ref boundary, consumers, state, and reason codes may appear.
