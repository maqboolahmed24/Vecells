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
`entityContinuityKey`, `activeQueueLane`, `activePharmacyCaseRef`, `activePrescriptionRef`, `activeLineItemRef`, `activeCheckpointRef`, `activeStockAnchorRef`, `workbenchPosture = quiet | blocker_promoted | compare_promoted | audit_promoted`, `validationMode = sequential | compare | exception | handoff | assurance`, `commandFenceState = idle | armed | awaiting_second_ack | committing`, `inventoryFreshnessState = fresh | refreshing | stale | unavailable`, `focusProtectionMode = normal | composing | barcode_entry | note_entry | dual_check`, `resumeTargetRef`

Semantics:

- is implemented inside the existing pharmacy shell rather than as a detached product
- defaults to `layoutTopology = two_plane` and `clarityMode = essential`
- promotes to `three_plane` only for compare, blocker, or audit-heavy work
- treats the active medication line, selected stock lot, and chosen intervention path as `SelectedAnchor` objects
- must restore the last quiet posture after blocker or compare work resolves unless the user explicitly pinned a richer view
- must preserve queue position, scroll, active draft input, and selected anchors across soft child-view changes

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

Rows must stay visually stable while live ranking changes are buffered. If the pharmacist has opened a case, the active row remains pinned until the current checkpoint, note, scan, or confirmation step finishes.

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

### 3. Support regions

Only one support region may auto-promote at a time.

Promotion priority:

1. trust or legality blocker -> `EvidencePrism`
2. stock or substitution compare task -> bounded `InlineSideStage`
3. material chronology change or reopen -> `StateBraid`
4. policy or SOP dependency -> `ContextConstellation`
5. audit review -> bounded assurance drawer

When a temporary promotion resolves, the shell must return to the last quiet posture with the active medication and checkpoint preserved.

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

### 5. Medication line-item cards

Each medication line item should render as a `MedicationValidationCard`.

Collapsed state must show:

- medicine, strength, and form
- requested quantity and intended supply window
- current checkpoint state
- highest active caution summary
- whether stock is already reserved

Expanded state must show:

- directions and dose math
- allergy, interaction, duplication, and vulnerability cues
- formulary or substitution policy cues where applicable
- selected pack or lot summary
- clarifications or intervention notes
- the single next safe action for that line item

The active card must never disappear during live updates. If stock, evidence, or policy changes invalidate the current card, keep it visible, mark it invalidated in place, explain why, and open the nearest safe alternative path beside it.

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

## Workflow continuity and live-change handling

### 13. Continuity rules

The Pharmacy Console must remain shell-stable across these child views:

- `validate`
- `inventory`
- `resolve`
- `handoff`
- `assurance`

Changing child view must not reset the queue, case pulse, active line item, or selected stock anchor when the same `entityContinuityKey` remains active.

### 14. Live update rules

Inventory, queue, and outcome signals may update live, but they must respect `FocusIntegrityGuard` and the quiet mission model.

Rules:

- buffer disruptive queue reordering while the user is scanning, typing, comparing, or confirming
- preserve active drafts during inventory refresh, outcome arrival, or policy note updates
- promote only the region directly affected by a newly material blocker
- downgrade shell freshness explicitly when stock truth or external confirmation is stale
- return to the last quiet posture after the pharmacist acknowledges the change unless the case remains blocked

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

### 16. Front-end projection set

Create read models shaped for the console rather than making the browser compose them ad hoc:

- `PharmacyConsoleSummaryProjection`
- `PharmacyConsoleWorklistProjection`
- `PharmacyCaseWorkbenchProjection`
- `MedicationValidationProjection`
- `InventoryTruthProjection`
- `SafetyCheckpointProjection`
- `InterventionDecisionProjection`
- `PharmacyHandoffProjection`
- `PharmacyAssuranceProjection`

Each projection must expose explicit freshness, trust, and actor metadata so the UI never has to infer them from raw transport state.

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

All commands must produce local acknowledgement first, remote settlement second, and explicit failure recovery in the same shell.

## Accessibility and verification

### 18. Accessibility contract

The console must be keyboard-first, screen-reader legible, and barcode-entry safe.

Requirements:

- no colour-only severity communication
- deterministic tab order from queue row to active card to decision dock
- screen-reader announcements for checkpoint state changes, blocker arrival, and invalidated stock anchors
- focus protection during barcode entry, note composition, and dual-check confirmation
- large enough hit areas for gloved or rapid operational use on touch-capable devices

### 19. Verification contract

Ship Playwright coverage for:

- quiet default render with only one promoted support region
- sequential checkpoint progression across multiple medication line items
- invalidated stock anchor preservation during live updates
- stale inventory blocking release until refreshed or escalated
- structured override path requiring supervisor cosign where configured
- return-to-quiet after blocker or compare resolution
- reopen into the same shell after bounce-back or outcome dispute
- keyboard-only completion of a validation-to-handoff path

## Linked documents

This blueprint is intended to be used with:

- `platform-frontend-blueprint.md`
- `phase-6-the-pharmacy-loop.md`
- `staff-operations-and-support-blueprint.md`
- `ux-quiet-clarity-redesign.md`
