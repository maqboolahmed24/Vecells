# par_146 Attachment Upload And Quarantine Design

`par_146` implements the authoritative Phase 1 attachment pipeline on the same draft lineage used by `par_144` and `par_145`.

## Scope

- direct-to-object-storage upload initiation for one opaque `attachmentPublicId`
- private quarantine storage only until scan and integrity verdicts settle
- deterministic simulator-backed scanning for clean, malware, MIME spoof, integrity failure, timeout, unreadable, and derivative-failure paths
- durable promotion plus one `AttachmentDocumentReferenceLink`
- draft projection sync through `DraftContinuityEvidenceProjectionDocument.withSystemAttachmentRefs(...)`
- governed artifact access through `ArtifactPresentationContract` and `OutboundNavigationGrant`-shaped server views

## Runtime split

- [attachment-pipeline.ts](/Users/test/Code/V/packages/domains/intake_request/src/attachment-pipeline.ts)
  - attachment state machine
  - upload sessions
  - append-only scan attempts
  - append-only derivative settlements
  - append-only replacement and removal lineage
  - in-memory private quarantine and durable object-store adapter
- [attachment-scan-simulator.ts](/Users/test/Code/V/services/adapter-simulators/src/attachment-scan-simulator.ts)
  - deterministic scanner verdicts behind the external adapter seam
- [intake-attachment.ts](/Users/test/Code/V/services/command-api/src/intake-attachment.ts)
  - draft projection sync
  - FHIR `DocumentReference` persistence
  - live attachment-state resolver for the `par_145` submit-readiness application

## Lifecycle

1. `attachments:initiate` validates the frozen `seq_141` allow-list and returns a signed quarantine upload target.
2. Upload transport settlement records `uploaded_unverified` and stores bytes in the private quarantine adapter.
3. Worker execution moves the attachment to `scanning`, records one immutable scan attempt, and settles either:
   - `quarantined`
   - `scan_failed_retryable`
   - `promoted`
4. Safe promotion creates one durable object, optional preview derivative, one `AttachmentDocumentReferenceLink`, and one FHIR `DocumentReference` row.
5. Draft attachment refs are resynchronized from active attachment lineage after every state-changing backend action.

## Fail-closed rules

- no durable promotion without one clean scan verdict
- no raw quarantine or durable object URL in any returned contract
- preview generation is non-authoritative and may degrade to `placeholder_only`
- duplicate uploads replay by checksum-lineage fingerprint and do not create a second active evidence row
- removed and replaced attachments remain in immutable history and fall out of the active draft projection only after explicit state change

## Compatibility

- input policy: [141_attachment_acceptance_policy.json](/Users/test/Code/V/data/contracts/141_attachment_acceptance_policy.json)
- artifact-mode policy: [141_attachment_projection_and_artifact_modes.json](/Users/test/Code/V/data/contracts/141_attachment_projection_and_artifact_modes.json)
- submit-readiness consumer: [submission-envelope-validation.ts](/Users/test/Code/V/packages/domains/intake_request/src/submission-envelope-validation.ts)
- persistence artifact: [083_phase1_attachment_pipeline.sql](/Users/test/Code/V/services/command-api/migrations/083_phase1_attachment_pipeline.sql)
