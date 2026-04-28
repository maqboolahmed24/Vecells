# 352 Pharmacy Outcome Ingest And Truth API

Task `352` publishes one canonical service surface from `packages/domains/pharmacy/src/phase6-pharmacy-outcome-reconciliation-engine.ts`.

## Main service

`createPhase6PharmacyOutcomeReconciliationService(...)` returns the backend authority for:

- `previewNormalizedOutcome(command)`
- `matchOutcomeEvidence(command)`
- `ingestOutcomeEvidence(command)`
- `resolveOutcomeReconciliationGate(command)`
- `getOutcomeTruthProjection(pharmacyCaseId)`
- `getOutcomeReviewDebt(pharmacyCaseId?)`
- `getOutcomeReviewCloseBlockPosture(pharmacyCaseId)`

## Ingest command

Required fields:

- `sourceType`
- `receivedAt`
- `rawPayload`
- `actorRef`
- `commandActionRecordRef`
- `commandSettlementRecordRef`
- `reasonCode`

Optional fields:

- `sourceMessageKey`
- `parserVersion`
- `senderIdentityRef`
- `inboundTransportFamily`
- `inboundChannelRef`

## Preview and match responses

Preview returns:

- parsed envelope fields
- normalized outcome evidence
- source provenance
- replay decision

Match returns the preview bundle plus:

- best candidate case
- optional runner-up
- `PharmacyOutcomeMatchScorecard`
- final `matchState`

These calls are safe for operator preview and diagnostics because they do not mutate the pharmacy case.

## Ingest response

`ingestOutcomeEvidence(...)` returns the full canonical settlement bundle:

- persisted `OutcomeEvidenceEnvelope`
- persisted provenance
- persisted normalized evidence
- `PharmacyOutcomeIngestAttempt`
- `PharmacyOutcomeMatchScorecard`
- optional `PharmacyOutcomeReconciliationGate`
- `PharmacyOutcomeSettlement`
- `PharmacyOutcomeTruthProjection`
- optional safety assimilation settlement
- optional pharmacy-case mutation

## Reconciliation resolution command

`resolveOutcomeReconciliationGate(...)` accepts:

- `outcomeReconciliationGateId`
- `resolution`: `apply`, `reopen`, or `unmatched`
- `actorRef`
- `commandActionRecordRef`
- `commandSettlementRecordRef`
- `reasonCode`
- `recordedAt`
- optional `resolutionNotesRef`

Resolution mutates the existing gate, updates the existing ingest-attempt chain, writes a new settlement row, and publishes updated truth. It does not create a second ad hoc review data model.

## Read models

### `getOutcomeTruthProjection(pharmacyCaseId)`

Returns the current authoritative outcome truth for the case.

### `getOutcomeReviewDebt(pharmacyCaseId?)`

Returns open review items with:

- ingest attempt
- current reconciliation gate if one exists
- close-blocker refs

### `getOutcomeReviewCloseBlockPosture(pharmacyCaseId)`

Returns the authoritative close-block posture for downstream operations work:

- `closeEligibilityState`
- open-gate refs
- blocker refs

## Store and helper exports

`352` also exports:

- `createPhase6PharmacyOutcomeStore`
- `createPharmacyOutcomeSourceRegistry`
- `createPharmacyOutcomeReplayClassifier`
- `createPharmacyOutcomeEnvelopeWriter`
- `createPharmacyOutcomeMatcher`
- `createPharmacyOutcomeSafetyBridge`
- `createPharmacyOutcomeSettlementService`
- `createPharmacyOutcomeTruthProjectionBuilder`
- `defaultPharmacyOutcomeMatchingPolicy`

These exist for unit proofing and bounded composition. Downstream product work should still prefer the main reconciliation service over hand-wired partial pipelines.
