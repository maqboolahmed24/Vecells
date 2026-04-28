# 354 Pharmacy Operations Queue and Visibility API

## Purpose

`354` turns the Phase 6 pharmacy loop into one canonical server-side operations truth family. The authoritative runtime is `/Users/test/Code/V/packages/domains/pharmacy/src/phase6-pharmacy-operations-engine.ts`.

The module consumes:

- `346` pharmacy case lifecycle, ownership, close blockers, and confirmation gates
- `348` provider choice, consent, directory, and capability truth
- `350` dispatch attempts, proof envelopes, and continuity evidence
- `351` patient-safe status, continuity, instruction, and reachability repair truth
- `352` outcome ingest, reconciliation, settlement, and review debt truth
- `353` bounce-back, urgent return, supervisor review, and practice visibility truth

Queue semantics do not live in a browser or an ad hoc admin report. They are rebuilt from those upstream authorities on the server.

## Core services

The backend publishes the exact 354 service family required by the prompt:

- `PharmacyOperationsProjectionBuilder`
- `PharmacyPracticeVisibilityProjectionBuilder`
- `PharmacyExceptionClassifier`
- `PharmacyProviderHealthProjectionBuilder`
- `PharmacyWorklistDeltaService`
- `PharmacyOperationsQueryService`

The public factory is `createPhase6PharmacyOperationsService()`. It binds the existing pharmacy stores and exposes:

- `refreshOperationsProjections`
- queue-facing queries for the five case worklists plus provider health
- per-case practice visibility lookup
- deterministic changed-since-seen deltas

## Canonical projection set

The engine publishes these server-side projection families exactly:

- `pharmacy_active_cases_projection`
- `pharmacy_waiting_for_choice_projection`
- `pharmacy_dispatched_waiting_outcome_projection`
- `pharmacy_bounce_back_projection`
- `pharmacy_dispatch_exception_projection`
- `pharmacy_provider_health_projection`

These are not tabs over one broad list. Each family has an explicit membership law.

## Membership laws

### Active cases

`pharmacy_active_cases_projection` includes every non-closed pharmacy case and carries the minimum-necessary operational truth:

- selected provider and provider key
- dispatch posture
- latest patient instruction state
- outcome summary references
- GP action, triage re-entry, urgent return, and reachability repair posture
- close blockers and confirmation gates
- continuity, freshness, review debt, and exception posture

### Waiting for choice

`pharmacy_waiting_for_choice_projection` is built only from cases still in the choice or consent stage. It carries:

- visible choice count
- recommended frontier and warned-choice summaries
- stale directory posture
- selected-provider state
- patient override requirement
- active exception classes

It never recomputes ranking locally from UI filters.

### Dispatched waiting for outcome

`pharmacy_dispatched_waiting_outcome_projection` is built from dispatch truth plus outcome truth. It captures:

- transport mode
- dispatch proof posture
- proof deadline
- outcome truth state
- no-outcome window breach
- continuity, freshness, review debt, and exception posture

### Bounce-back

`pharmacy_bounce_back_projection` is built from the `353` bounce-back truth family and carries:

- bounce-back type
- reopened case status
- GP action requirement
- triage re-entry and urgent return posture
- reachability repair state
- supervisor review state
- loop risk and reopen priority

### Dispatch exceptions

`pharmacy_dispatch_exception_projection` is a first-class queue, not a derived label. It persists:

- the canonical active exception class set
- one primary exception class for ordering
- evidence references and rationale references
- continuity, freshness, and review debt posture
- case and queue age

### Provider health

`pharmacy_provider_health_projection` rolls current case truth up by provider key. It summarizes:

- discovery availability
- dispatch health
- acknowledgement debt
- stale proof posture
- unmatched and conflicting outcomes
- reachability repair load
- consent revoked after dispatch
- transport-specific summaries
- last-good and latest evidence timestamps

This is operational guidance with drilldown references, not a substitute for raw audit.

## Practice visibility shaping

`fetchPracticeVisibilityModel()` does not back-project from a queue row. It reloads the canonical case context and rebuilds a minimum-necessary practice view from the same truth family used for operations.

The result includes:

- selected pharmacy
- dispatch state
- latest patient instruction state
- outcome evidence summary refs
- GP action required state
- triage re-entry, urgent return, and reachability repair posture
- close blockers and confirmation gates
- continuity and freshness posture
- minimum-necessary timestamps and refs

The model deliberately excludes raw transport traces and free-form clinical payloads.

## Exception derivation

The classifier normalizes the required machine-readable taxonomy:

- `discovery_unavailable`
- `no_eligible_providers_returned`
- `dispatch_failed`
- `acknowledgement_missing`
- `outcome_unmatched`
- `no_outcome_within_configured_window`
- `conflicting_outcomes`
- `reachability_repair_required`
- `consent_revoked_after_dispatch`
- `dispatch_proof_stale`

Each class carries explicit evidence references and a rationale ref. The exception queue is therefore replayable and explainable.

## Changed-since-seen

`PharmacyWorklistDeltaService` computes deltas from durable projection ids and versions:

- new rows are `added`
- rows with a version change are `changed`
- missing rows are `removed`
- identical version pairs are `unchanged`

No socket event, browser cursor, or transient sort order can change the answer.

## Persistence surface

The 162 migration publishes:

- one table for each of the six projection families
- `phase6_pharmacy_operations_audit_event`
- `phase6_pharmacy_queue_counts_summary`
- `phase6_pharmacy_provider_health_summary`
- `phase6_pharmacy_exception_rollup_summary`

This gives later practice, operations, and pharmacy-console tracks one frozen backend surface to consume.
