# 158 File Upload Evidence States And Recovery

## Intent

`par_158` turns the Phase 1 files step into a governed evidence lane inside the existing patient intake shell. Uploads stay subordinate to the main question canvas, file state meaning stays traceable to the `seq_141` acceptance policy and `par_146` pipeline, and retry or quarantine never collapse into a generic “upload failed” message.

## Boundaries

- Surface route: `ISRC_139_INTAKE_SUPPORTING_FILES_V1`
- Acceptance policy: `AAP_141_PHASE1_ATTACHMENT_POLICY_V1`
- Public pipeline: `PHASE1_ATTACHMENT_PIPELINE_PUBLIC_V1`
- Presentation contract: `APC_141_INTAKE_ATTACHMENT_V1`
- Navigation policy: `ONG_141_INTAKE_ATTACHMENT_HANDOFF_V1`
- Inline preview contract: `IPC_141_ATTACHMENT_INLINE_PREVIEW_V1`

## Frontend Grammar

The shell renders one explicit user-facing state per file:

1. `selecting`
2. `uploading to quarantine`
3. `scanning`
4. `ready / kept`
5. `preview unavailable but kept`
6. `retryable transfer failure`
7. `quarantined unsupported type`
8. `quarantined unreadable / integrity failure`
9. `quarantined malware`
10. `removed`
11. `replaced`

These states are intentionally separated into three families:

- Transport: `selecting`, `uploading to quarantine`
- Transitional safety: `scanning`
- Terminal patient-visible outcomes: accepted, retryable, fail-closed, or continuity-only

## Recovery Law

- Retryable transfer failure means the file never reached trustworthy quarantine settlement.
- Quarantine states mean the file did reach the governed pipeline and was then blocked fail-closed.
- Remove and replace mutate only the affected card lineage. The shell route, selected anchor, and neighboring answers stay unchanged.
- Duplicate uploads never create silent second evidence rows. The existing card is focused and annotated instead.

## Preview Law

- Preview is only shown when the file settles into `ready / kept`.
- Preview and download actions are attached to grant metadata from `APC_141_INTAKE_ATTACHMENT_V1` and `ONG_141_INTAKE_ATTACHMENT_HANDOFF_V1`.
- The UI may not reveal raw storage URLs, object keys, or raw attachment identifiers in patient-visible copy.

## UI Structure

- `EvidenceLaneDropzone` owns picker, drag-drop, and optional camera capture entry.
- `EvidenceCardStack` renders bounded per-file cards with quiet accent rails, state pills, and local actions.
- `GovernedPreviewPanel` keeps preview handoff inside the same shell instead of spawning a generic file page.
- `AttachmentLaneAnnouncementRegion` announces one file-state change at a time.

## Gap Closures

- `GAP_RESOLVED_ATTACHMENT_STATE_COPY_PHASE1_V1`
- `GAP_RESOLVED_ATTACHMENT_DUPLICATE_RECONCILIATION_UI_PHASE1_V1`
- `GAP_RESOLVED_ATTACHMENT_GOVERNED_PREVIEW_POSTURE_PHASE1_V1`
