# 269 Workspace Support Metrics And Validation Spec

Visual mode: `Clinical_Beta_Validation_Deck`

## Scope

`par_269` publishes one governed frontend validation layer for the clinical workspace and support routes. It does four things together:

1. emits PHI-safe `UIEventEnvelope`
2. joins each emitted interaction to a `UITransitionSettlementRecord`
3. proves selector and route masking with `UITelemetryDisclosureFence`
4. renders one internal board for metrics, event chains, support parity, and contract drift

This is not a BI dashboard. It is an internal release-control surface.

## Route and shell law

- staff route family: `rf_staff_workspace`
- staff child route family: `rf_staff_workspace_child`
- support route family: `rf_support_ticket_workspace`
- internal board route: `/workspace/validation`
- feature flag: `phase3_internal_validation`

The board stays same-shell with the workspace family and reads one shared workspace-support observability store. Support replay, history, knowledge, read-only fallback, and restore events write into the same store and are inspected on the same board.

## Governed event families

Published action families:

- `claim`
- `release`
- `start_review`
- `request_more_info`
- `approve`
- `escalate`
- `reopen`
- `close`
- `stale_recovery`
- `handoff`
- `support_replay`
- `support_restore`
- `knowledge_reveal`
- `history_reveal`
- `callback_action`
- `message_action`
- `self_care_action`
- `admin_resolution_action`

Each family is bound to:

- route family
- event name
- allowed settlement states
- allowed disclosure class
- automation anchor
- semantic coverage reference

The published machine-readable source of truth is [269_ui_event_contract_catalog.json](/Users/test/Code/V/data/contracts/269_ui_event_contract_catalog.json).

## Required regions

The board contains:

1. `ValidationNorthStarBand`
2. `MetricGuardrailMatrix`
3. `EventChainInspector`
4. `RedactionFenceVerifier`
5. `RouteContractDriftPanel`
6. `SupportFlowIntegrityBoard`
7. `DefectAndRemediationLedger`

## Metric rules

Displayed metrics are limited to guardrail-relevant operational checks:

- queue depth by band
- median claim to review timing
- awaiting-patient dwell
- approval dwell
- duplicate rate
- reopen rate
- queue abandonment after live reorder
- keyboard-only completion rate
- focus-protection churn
- premature next-task launch rate
- support replay restore block rate
- support repair join rate

Every metric has:

- source action families
- one guardrail
- one operator use
- one published unit

The machine-readable metric table is [269_metric_definitions_and_guardrails.csv](/Users/test/Code/V/data/analysis/269_metric_definitions_and_guardrails.csv).

## Redaction and disclosure law

The board and store do not index or filter on raw patient identifiers, free text, or artifact fragments.

Allowed frontend disclosure classes:

- `descriptor_and_hash_only`
- `masked_scope_and_refs_only`

Allowed field wrappers come from `@vecells/observability`:

- `controlPlaneField`
- `publicDescriptor`
- `phiReferenceField`
- `maskedRouteField`
- `maskedContactField`

Blocked content remains blocked. The board reports blocked fences instead of quietly downgrading them.

## Settlement separation

Local acknowledgement is never flattened into success. The validation model keeps:

- `localAckState`
- `processingAcceptanceState`
- `externalObservationState`
- `projectionVisibilityState`
- `authoritativeSource`
- `authoritativeOutcomeState`
- `settlementState`

This closes the optimistic-success-metric gap.

## Defect detection

The board and validator fail loudly on:

- `missing_settlement_join`
- `duplicate_event_emission`
- `stale_route_contract_mismatch`
- `invalid_sequence_ordering`
- `disclosure_fence_failure`

The machine-readable defect description source is [269_event_quality_failure_modes.json](/Users/test/Code/V/data/analysis/269_event_quality_failure_modes.json).

## Evidence

The board links directly to Playwright proof artifacts under `/Users/test/Code/V/output/playwright`:

- `269-workspace-support-event-chains-trace.zip`
- `269-ui-event-redaction-trace.zip`
- `269-validation-board-trace.zip`
- `269-validation-board-live.png`
- `269-validation-board-support-integrity.png`

## Accessibility and operator ergonomics

The board inherits `268` shell semantics. Validation search and filters never replace the shell keyboard model; they sit inside it.

Plain-language labels follow NHS-style concise wording. Dense information follows Carbon and Linear patterns for restrained hierarchy and scan speed. Persistent left-rail filtering borrows from current Vercel internal tooling navigation.
