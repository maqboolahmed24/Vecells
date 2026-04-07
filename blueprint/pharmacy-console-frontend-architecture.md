# Pharmacy console frontend architecture

## Purpose

Define the dedicated front-end mission model for the Pharmacy Console inside the shared Vecells pharmacy shell.

This document turns the broader pharmacy, staff, and platform shell rules into one enforceable operational interface for pharmacists and pharmacy operations staff. It covers prescription validation, inventory-aware fulfilment, exception handling, handoff, and assurance without replacing the canonical domain, safety, or lifecycle rules already defined elsewhere.

This specialization is deliberately scope-bounded. It governs pharmacy-facing validation, fulfilment, and assurance views only when Vecells is operating a servicing-site or pharmacy-assurance surface with medicine-level data available under policy. It does not redefine Phase 6 as a general PMR or dispensing product, and the referral-first Pharmacy First loop in `phase-6-the-pharmacy-loop.md` remains canonical.

The console must feel like a calm instrument, not a busy dashboard.

## Design law

The Pharmacy Console obeys six non-negotiable laws:

1. same case, same shell
2. one medication decision at a time
3. no silent progression past a safety checkpoint
4. no inventory assumption without explicit freshness
5. no irreversible action without consequence preview and reason-coded confirmation
6. no blocker may be visually weaker than the action it blocks

The practical operating law is:

**one case, one checkpoint, one dominant action, one promoted support region**

## Visual token profile

The Pharmacy Console inherits `design-token-foundation.md` through `profile.pharmacy_console`.

- shell and checkpoint surfaces use `balanced` density; queue lanes and stock-comparison lists may step down to `compact`, but command, confirmation, and blocker regions stay `balanced`
- medication cards, validation boards, checkpoint rails, and assurance drawers use shared surface-role tokens rather than a local dashboard or PMR palette
- semantic emphasis comes from trust, freshness, checkpoint consequence, and actionability; inventory, expiry, and blocker signals may not rely on color alone
- pane widths, radius, stroke, elevation, and motion all resolve from the canonical token foundation so pharmacy work stays visually continuous with the rest of Vecells

## Console scope

The console must support the full pharmacy mission frame:

- claim and orient to new pharmacy work
- validate legal, clinical, and operational prescription, referral, or medicine-supply truth as exposed by the enabled service lane
- inspect stock, expiry, storage, and fulfilment fit when governed inventory data is in scope
- resolve substitutions, partial supply, clarifications, and supervisor exceptions
- prepare collection, delivery, or onward-return handoff safely
- record outcome and reopen work when safety or evidence requires it

## Canonical shell model

The console must render through `PersistentShell.shellType = pharmacy` and inherit the quiet-first topology from `platform-frontend-blueprint.md`.

The route family may still be hosted under `/workspace/pharmacy...` inside the broader staff product, but once that continuity key is active the UI must adopt this pharmacy-shell mission frame rather than the generic Clinical Workspace queue-detail layout.

Add the pharmacy-console child contract:

**PharmacyConsoleShell**  
`entityContinuityKey`, `missionTokenRef`, `activeQueueLane`, `activePharmacyCaseRef`, `activePrescriptionRef`, `activeLineItemRef`, `activeCheckpointRef`, `activeStockAnchorRef`, `queueAnchorLeaseRef`, `workbenchPosture = quiet | blocker_promoted | compare_promoted | audit_promoted`, `validationMode = sequential | compare | exception | handoff | assurance`, `commandFenceState = idle | armed | awaiting_second_ack | committing`, `actionSettlementState = idle | locally_acked | remotely_settling | settled | reconcile_required`, `mutationGateRef`, `dispatchSettlementRef`, `outcomeSettlementRef`, `inventoryFreshnessState = fresh | refreshing | stale | unavailable`, `inventoryComparisonFenceRef`, `focusProtectionMode = normal | composing | barcode_entry | note_entry | dual_check`, `handoffWatchWindowRef`, `resumeTargetRef`

Semantics:

- is implemented inside the existing pharmacy shell rather than as a detached product
- defaults to `layoutTopology = two_plane` and `clarityMode = essential`
- promotes to `three_plane` only for compare, blocker, or audit-heavy work
- treats the active medication line, selected stock lot, and chosen intervention path as `SelectedAnchor` objects
- must restore the last quiet posture after blocker or compare work resolves unless the user explicitly pinned a richer view
- must preserve queue position, scroll, active draft input, and selected anchors across soft child-view changes
- must bind irreversible actions to one active mission token so service lane, facility, role mode, and governing policy scope cannot drift silently while a pharmacist is working the case
- must surface local acknowledgement as provisional until remote settlement resolves, with inline reconcile posture when command outcome diverges from projection truth
- must also render through the current `QuietClarityBinding`, `QuietClarityEligibilityGate`, `PrimaryRegionBinding`, `StatusStripAuthority`, `DecisionDockFocusLease`, `MissionStackFoldPlan`, `CalmDegradedStateContract`, and `QuietSettlementEnvelope`
- `PrimaryRegionBinding` must stay attached to the active medication line and checkpoint; invalidation may not auto-advance the pharmacist or silently switch to a neighbouring line
- `DecisionDockFocusLease` is the only commit-ready action locus in routine sequential validation
- `MissionStackFoldPlan` must preserve the active medication line, blocker stub, selected stock anchor, and command-fence state on narrow screens
- quiet release, reopen, or closure posture is legal only after `QuietSettlementEnvelope`, `PharmacyActionSettlement`, and current continuity evidence all agree

Pharmacy shell-family ownership is explicit:

- instantiate one `ShellFamilyOwnershipContract(shellType = pharmacy)` over the pharmacy queue, case workbench, compare, assurance, audit, handoff, and recovery route families that share one active pharmacy case continuity frame
- every pharmacy route family must publish one `RouteFamilyOwnershipClaim`; compare, stock review, handoff summary, audit, and reopen states are same-shell child or bounded-stage members of the pharmacy shell, not generic workspace or detached artifact pages
- workspace, inventory, dispatch, and outcome domains may contribute panels, settlements, or artifacts, but none of them may claim shell ownership away from the pharmacy console while the same pharmacy case remains active
- deep links, refresh, browser back or forward, and reconcile recovery must reopen the current pharmacy shell and anchor rather than falling back to the generic workspace task layout
- every pharmacy route family must also materialize one live `FrontendContractManifest`, one exact `ProjectionContractVersionSet`, and one `projectionCompatibilityDigestRef`; case workbench, compare, stock review, handoff, audit, and reopen surfaces may read only through declared `ProjectionQueryContract` refs, write only through declared `MutationCommandContract` refs, and preserve cached stock or settlement context only through the declared `ClientCachePolicy`
- inventory shape, dispatch transport status, and stale outcome summaries may not be treated as browser authority for writable posture, settled release copy, or reopen eligibility when the active pharmacy manifest or runtime binding has degraded

Add the supporting shell contracts:

**PharmacyMissionToken**
`missionTokenId`, `serviceLane`, `dispenseMode = routine | controlled_drug | cold_chain | delivery | return`, `facilityScopeRef`, `actingRoleRef`, `policyBundleRef`, `caseVersionRef`, `issuedAt`, `expiresAt`

`PharmacyMissionToken` is minted when a case is claimed or materially re-scoped. Every irreversible command must carry the current token. If facility scope, acting role, enabled lane, policy bundle, or governing case version changes, the shell must invalidate the token, freeze irreversible controls, and force an explicit re-orientation step before work resumes.

**QueueAnchorLease**
`leaseId`, `anchoredRowRef`, `worklistVersionRef`, `openedAtRank`, `changedSinceSeenCursor`, `leaseMode = passive | input_locked | fence_locked`, `expiresOnIntentExit`

`QueueAnchorLease` makes queue stability explicit rather than visual only. While a lease is active, live reprioritisation may update urgency indicators and lane counters, but the anchored row, its local rank context, and the pharmacist's active checkpoint remain stable. If the row leaves its lane or receives a new blocker while leased, the shell keeps the current context in place, marks it `anchored_changed`, and requires explicit acknowledgement before rebinding actions to the new truth.

**PharmacyActionSettlement**
`settlementId`, `commandType`, `subjectRef`, `canonicalSettlementType = dispatch | outcome | local_command`, `canonicalSettlementRef`, `mutationGateRef`, `pharmacyConsoleContinuityEvidenceProjectionRef`, `experienceContinuityEvidenceRef`, `fenceEpoch`, `localAckState`, `remoteSettlementState`, `reconcileState = none | waiting | mismatch | replay_required`, `displayDisposition = quiet_pending | promoted_warning | blocking_failure`

`PharmacyActionSettlement` is a display adapter over the canonical Phase 6 settlement objects, not an independent source of truth. Dispatch, release, and handoff transitions must derive from `PharmacyDispatchSettlement`; outcome, reopen, and close transitions must derive from `PharmacyOutcomeSettlement`; only reversible local workspace actions may settle without one of those canonical refs. The UI must never render a fenced action as final at local acknowledgement time. Queue rows, `DecisionDock`, and handoff summaries show a quiet pending state until the governing settlement, projection truth, and linked continuity evidence agree. If settlement times out, continuity evidence is stale, or projection truth disagrees, the shell promotes a bounded reconcile state in place instead of pretending completion.

**PharmacyConsoleContinuityEvidenceProjection**
`pharmacyConsoleContinuityEvidenceProjectionId`, `pharmacyCaseId`, `controlCode = pharmacy_console_settlement`, `routeFamilyRef`, `routeContinuityEvidenceContractRef`, `missionTokenRef`, `selectedAnchorRef`, `selectedAnchorTupleHashRef`, `surfacePublicationRef`, `runtimePublicationBundleRef`, `pharmacyContinuityEvidenceProjectionRef`, `latestActionSettlementRef`, `latestFenceSettlementWindowRef`, `experienceContinuityEvidenceRef`, `continuityTupleHash`, `validationState = trusted | degraded | stale | blocked`, `blockingRefs[]`, `capturedAt`

`PharmacyConsoleContinuityEvidenceProjection` is the pharmacy-shell bridge into the assurance spine. The console may preserve the current row, fence preview, and mission context locally, but it may not present quiet release, reopen, or closure posture unless the current `ExperienceContinuityControlEvidence` still validates the same pharmacy case, mission scope, selected-anchor tuple, canonical settlement chain, and live publication tuple.

**InventoryComparisonFence**
`fenceId`, `lineItemRef`, `inventorySnapshotRef`, `candidateLotRefs`, `substitutionOptionSetRef`, `policyEvaluationRef`, `supervisorRequirementState`, `expiresOnTruthDrift`

`InventoryComparisonFence` binds reservation, substitution, and partial-supply decisions to one reviewed stock and policy snapshot. Any change in lot availability, expiry, quarantine status, substitution eligibility, or supervisor requirement invalidates the fence, preserves the previous choice as read-only context, and requires the pharmacist to re-enter comparison before commit.

**PharmacyHandoffWatchWindow**
`watchWindowId`, `handoffRef`, `watchReason = collection | delivery | onward_return | reopened_after_release`, `openedAt`, `closeAfter`, `reentryRoute`, `reopenTriggerSet`, `latestExternalSignalRef`

`PharmacyHandoffWatchWindow` keeps release, delivery, collection, and onward-return work inside the same shell continuity until the risk window closes. Missed collection, delivery exception, return rejection, or late safety evidence must reopen the same case context through the watch window instead of spawning an unbound follow-up thread.

**PharmacySurfacePosture**
`pharmacySurfacePostureId`, `pharmacyCaseId`, `activeLineItemRef`, `activeCheckpointRef`, `surfacePostureFrameRef`, `missionTokenRef`, `selectedAnchorRef`, `dominantQuestionRef`, `dominantActionRef`, `recoveryActionRef`, `renderedAt`

**PharmacyCaseArtifactFrame**
`pharmacyCaseArtifactFrameId`, `pharmacyCaseId`, `artifactRef`, `artifactPresentationContractRef`, `artifactSurfaceFrameRef`, `artifactParityDigestRef`, `artifactTransferSettlementRef`, `artifactFallbackDispositionRef`, `missionTokenRef`, `handoffWatchWindowRef`, `returnTargetRef`, `generatedAt`

`PharmacyCaseArtifactFrame` keeps compare slips, release summaries, and onward-return material tied to one case anchor, one parity truth, and one same-shell transfer or fallback posture.

Rules:

- once a pharmacy case is known, loading or refresh must keep `CasePulse`, the active checkpoint summary, and the selected line visible through `SurfacePostureFrame`; full-shell blank states are forbidden
- `SurfacePostureFrame` must distinguish a calm no-next-line posture from blocked reconcile posture so the pharmacist can tell whether work is finished, waiting, or unsafe to continue without rereading the whole case
- release, handoff, reopen, and closure commands must use `SurfacePostureFrame(postureState = settled_pending_confirmation)` or the current blocked posture until canonical settlement and `PharmacyConsoleContinuityEvidenceProjection` agree; quiet completion may not appear early
- inventory compare summaries, handoff slips, release summaries, and onward-return artifacts must render from the current case through `PharmacyCaseArtifactFrame` plus `ArtifactSurfaceFrame`; byte output or external handoff stays secondary to the inline summary, and any export or handoff remains provisional until `artifactTransferSettlementRef` settles or `artifactFallbackDispositionRef` reopens recovery
- `mission_stack` must fold the same `PharmacySurfacePosture`, active line anchor, and `DecisionDock` state instead of creating a separate narrow-screen workflow

## Surface geometry, density, and semantic tokens

### 0. Operating geometry and semantic token contract

Use one pharmacy-specific density contract inside the shared shell:

- `space-1 = 4px`, `space-2 = 8px`, `space-3 = 12px`, `space-4 = 16px`, `space-5 = 24px`, `space-6 = 32px`
- the default desktop `two_plane` grid is `queue_spine = 22rem -> 24rem` and `validation_board = minmax(48rem, 1fr)`; when `three_plane` is justified, the promoted support region is `22rem -> 28rem`
- queue rows have minimum block size `4.5rem`; collapsed medication cards `4rem`; checkpoint pills `1.75rem`; sticky `DecisionDock` minimum block size `5.5rem`
- board sections use `space-4` interior padding, `space-3` between related controls, and `space-2` inside metric groups; only blocker summaries, compare tables, and fence impact digests may grow to `space-5`
- type scale is `micro = 0.75rem/1rem`, `body = 0.875rem/1.25rem`, `strong = 0.9375rem/1.375rem`, `heading = 1.125rem/1.5rem`; quantities, dates, batch references, and IDs use tabular numerics
- semantic tokens must remain meaning-stable across queue, cards, compare rows, handoff summaries, and settlement: `signal-stop`, `signal-review`, `signal-info`, `signal-verified`, `signal-pending`, `signal-reconcile`, `freshness-fresh`, `freshness-aging`, `freshness-stale`, `freshness-unavailable`
- colour may reinforce meaning but never originate it; every non-neutral token also renders one label or icon with short text
- motion budget is `120ms -> 160ms` for checkpoint advance, compare reveal, and fold or unfold; blocker promotion may pre-empt immediately, and reduced-motion mode collapses non-essential motion to opacity-only or none

These token rules exist to keep the console dense enough for operational use while preserving one calm, instrument-like reading order.

## Workbench topology

### 1. Queue spine

The left plane is a calm queue spine, not a dashboard mosaic.

Required lanes:

- `new_validation`
- `awaiting_clarification`
- `stock_risk`
- `ready_for_release`
- `handoff_blocked`
- `awaiting_outcome`
- `urgent_return`

Each row should show only the minimum action-shaping signals:

- patient-safe identifier summary
- prescription or case age
- medication count
- highest severity checkpoint state
- stock-risk presence
- handoff or outcome SLA state
- changed-since-seen marker

Rows must stay visually stable while live ranking changes are buffered. If the pharmacist has opened a case, the active row remains pinned through `QueueAnchorLease` until the current checkpoint, note, scan, or confirmation step finishes.

The pinned row must also carry:

- lease state when the row is intentionally held in place
- the last reviewed queue rank and lane
- a compact `changed_since_seen` delta summary
- a quiet pending-settlement marker when the active action is still resolving remotely

If a queue lane, saved filter, or stock-comparison view yields no eligible items, render one calm explanation of why the surface is quiet, what usually appears here, and the next safe action such as clearing filters, reviewing blocked work, or waiting for replenishment. Do not backfill empty pharmacy surfaces with decorative chrome or duplicated summary cards.

Queue row topology must stay consistent across lanes:

- first line: patient-safe identifier at left, age clock at right
- second line: medication count, highest checkpoint pill, stock-risk or handoff pill, and changed-since-seen delta in that order
- the far edge may show one compact settlement marker, but routine row actions may not multiply beyond one primary open or resume affordance
- lane headers stay sticky and expose total count, urgent count, and changed-since-seen count without opening the lane
- ranking keys are `highest checkpoint severity -> pending settlement urgency -> handoff or outcome SLA -> case age -> last stable rank`; live updates may change the underlying rank, but the rendered row must preserve the last stable rank while `QueueAnchorLease` is active

### 2. Validation board

The primary plane is the validation board.

It must contain:

- `CasePulse` specialised for pharmacy work
- one shared safety and freshness strip
- a prescription header with prescriber, patient, allergy, and legal-class summary
- a line-item stack with one expanded medication card at a time
- a persistent checkpoint rail
- one `DecisionDock` with the current safest next action

The default posture is sequential and low-noise:

- exactly one line item is expanded in `validationMode = sequential`
- adjacent line items remain collapsed with explicit state pills such as `verified`, `review required`, `blocked`, or `supervisor`
- secondary evidence, chronology, and inventory comparison surfaces stay collapsed until promoted by risk or explicit user request

The active validation board owns one `PrimaryRegionBinding`. Live invalidation may mark the current line or checkpoint `review_required` or `blocked`, but it may not auto-advance, collapse the active card, or switch the pharmacist to a sibling medication line.

Validation-board geometry rules:

- on wide desktop, the checkpoint rail is a fixed subcolumn inside the board and the active medication card occupies the dominant subcolumn; `DecisionDock` is sticky to the board edge, not detached into page-level chrome
- on medium desktop, the rail compresses to a sticky summary strip above the active card with one-toggle expansion into a vertical rail; horizontal-scroll rails are forbidden
- `/validate`, `/inventory`, `/resolve`, `/handoff`, and `/assurance` are posture toggles of the same board, not independent layouts; each child state must keep `CasePulse`, the active line item, and `DecisionDock` continuously visible

### 3. Support regions

Only one support region may auto-promote at a time.

Promotion priority:

1. trust or legality blocker -> `EvidencePrism`
2. stock or substitution compare task -> bounded `InlineSideStage`
3. material chronology change or reopen -> `StateBraid`
4. policy or SOP dependency -> `ContextConstellation`
5. audit review -> bounded assurance drawer

When a temporary promotion resolves, the shell must return to the last quiet posture with the active medication and checkpoint preserved.

During routine validation, `DecisionDock` is the only dominant commit-ready action surface while its `DecisionDockFocusLease` is active. Release, reopen, or close flows may not return the case to ordinary quiet posture until the active `QuietSettlementEnvelope`, `PharmacyActionSettlement`, and `PharmacyConsoleContinuityEvidenceProjection` all agree.

Add promotion hysteresis so quietness survives live change:

- `PromotedSupportRegionBudget = 1`
- `hard_stop`, `blocked`, or continuity `stale` on the active checkpoint pre-empts immediately
- compare posture may auto-promote only when no harder blocker or settlement reconcile state is active
- equal-severity auto-promotions wait behind `promotionCooldownMs = 12000` or explicit dismissal of the current promoted region
- a pharmacist-pinned support region remains pinned until unpinned or superseded by a materially higher-severity blocker

### 3A. Narrow-screen continuity and calm fallback

The pharmacy shell must stay the same shell on narrow layouts; it may not split into a second handheld workflow.

Rules:

- narrow layouts must use `mission_stack` rather than a detached mobile route family
- if no case is open, the queue spine is the default expanded region; if a case is open, the validation board becomes the default expanded region
- `stackOrder = case_summary_and_status -> validation_board -> queue_spine -> promoted_support_region`
- the queue fold must preserve current lane, queue rank context, changed-since-seen summary, and pinned-case return affordance
- the support-region fold may expose only the currently promoted region; inventory compare, evidence, chronology, and assurance may not each open as separate persistent stacks
- blocker and `supervisor_required` states must pin a visible blocker stub above the folded `DecisionDock`
- fold and unfold must preserve the active line item, expanded checkpoint, selected stock anchor, barcode-entry state, note draft, and `QueueAnchorLease`
- narrow layouts may summarize secondary detail, but they may not hide current checkpoint state, settlement posture, or the dominant next safe action

Narrow-screen action rules:

- `DecisionDock` becomes a bottom safe-area sticky bar, while the current checkpoint summary stays sticky at the top of the validation region
- `ValidationCheckpointRail` compresses to a non-scrolling summary strip showing current checkpoint label, blocked count, and verified count; opening the full rail replaces the validation-board region inside `mission_stack` rather than spawning an overlay workflow
- settlement, blocker, and invalidation copy must remain reachable to keyboard and screen-reader users even when the bottom dock is expanded or the software keyboard is open

### 3B. Empty, loading, stale, and recovery posture

Pharmacy calmness must stay explicit under safety drift.

Rules:

- queue-empty and lane-empty states must explain why no work is shown, what usually appears in the lane, and the fastest safe next action such as clearing a filter, switching lane, or returning to the pinned case
- on hydration or refresh, keep the queue spine, case summary, checkpoint rail, and dominant line-item region visible; skeletons may fill only missing cards or support panels
- if inventory truth is stale or unavailable, keep the current line item and strongest confirmed stock artifact visible, mark comparison or release paths `review required`, and surface the refresh or escalation path in `DecisionDock`
- if `PharmacyMissionToken`, `InventoryComparisonFence`, or `PharmacyConsoleContinuityEvidenceProjection` drifts, preserve the same case shell and downgrade the affected action path into bounded read-only or revalidation posture instead of silently rebinding to current defaults
- if dispatch, release, reopen, or handoff settlement is still provisional, keep the initiating line item, queue anchor, and strongest confirmed handoff or outcome artifact visible; do not show quiet release or closure language yet
- late watch-window signals such as missed collection, delivery failure, or onward-return rejection must reopen the same case shell through `PharmacyHandoffWatchWindow` rather than creating an unrelated follow-up page

## Prescription validation architecture

### 4. Checkpoint rail

Create a persistent `ValidationCheckpointRail` with these ordered checkpoints:

- `identity_and_prescriber`
- `legal_form_and_completeness`
- `clinical_safety`
- `dose_and_directions`
- `stock_and_expiry`
- `intervention_policy`
- `handoff_ready`

Each checkpoint has state:

- `not_started`
- `in_review`
- `verified`
- `review_required`
- `blocked`
- `supervisor_required`

Rules:

- the rail is always visible while a case is open
- only one checkpoint may be expanded by default
- moving to the next checkpoint should use low-amplitude motion and preserve the prior checkpoint summary in place
- a `blocked` or `supervisor_required` checkpoint suppresses non-essential support regions and takes over the promoted region budget
- the `handoff_ready` checkpoint cannot verify until all earlier checkpoints are either `verified` or resolved through an allowed override path

Add the resolved checkpoint evaluation contract:

**LineCheckpointEvaluation**
`lineCheckpointEvaluationId`, `lineItemRef`, `checkpointCode`, `requiredEvidenceRefs[]`, `blockingSignalCount`, `reviewSignalCount`, `informationSignalCount`, `freshnessState = fresh | aging | stale | unavailable`, `overrideState`, `settlementGateState`, `derivedState = not_started | in_review | verified | review_required | blocked | supervisor_required`, `derivedAt`

State derivation rules:

- `blocked` if any required evidence is absent past its hard-stop boundary, any unresolved `blockingSignal` remains, or current settlement or fence state makes progression unsafe
- `supervisor_required` if the only legal next step is a governed override or cosign and no valid `PharmacyOverrideAuthorityProof` currently satisfies it
- `review_required` if no hard stop applies but required freshness is `stale`, any `reviewSignal` remains unresolved, or `CrossLineImpactDigest` changed since the last pharmacist acknowledgement
- `verified` only when required evidence is complete, freshness is not `stale` or `unavailable`, no unresolved blocking or review signal remains, and any linked command settlement is converged
- otherwise the checkpoint remains `in_review`; unopened checkpoints remain `not_started`

Rail-row presentation rules:

- every rail entry must show the checkpoint label, state pill, unresolved-signal count, and oldest required-evidence age or freshness text
- case-level checkpoint roll-up uses precedence `blocked > supervisor_required > review_required > in_review > verified > not_started`
- `handoff_ready` may be `verified` only when every medication line is `verified` or governed-resolved, each supplied line has a bound `SupplyComputation`, required patient communication deltas have been previewed, inventory freshness is not `stale`, and no unresolved `PharmacyActionSettlement`, watch-window blocker, or closure blocker remains

### 5. Medication line-item cards

Resolve the card model with these mandatory contracts:

1. every card must be pinned to one authoritative truth set through `lineItemVersionRef`, `checkpointProjectionRef`, `inventoryTruthRef`, `policyBundleRef`, `supplyComputationRef`, and `reviewSessionRef` so live refresh cannot silently change the meaning of the active review
2. `highest active caution summary` is too lossy on its own; cards must render typed signal provenance separating `blockingSignal`, `reviewSignal`, `informationSignal`, and `verifiedEvidence`, each with source, freshness, and affected field refs
3. each card must own one `LineInterventionSession` carrying `draftRef`, `commandFenceEpoch`, `selectedStockAnchorRef`, `clarificationThreadRef`, `returnCheckpointRef`, and `resumeSelectionRef` so clarification, substitution, or partial-supply work survives soft navigation without leaking onto another line
4. fulfilment math must be rendered through a normalized `SupplyComputation` that shows prescribed quantity, pack basis, quantity delta, split-pack remainder, substitution delta, and patient-facing consequence before any commit-worthy action is armed
5. every card must expose `CrossLineImpactDigest` whenever its verification or intervention would change sibling medication state, case-level checkpoint status, or handoff readiness; multi-line dependencies may not stay implicit behind a single-card UI

**MedicationValidationCardProjection**
`lineItemRef`, `lineItemVersionRef`, `checkpointProjectionRef`, `inventoryTruthRef`, `policyBundleRef`, `supplyComputationRef`, `reviewSessionRef`, `selectedStockAnchorRef`, `clarificationThreadRef`, `crossLineImpactDigestRef`, `settlementDigestRef`, `dominantActionRef`, `renderedAt`

**SupplyComputation**
`supplyComputationId`, `lineItemRef`, `baseUnit`, `prescribedBaseUnits`, `dailyBaseUnits`, `selectedBaseUnits`, `coverageRatio`, `remainingBaseUnits`, `daysCovered`, `splitPackRemainderBaseUnits`, `substitutionEquivalenceClass`, `instructionDeltaRef`, `computationState = exact | short | excess | non_comparable`, `computedAt`

`SupplyComputation` rules:

- `coverageRatio = selectedBaseUnits / prescribedBaseUnits` when both are known on the same normalized base unit
- `remainingBaseUnits = max(prescribedBaseUnits - selectedBaseUnits, 0)`
- `daysCovered = floor(selectedBaseUnits / dailyBaseUnits)` when a safe daily basis exists; otherwise present units only and mark the days field unavailable
- when substitution changes strength, form, or pack basis, the computation must surface the conversion basis and approval burden inline before any command fence can arm

Each medication line item should render as a `MedicationValidationCardProjection`.

Collapsed state must show:

- medicine, strength, and form
- requested quantity and intended supply window on the normalized unit basis
- current checkpoint state with freshness posture
- highest active caution summary with typed provenance
- whether stock is already reserved and whether the reservation is still valid
- cross-line dependency badge when other medication lines are affected

Expanded state must show:

- directions, dose math, and normalized `SupplyComputation`
- allergy, interaction, duplication, vulnerability, and legality cues with source timestamps
- formulary or substitution policy cues, override class, and approval burden where applicable
- selected pack or lot summary with reservation lease status
- clarifications or intervention notes with active `LineInterventionSession` state
- `CrossLineImpactDigest` and handoff consequence preview when applicable
- the single next safe action for that line item

Rules:

- only one card may hold an active `LineInterventionSession` in routine sequential mode unless compare or supervisor posture is explicitly entered
- the active card must never disappear during live updates; if stock, evidence, or policy changes invalidate the current card, keep it visible, mark it invalidated in place, explain why, and freeze commit paths until the card is rebound or explicitly re-reviewed
- line-level commands and fences must settle inline on the same card; success, failure, and stale-recoverable outcomes may not jump focus to another medication line
- the shell may auto-advance to the next unresolved line only after the current line is settled and `CrossLineImpactDigest` is clear or explicitly acknowledged

Sequential line flow:

- the pharmacist opens one line at its current unresolved checkpoint and completes that checkpoint before another line becomes dominant
- if stock, substitution, or partial-supply work is needed, the shell enters `validationMode = compare` bound to the same `lineItemRef` and `checkpointRef`
- clarification, compare, fence, and settlement all return to the same card and same checkpoint summary rather than dropping the user into a generic resolve page
- only after the card is converged or explicitly parked may the shell offer the next unresolved line as the dominant secondary action

## Inventory management architecture

### 6. Inventory truth panel

Build a dedicated `InventoryTruthPanel` as a bounded support region, not a separate page-first workflow.

Required fields per inventory position:

- product identity and pack size
- available quantity and reserved quantity
- batch or lot reference where governed
- expiry band
- storage requirement including cold-chain state where relevant
- controlled-drug or governed-stock flag where relevant
- location or bin reference
- last verified timestamp
- freshness confidence

Required state classes:

- `exact_match_available`
- `split_pack_available`
- `alternative_pack_available`
- `near_expiry`
- `quarantine`
- `stale_snapshot`
- `out_of_stock`
- `supervisor_hold`

The panel must default to the currently selected medication and selected stock anchor. Multi-product comparison is an explicit mode, not the resting state.

### 6A. Inventory comparison and supply-delta posture

Comparison must render as one `InventoryComparisonWorkspace` inside the promoted support region.

Add the candidate contract:

**InventoryComparisonCandidateProjection**
`candidateRef`, `lineItemRef`, `equivalenceClass = exact | therapeutic_substitute | pack_variant | partial_supply | no_supply`, `inventoryTruthRef`, `freshnessState`, `expiryBand`, `packBasisRef`, `selectedPackCount`, `selectedBaseUnits`, `coverageRatio`, `remainingBaseUnits`, `daysCovered`, `substitutionPolicyState`, `approvalBurdenRef`, `patientCommunicationDeltaRef`, `handoffConsequenceRef`, `reservationState`, `rank`, `rankReasonRef`

Rules:

- the prescribed product is always shown as the baseline candidate when governed inventory data exists, even when unavailable
- comparison rows must align freshness, expiry, normalized units, coverage, approval burden, and patient communication consequence on one scan line; pack text alone is never sufficient
- substitution and partial-supply compare must always include one explicit non-release baseline such as `clarify_before_release` or `do_not_supply_yet`
- only one candidate may be primary-selected at a time; if the selected candidate invalidates, keep it visible as a read-only stub with the invalidation reason beside the nearest safe alternative
- compare posture may not arm a fence until the chosen candidate has an active `InventoryComparisonFence` and rendered `SupplyComputation`

### 7. Stock-aware fulfilment rules

The console must prevent the following failure patterns:

- silent release against stale stock truth
- silent substitution because the preferred product is unavailable
- hidden near-expiry supply when a fresher governed option exists
- split-pack selection without explicit quantity maths and handoff impact preview
- uncontrolled drift between reserved stock and the active medication line

Design rules:

- stale inventory disables release and substitution commands until refreshed or explicitly escalated through policy
- selecting a stock lot writes a local acknowledgement immediately and preserves the chosen row as a `SelectedAnchor`
- if the selected lot becomes unavailable, keep it visible, mark it invalidated, and show nearest valid alternatives inline
- reserve, unreserve, and swap actions must happen inline with local acknowledgement, not through detached modal flows
- when a near-expiry lot outranks a fresher lot under policy, the panel must label it `policy_preferred` and still show the fresher alternative beside it
- partial-supply options must show `remainingBaseUnits`, `daysCovered`, and required patient-communication delta before reservation or release

Freshness cue rules:

- `freshnessRatio = clamp((now - verifiedAt) / max(1, staleAfterAt - verifiedAt), 0, 2)`
- `fresh` when `freshnessRatio < 0.67`, `aging` when `0.67 <= freshnessRatio < 1`, `stale` when `freshnessRatio >= 1`, and `unavailable` when timestamp or trust data is missing
- reaching `hardStopAfterAt` forces `blocked` regardless of local cache age or prior selection

## Error prevention and safety protocol UX

### 8. Safety signal classes

Use typed, visually distinct signal classes:

- `hard_stop`
- `review_required`
- `information`
- `verified`
- `awaiting_external`

Map them consistently across line items, checkpoints, queue rows, and handoff status.

Hard-stop examples include:

- patient or prescriber mismatch
- missing legal prescription fields
- allergy or contraindication conflict requiring intervention
- expired or quarantined stock
- unresolved controlled-drug discrepancy
- unresolved supervisor requirement on a governed action

Review-required examples include:

- near-expiry but still policy-valid stock
- duplicate therapy requiring pharmacist judgement
- partial supply with patient communication impact
- stale but non-critical contextual evidence

### 9. Command fences and override paths

All irreversible actions must use an inline `CommandFence` inside `DecisionDock`.

Resolve the fence layer with these mandatory controls:

1. the fence must bind one typed session to the exact line, checkpoint, mission token, route intent, and expected truth snapshot being committed
2. override paths must prove structured reason, no-self-approval, supervisor burden, approval scope, and expiry through one explicit authority object
3. an armed fence must declare how live drift in line truth, stock truth, policy, or sibling-line consequence invalidates the pending command without dropping context
4. the pharmacist must see one explicit blast-radius digest showing which sibling lines, patient communications, handoff state, or closure blockers will change if the command succeeds
5. post-commit settlement must stay inside one fence-specific observation window that distinguishes local acceptance from authoritative downstream convergence

Add the supporting fence contracts:

**PharmacyCommandFenceSession**
`commandFenceSessionId`, `actionType`, `missionTokenRef`, `routeIntentRef`, `lineItemRef`, `checkpointRef`, `caseVersionRef`, `lineItemVersionRef`, `inventoryComparisonFenceRef`, `expectedPolicyBundleRef`, `actionScopeRef`, `decisionDockLeaseRef`, `armedAt`, `expiresAt`, `sessionState = drafting | armed | invalidated | committing | settled`

`PharmacyCommandFenceSession` is the authoritative identity of one irreversible commit attempt. Re-rendering `DecisionDock` must not silently retarget the command to a different line, checkpoint, or policy snapshot.

**PharmacyOverrideAuthorityProof**
`overrideAuthorityProofId`, `commandFenceSessionRef`, `overrideClassRef`, `structuredReasonRef`, `freeTextSupplementRef`, `requiredSupervisorRoleRef`, `cosignActorRef`, `approvalBundleRef`, `noSelfApprovalState`, `expiresAt`, `proofState = not_required | pending | satisfied | expired | denied`

`PharmacyOverrideAuthorityProof` governs every exceptional bypass. Structured reason capture is necessary but not sufficient without explicit approval scope, cosign burden, and no-self-approval enforcement.

**PharmacyFenceImpactDigest**
`fenceImpactDigestId`, `commandFenceSessionRef`, `affectedLineRefs[]`, `crossLineImpactDigestRef`, `patientCommunicationTemplateRef`, `handoffStateDeltaRef`, `closureBlockerDeltaRef`, `auditArtifactRefs[]`, `previewState = complete | partial | stale`

`PharmacyFenceImpactDigest` is the blast-radius preview for the commit. It must explain what changes beyond the active card before the fence can be confirmed.

**PharmacyFenceInvalidationSignal**
`fenceInvalidationSignalId`, `commandFenceSessionRef`, `cause = mission_drift | route_intent_drift | line_truth_drift | inventory_drift | policy_drift | sibling_impact_drift | approval_expired`, `preservedPreviewRef`, `observedAt`, `rebindState = review_required | recompare_required | reacquire_override | abandon_commit`

`PharmacyFenceInvalidationSignal` preserves context when truth moves underneath an armed fence. Invalidated commits must freeze in place, explain why, and retain the prior preview as read-only evidence.

**PharmacyFenceSettlementWindow**
`fenceSettlementWindowId`, `commandFenceSessionRef`, `mutationGateRef`, `localAckAt`, `canonicalSettlementRef`, `pharmacyConsoleContinuityEvidenceProjectionRef`, `projectionConvergenceRef`, `windowState = awaiting_gate | accepted_pending_projection | converged | reconcile_required | failed`, `closedAt`

`PharmacyFenceSettlementWindow` separates local click acceptance from authoritative case, dispatch, or outcome convergence. The fence is not truly complete until the canonical settlement and projection truth align.

Actions that require a fence:

- approve substitution
- record partial supply
- release to collection or delivery handoff
- mark ready for outcome or closure
- reopen after apparent completion
- bypass a normally required checkpoint under governed override policy

Fence rules:

- show what will change, what remains blocked, and what communication or audit consequence follows
- never rely on a destructive-looking modal stack for the final confirmation
- use structured override reasons before free text
- require second acknowledgement or supervisor cosign where policy class demands it
- preserve the active card and checkpoint while the command is pending or fails
- every irreversible commit must be armed through one `PharmacyCommandFenceSession`; if `lineItemVersionRef`, `caseVersionRef`, `routeIntentRef`, or `expectedPolicyBundleRef` drifts before commit, the session invalidates rather than silently rebinding
- any override, checkpoint bypass, or exceptional substitution must prove `PharmacyOverrideAuthorityProof.proofState = satisfied` before commit; expired or self-approved proof must invalidate the fence in place
- the fence must render one `PharmacyFenceImpactDigest` before confirmation so sibling-line changes, patient communication consequences, handoff posture, and closure blockers are visible at commit time
- live stock, policy, mission, or sibling-impact drift must emit `PharmacyFenceInvalidationSignal`; the shell must keep the prior fence preview visible, freeze commit, and move to explicit re-review rather than dismissing the fence
- fence completion must settle through `PharmacyFenceSettlementWindow`; local acknowledgement may advance to `accepted_pending_projection`, but final success text is forbidden until `windowState = converged` and the linked `PharmacyConsoleContinuityEvidenceProjection` still validates the same case and mission scope
- bind the fence to the active `PharmacyMissionToken` and reject silent commit if mission scope or policy version has drifted
- route every irreversible commit through the canonical `ScopedMutationGate` with the current `LineageFence.currentEpoch`; local UI state may not advance durable handoff, reopen, or close posture on its own
- require a fresh `InventoryComparisonFence` for substitution, partial-supply, and reserve-or-release inventory actions
- render resulting `PharmacyActionSettlement` state inline from the active `ScopedMutationGate` plus the canonical `PharmacyDispatchSettlement` or `PharmacyOutcomeSettlement` so local acknowledgement cannot be misread as final release, reservation, reopen, or closure

### 9A. Settlement visibility and reconcile posture

Add one shared display contract:

**PharmacySettlementVisibilityDigest**
`settlementVisibilityDigestId`, `subjectRef`, `localAckAt`, `mutationGateRef`, `canonicalSettlementRef`, `continuityEvidenceRef`, `displayState = hidden | pending_local | pending_remote | settled | reconcile_required | failed`, `reconcileReasonRef`, `lastConsistentArtifactRef`, `updatedAt`

Rules:

- queue row, active medication card, compare workspace, `DecisionDock`, handoff board, and watch-window summary must all bind to the same `PharmacySettlementVisibilityDigest`
- `pending_local` and `pending_remote` use neutral pending semantics only; success colour, closure language, and completion icons are forbidden
- `settled` is legal only after canonical settlement, current continuity evidence, and the current projection bundle agree on the same subject and fence epoch
- `reconcile_required` keeps the last consistent artifact visible beside the contradictory or incomplete projection and promotes exactly one recovery action
- settlement copy must name what is pending: `local acknowledgement recorded`, `dispatch settling`, `outcome settling`, or `reconcile required`; generic `working` copy is not precise enough
- when a referral is pending, settlement visibility must name whether the shell has only transport acceptance, provider acceptance, or authoritative proof; `referred`, success iconography, and handoff-complete language are illegal until `PharmacyDispatchTruthProjection.authoritativeProofState = satisfied`
- when outcome evidence is weak, contradictory, or unmatched, settlement visibility must surface the active `PharmacyOutcomeReconciliationGate`, confidence band, and closure blocker; queue rows, handoff posture, and completion language may not read as resolved until `PharmacyOutcomeTruthProjection.outcomeTruthState = settled_resolved` and the gate is absent or resolved

### 10. Clarification and intervention patterns

When prescription truth is incomplete or unsafe, the next action must narrow to one of these governed paths:

- `request_clarification`
- `propose_substitution`
- `record_partial_supply_plan`
- `escalate_to_supervisor`
- `return_to_practice`

Do not present a generic free-text escape hatch as the primary route.

Each path should open in a bounded side stage with:

- the exact blocker or caution summary
- the allowed intervention choices
- the required communication target
- the minimum structured note fields
- the expected return point after completion

### 10A. Handoff readiness and release posture

Create a `HandoffReadinessBoard` for `/handoff` and any inline release promotion.

Required sections:

- per-line release basis showing supplied, substituted, partially supplied, or held lines with the bound `SupplyComputation`
- destination and method summary for `collection`, `delivery`, or `onward_return`
- patient instruction and communication preview including any substitution or partial-supply delta
- remaining blockers, approval burden, and watch-window triggers
- authoritative settlement and watch-window status

Rules:

- `/handoff` is a promoted same-shell posture, not a detached release page; `CasePulse`, the active checkpoint summary, and `DecisionDock` remain visible
- no handoff summary may hide unsupplied or exception lines; excluded lines must remain listed with reason and return path
- `release_for_handoff` remains inside `DecisionDock`; the board is a proof surface, not a second action dock
- provisional release keeps the release basis summary, patient communication preview, and watch-window banner visible until `PharmacyDispatchSettlement` converges
- missed collection, delivery failure, or onward-return rejection must reopen the same board with diff markers rather than creating a new release card

## Visual indicators and micro-interactions

### 11. Low-noise visual language

The console should feel deliberate and quiet.

Use these persistent indicator patterns:

- one shared safety and freshness strip at shell level
- compact state pills on queue rows and line items
- a single anchor halo for the currently active medication or stock lot
- explicit text labels on severity markers rather than colour alone
- restrained progress semantics through checkpoint completion rather than decorative charts

Avoid:

- stacked banners for non-blocking states
- flashing urgency cues
- simultaneous promotion of evidence, chronology, and inventory panels
- removing a user’s selected item before they can understand why it changed

### 12. Required micro-interactions

Use small, explanatory interactions that reduce recovery cost:

- when a checkpoint verifies, collapse it into a calm summary pill and advance focus to the next unresolved checkpoint
- when a stock row is reserved, acknowledge inline on that row and in `DecisionDock`, not via a distant toast
- when live data invalidates the current choice, pin the invalidated choice in place, explain the delta, and reveal alternatives beside it
- when a supervisor cosign is needed, arm the fence in place and keep the originating action visible
- when the user returns from clarification, reopen the exact line item and checkpoint they left
- when a fenced action is only locally acknowledged, show `pending settlement` in the row and active card until remote truth lands or reconcile is required

## Workflow continuity and live-change handling

### 13. Continuity rules

The Pharmacy Console must remain shell-stable across these child views:

- `validate`
- `inventory`
- `resolve`
- `handoff`
- `assurance`

Changing child view must not reset the queue, case pulse, active line item, or selected stock anchor when the same `entityContinuityKey` remains active.

Mission continuity is stricter than route continuity. Child-view changes may not silently swap `serviceLane`, `facilityScopeRef`, or `actingRoleRef` underneath the active `PharmacyMissionToken`. When that scope changes, the shell remains on the same continuity key but drops into a review-required posture until the pharmacist explicitly re-binds the mission token.

### 14. Live update rules

Inventory, queue, and outcome signals may update live, but they must respect `FocusIntegrityGuard` and the quiet mission model.

Rules:

- buffer disruptive queue reordering while the user is scanning, typing, comparing, or confirming
- preserve active drafts during inventory refresh, outcome arrival, or policy note updates
- promote only the region directly affected by a newly material blocker
- downgrade shell freshness explicitly when stock truth or external confirmation is stale
- return to the last quiet posture after the pharmacist acknowledges the change unless the case remains blocked
- keep `QueueAnchorLease` intact while settlement is pending, and do not rebind the active row automatically if remote outcome moves the case to another lane
- invalidate `InventoryComparisonFence` immediately on lot, expiry, quarantine, or substitution-policy drift and preserve the previous candidate set as explainable read-only evidence
- keep `PharmacyHandoffWatchWindow` active after release until collection, delivery, or onward-return risk has cleared, with re-entry to the same shell if late signals reopen work
- if a referral-assurance case's `PharmacyConsentCheckpoint` falls out of `satisfied`, promote the checkpoint region in place, preserve the last safe dispatch or outcome summary, and block calm release, referral-assurance, or success wording until renewal or withdrawal reconciliation settles

## Route and projection contract

### 15. Route family

The recommended route family is:

- `/workspace/pharmacy`
- `/workspace/pharmacy/:pharmacyCaseId`
- `/workspace/pharmacy/:pharmacyCaseId/validate`
- `/workspace/pharmacy/:pharmacyCaseId/inventory`
- `/workspace/pharmacy/:pharmacyCaseId/resolve`
- `/workspace/pharmacy/:pharmacyCaseId/handoff`
- `/workspace/pharmacy/:pharmacyCaseId/assurance`

Optional deep-link anchors may target the active medication or checkpoint, for example `?focus=line-item:{lineItemId}` or `?checkpoint=clinical_safety`.

Deep links that open resolve, inventory, or handoff work must also carry enough route intent to restore `missionTokenRef`, `queueAnchorLeaseRef`, and any active `handoffWatchWindowRef`. If the referenced mission token or watch window is no longer valid, the shell must reopen in review-required posture rather than silently rebinding to current default scope.

### 16. Front-end projection set

Create read models shaped for the console rather than making the browser compose them ad hoc:

- `PharmacyConsoleSummaryProjection`
- `PharmacyConsoleWorklistProjection`
- `PharmacyCaseWorkbenchProjection`
- `PharmacyMissionProjection`
- `MedicationValidationProjection`
- `InventoryTruthProjection`
- `InventoryComparisonProjection`
- `SafetyCheckpointProjection`
- `InterventionDecisionProjection`
- `PharmacyHandoffProjection`
- `PharmacyHandoffWatchProjection`
- `PharmacyActionSettlementProjection`
- `PharmacyChoiceTruthProjection`
- `PharmacyDispatchTruthProjection`
- `PharmacyOutcomeTruthProjection`
- `PharmacyConsentCheckpointProjection`
- `PharmacyConsoleContinuityEvidenceProjection`
- `PharmacyAssuranceProjection`

Each projection must expose explicit freshness, trust, and actor metadata so the UI never has to infer them from raw transport state. Worklist and handoff projections must also expose lease, settlement, and watch-window metadata so the browser can preserve the active shell without inventing hidden client-only rules. `PharmacyActionSettlementProjection` must surface `canonicalSettlementType`, `canonicalSettlementRef`, `mutationGateRef`, and `fenceEpoch` so dispatch and outcome truth cannot split between the pharmacy UI and the Phase 6 case model. `PharmacyChoiceTruthProjection` must surface `choiceSessionRef`, `choiceProofRef`, `choiceDisclosurePolicyRef`, `directorySnapshotRef`, `directoryTupleHash`, `visibleProviderRefs`, `recommendedProviderRefs`, `warningVisibleProviderRefs`, `suppressedUnsafeSummaryRef`, `selectedProviderRef`, `selectedProviderExplanationRef`, `selectedProviderCapabilitySnapshotRef`, `patientOverrideRequired`, `overrideAcknowledgementRef`, and `selectionBindingHash` so any waiting-for-choice or provider-change surface explains the same order, recommendation frontier, warning burden, suppressed-unsafe summary, and discovery tuple the patient saw. Console-local sorting, `open now` shortcuts, or convenience-only chips may cluster the current proof, but they may not invent a second ranking or hide a valid provider. `PharmacyDispatchTruthProjection` must surface `dispatchAttemptRef`, `dispatchPlanRef`, `transportAssuranceProfileRef`, `dispatchAdapterBindingRef`, `dispatchPlanHash`, `packageHash`, `outboundReferenceSetHash`, `transportAcceptanceState`, `providerAcceptanceState`, `authoritativeProofState`, `proofRiskState`, `proofDeadlineAt`, `dispatchSettlementRef`, and `currentRecoveryOwnerRef` so the console can show exactly why a referral is pending or disputed. Transport acceptance, provider acceptance, or mailbox delivery may paint `pending_remote`, but they may not tint queue rows, handoff posture, or settlement copy as final release until authoritative proof is satisfied for the current attempt. `PharmacyOutcomeTruthProjection` must surface `latestOutcomeSettlementRef`, `outcomeReconciliationGateRef`, `outcomeTruthState`, `matchConfidenceBand`, `manualReviewState`, and `closeEligibilityState` so the console can distinguish settled resolution from review debt, unmatched outcomes, and reopen-for-safety posture. Weak-match, unmatched, or contradictory outcome evidence may not tint queue rows, handoff posture, `DecisionDock`, or closure posture as resolved until `PharmacyOutcomeTruthProjection.outcomeTruthState = settled_resolved` and the linked gate is absent or resolved. `PharmacyConsentCheckpointProjection` must surface `consentCheckpointRef`, `consentRecordRef`, `checkpointState`, `blockingReasonCodes`, `selectedProviderRef`, `pathwayCode`, `referralScopeHash`, `latestDispatchSettlementRef`, and `latestRevocationRecordRef` whenever the active case is a Phase 6 referral or mixed assurance surface; package presence, prior dispatch settlement, or stale route state may not be treated as authority after consent drifts. `PharmacyConsoleContinuityEvidenceProjection` must surface the current `PharmacyContinuityEvidenceProjection` linkage and validation state so the browser can fail closed when same-shell continuity proof is stale or blocked.

### 17. Command contract

Required commands:

- `claim_case`
- `set_active_line_item`
- `verify_checkpoint`
- `reserve_inventory_position`
- `release_inventory_position`
- `request_clarification`
- `record_substitution_plan`
- `record_partial_supply_plan`
- `request_supervisor_cosign`
- `confirm_handoff_ready`
- `release_for_handoff`
- `reopen_for_safety_review`

All commands must carry `missionTokenId`; stock-sensitive and intervention commands must also carry `inventoryComparisonFenceId` when one is required; reopen and post-release recovery commands must carry `handoffWatchWindowId` when invoked inside an active watch window.

All commands must also carry the active mutation-gate envelope and current fence epoch required by Phase 6. Dispatch and handoff-affecting commands must settle through `PharmacyDispatchSettlement`; outcome, reopen, and close-affecting commands must settle through `PharmacyOutcomeSettlement`; the shell may only present final case progression after those canonical settlements, `PharmacyConsoleContinuityEvidenceProjection`, and the corresponding projections agree.

Any dispatch, withdrawal, or referral-assurance command exposed in assurance mode must also carry the active `consentCheckpointId`. If the checkpoint is not `satisfied`, the shell must fail closed into in-place renewal or withdrawal reconciliation instead of optimistic retry or quiet success copy.

## Accessibility and verification

### 18. Accessibility contract

The console must be keyboard-first, screen-reader legible, barcode-entry safe, and bound to `accessibility-and-content-system-contract.md`.

Requirements:

- no colour-only severity communication
- deterministic tab order from queue row to active card to decision dock
- screen-reader announcements for checkpoint state changes, blocker arrival, and invalidated stock anchors
- focus protection during barcode entry, note composition, and dual-check confirmation
- checkpoint, supply, and compare rows must expose accessible text for normalized units, days covered, and substitution or partial-supply deltas
- `mission_stack` fold controls and checkpoint navigation must preserve focus order and keep the active line item reachable without horizontal-scroll traps
- sticky top summaries and bottom docks must remain reachable with software keyboard, safe-area insets, and zoomed text without obscuring blocker or settlement copy
- large enough hit areas for gloved or rapid operational use on touch-capable devices
- the queue spine, validation board, checkpoint rail, stock comparison surface, command fence, and handoff watch window must each declare `AccessibleSurfaceContract`, `KeyboardInteractionContract`, `FocusTransitionContract`, `AssistiveAnnouncementContract`, and `FreshnessAccessibilityContract`
- pharmacy route families must also publish one `AccessibilitySemanticCoverageProfile` bound to the current `AutomationAnchorProfile`, `SurfaceStateSemanticsProfile`, and `DesignContractPublicationBundle`; barcode, dual-check, compare, and handoff work may not stay calm or actionable if semantic coverage drifts under `mission_stack`, safe-area or host resize, reduced motion, or buffered queue replay
- barcode-entry and dual-check modes must suppress non-critical live announcements and buffer routine queue churn until the focused safety task is complete or explicitly paused
- `PharmacyFenceInvalidationSignal`, blocked release, supervisor-cosign failure, and reopen recovery must expose one in-place `FormErrorSummaryContract` or recovery summary with explicit repair action rather than toast-only failure
- expiry of `PharmacyMissionToken`, `InventoryComparisonFence`, or handoff watch posture must resolve through `TimeoutRecoveryContract`, preserving the active line, last safe preview, and next valid recovery action in the same shell

### 19. Verification contract

Ship Playwright coverage for:

- quiet default render with only one promoted support region
- sequential checkpoint progression across multiple medication line items
- invalidated stock anchor preservation during live updates
- stale inventory blocking release until refreshed or escalated
- structured override path requiring supervisor cosign where configured
- compare workspace showing exact, substitute, partial-supply, and non-release baselines with stable normalized math
- return-to-quiet after blocker or compare resolution
- reopen into the same shell after bounce-back or outcome dispute
- `mission_stack` fold and unfold preserving the active line item, expanded checkpoint, stock anchor, queue anchor, and visible blocker stub
- narrow checkpoint summary strip plus full-rail reveal without horizontal scroll or focus loss
- stale `PharmacyMissionToken`, `InventoryComparisonFence`, or continuity evidence downgrading the current case shell in place instead of ejecting the pharmacist to a generic error page
- empty-lane and filter-exhausted states rendering through the same shell without decorative filler or hidden recovery posture
- synchronized settlement visibility across queue row, active card, `DecisionDock`, and handoff board
- pending dispatch, release, reopen, or handoff settlement preventing premature quiet success or closure wording in the shell, queue row, and handoff summary
- non-satisfied `PharmacyConsentCheckpointProjection` blocking quiet referral-assurance posture until renewal or withdrawal reconciliation settles
- handoff board reopening inside the same shell when a watch-window trigger fires
- keyboard-only completion of a validation-to-handoff path

Stable, case-safe automation anchors must exist for:

- `pharmacy-shell`
- `pharmacy-queue-spine`
- `pharmacy-validation-board`
- `pharmacy-status-strip`
- `pharmacy-decision-dock`
- `pharmacy-context-region`
- `pharmacy-compare-workspace`
- `pharmacy-handoff-board`
- `pharmacy-active-line-item`
- `pharmacy-active-checkpoint`
- `pharmacy-recovery-state`

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `phase-6-the-pharmacy-loop.md`
- `staff-operations-and-support-blueprint.md`
- `accessibility-and-content-system-contract.md`
- `ux-quiet-clarity-redesign.md`
