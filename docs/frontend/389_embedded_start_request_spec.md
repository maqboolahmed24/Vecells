# 389 Embedded Start Request Spec

## Purpose

`NHSApp_Embedded_Start_Request` is the NHS App embedded version of the Phase 1 start-request intake. It is not a second form product. It uses the canonical `IntakeDraftView`, progressive question model, contact summary, `SubmissionEnvelope`, and receipt surface while presenting them in the narrower embedded shell geometry.

## Components

- `EmbeddedIntakeFrame`: route-owned main landmark and contract anchors.
- `EmbeddedIntakeQuestionCard`: active request type or detail question plane.
- `EmbeddedDraftSaveChip`: autosave truth state, never a toast.
- `EmbeddedValidationSummaryBar`: focused validation summary for blocked detail questions.
- `EmbeddedReviewWorkspace`: check-and-send view bound to the same answers and contact route.
- `EmbeddedSubmitActionBar`: sticky safe-area action reserve.
- `EmbeddedReceiptMorphFrame`: in-place receipt surface after submission.
- `EmbeddedResumeDraftBanner`: degraded and promoted draft recovery.
- `EmbeddedIntakeAnchorRail`: selected anchor and same-shell continuity proof.
- `EmbeddedIntakeFieldsetAdapter`: canonical progressive field renderer.
- `EmbeddedIntakeProgressStepper`: compact five-step embedded progress rail.

## Route Contract

Embedded start-request routes are evaluated before the broad `/nhs-app` embedded shell route:

- `/nhs-app/start-request`
- `/nhs-app/start-request/:draftPublicId/request-type`
- `/nhs-app/start-request/:draftPublicId/details`
- `/nhs-app/start-request/:draftPublicId/contact`
- `/nhs-app/start-request/:draftPublicId/review`
- `/nhs-app/start-request/:draftPublicId/receipt`
- `/nhs-app/start-request/:draftPublicId/resume`
- `/embedded-start-request`

The embedded route maps each visible step back to the canonical browser route aliases under `/start-request/:draftPublicId/...` before resolving `IntakeDraftView`. The embedded shell continuity key is carried as draft-continuity evidence, while `draftView.intakeConvergenceContractRef` remains `ICC_139_PHASE1_SELF_SERVICE_V1`.

## Journey Rules

- Request type, detail validation, contact preference, review, submit, receipt, and resume recovery all resolve from one `IntakeMissionFrameMemory`.
- Autosave moves through `draft_not_started`, `saving`, and `saved_authoritative` with the chip inside the masthead.
- Detail validation blocks forward movement and focuses `EmbeddedValidationSummaryBar`.
- Submit promotes the draft once, then morphs the same content width into `EmbeddedReceiptMorphFrame`.
- A promoted draft recovery opens the receipt rather than reopening editable draft fields.
- Tracking request status hands off to the Phase 7 embedded shell status route.

## Layout

- Canvas: `#F6F8FB`
- Panel: `#FFFFFF`
- Panel soft: `#F3F6FA`
- Stroke: `#D9E2EC`
- Text strong: `#0F172A`
- Text: `#334155`
- Text muted: `#64748B`
- Accent: `#2457FF`
- Success: `#146C43`
- Warning: `#A16207`
- Error: `#B42318`

The content shell is capped at 46rem, horizontal padding starts at 16px, question-card padding is 20px, field spacing is 12px, and the sticky action reserve has a 72px minimum height plus safe-area inset.

## Verification

Validation is provided by `tools/analysis/validate_389_embedded_start_request_ui.ts`.

Playwright evidence covers first-run intake, validation failure, successful submit, autosave and resume, promoted-draft recovery, device emulation, ARIA snapshots for validation and sticky actions, submit-to-receipt traces, and visual baselines for empty, partial, error, review, and receipt states.
