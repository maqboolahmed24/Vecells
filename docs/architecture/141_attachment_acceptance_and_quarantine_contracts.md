
# 141 Attachment Acceptance And Quarantine Contracts

Generated: 2026-04-14T12:37:32Z

## Purpose

`seq_141` freezes the Phase 1 attachment subsystem as a governed intake surface instead of a generic upload helper. Acceptance, quarantine, dedupe, preview posture, governed handoff, and same-shell continuity now resolve from one exact contract pack.

## Frozen Upload Algorithm

| Step | Action |
| --- | --- |
| 1 | initiate upload |
| 2 | return signed target + attachmentPublicId |
| 3 | direct browser upload to quarantine store |
| 4 | scan MIME/extension/size/malware/integrity |
| 5 | promote safe files to durable storage |
| 6 | create Attachment record + DocumentReference |
| 7 | update draft projection |
| 8 | emit intake.attachment.added |

The durable rule is strict:

- safe files alone promote to durable storage, create the Attachment row, create the `DocumentReference`, update the draft projection, and emit `intake.attachment.added`
- quarantine and unsupported verdicts emit `intake.attachment.quarantined`
- retryable transfer failure is local recovery only until quarantine write becomes authoritative

## Acceptance Rules

| Rule | Extensions | MIME | Max size | Preview law | Camera |
| --- | --- | --- | --- | --- | --- |
| Quiet inline image evidence | .jpg, .jpeg, .png | image/jpeg, image/png | 15 MB | governed_preview_if_clean_and_within_inline_budget | yes |
| Mobile HEIC capture with derivative fallback | .heic | image/heic | 15 MB | preview_derivative_required_then_governed_preview_or_placeholder | yes |
| Structured PDF evidence | .pdf | application/pdf | 15 MB | governed_preview_if_clean_and_within_inline_budget | no |

The duplicate-upload rule is fixed under `DUP_141_CHECKSUM_LINEAGE_REPLAY`: the same `draftPublicId + checksumSha256 + byteSize + contentType` replays to the existing `attachmentPublicId`, reuses the same `DocumentReference`, focuses the existing card, and emits no second durable add event.

## Classification And Quarantine Outcomes

| Outcome | Terminal scan state | Artifact stage | Events | Safety meaning |
| --- | --- | --- | --- | --- |
| accepted_safe | clean_promoted | governed_preview | intake.attachment.added | preserved_supporting_evidence |
| preview_unavailable_but_file_kept | clean_promoted_preview_deferred | placeholder_only | intake.attachment.added | preserved_supporting_evidence |
| retryable_transfer_failure | transfer_retry_required | recovery_only | none | not_yet_captured |
| quarantined_malware | quarantined_malware | recovery_only | intake.attachment.quarantined | unresolved_fail_closed_review |
| quarantined_integrity_failure | quarantined_integrity_failure | recovery_only | intake.attachment.quarantined | unresolved_fail_closed_review |
| quarantined_unsupported_type | quarantined_unsupported_type | recovery_only | intake.attachment.quarantined | unresolved_fail_closed_review |
| quarantined_unreadable | quarantined_unreadable | recovery_only | intake.attachment.quarantined | unresolved_fail_closed_review |
| quarantined_size_exceeded | quarantined_size_exceeded | recovery_only | intake.attachment.quarantined | unresolved_fail_closed_review |

If attachment processing leaves safety meaning unresolved, the file may not quietly downgrade into `technical_metadata`. The classification pack routes that state to `unresolved_fail_closed_review`.

## Artifact Law

```json
{
  "artifactPresentationContractId": "APC_141_INTAKE_ATTACHMENT_V1",
  "outboundNavigationGrantPolicyRef": "ONG_141_INTAKE_ATTACHMENT_HANDOFF_V1",
  "allowedFallbackModes": [
    "structured_summary",
    "placeholder_only",
    "recovery_only"
  ],
  "rawStorageUrlsForbidden": true
}
```

Attachment preview, open, download, and browser handoff are independent governed modes:

- preview is available only while the current `ArtifactPresentationContract` plus mode tuple keep preview lawful
- open, download, and external handoff require `OutboundNavigationGrant`
- raw object-store URLs are forbidden in every browser-facing flow
- placeholder-only and recovery-only modes stay in the same shell and preserve the current step anchor

## Gap Handling

| Gap | Resolution |
| --- | --- |
| GAP_RESOLUTION_141_ATTACHMENT_IS_A_GOVERNED_SUBSYSTEM | Attachment upload now has a frozen acceptance, quarantine, dedupe, and artifact-mode contract instead of being treated as a generic form helper. |
| GAP_RESOLUTION_141_PREVIEW_REQUIRES_CONTRACT_AND_GRANT | Preview, open, download, and browser handoff are bound to ArtifactPresentationContract and OutboundNavigationGrant; raw storage URLs are forbidden. |
| GAP_RESOLUTION_141_TRANSFER_FAILURE_IS_NOT_SAFETY_SUCCESS | Retryable transfer failure remains a local recovery state and never masquerades as accepted clinical evidence or silent nonclinical success. |
| GAP_RESOLUTION_141_DUPLICATE_UPLOADS_REUSE_THE_SAME_EVIDENCE | Exact duplicate uploads within the same draft lineage replay to the same attachment card and durable evidence record instead of creating silent duplicates. |
| GAP_RESOLUTION_141_QUARANTINE_STAYS_VISIBLE_IN_THE_SAME_SHELL | Quarantined or preview-degraded attachments remain visible with local replace or remove actions so the intake shell keeps continuity and the user sees the governing posture. |

## Explicit Assumptions

| Assumption | Summary |
| --- | --- |
| ASSUMPTION_141_QUARANTINE_STORAGE_IS_PRIVATE_ONLY | Quarantine object storage is private, non-browsable, and never exposed directly to the browser or embedded host. |
| ASSUMPTION_141_DERIVATIVE_GENERATION_IS_NON_AUTHORITATIVE | Image preview derivatives improve the inline experience, but derivative success never substitutes for the authoritative source file or scan state. |

## Explicit Conflict Handling

| Conflict | Summary |
| --- | --- |
| CONFLICT_141_PRODUCTION_SCANNERS_MAY_STRENGTHEN_BUT_NOT_RELAX | Later production scanners may add stronger threat, metadata, or integrity detection, but they may not weaken the fail-closed acceptance and quarantine outcomes frozen here. |

## Explicit Risks

| Risk | Summary | Mitigation |
| --- | --- | --- |
| RISK_141_DERIVATIVE_FAILURE_COULD_HIDE_CLINICAL_CONTEXT | If derivative generation fails, clinically relevant evidence could disappear from the patient journey unless the card stays visible with explicit placeholder and replacement guidance. | Route derivative failure to preview_unavailable_but_file_kept or fail_closed_review, preserve the card in the same shell, and keep governed open or download only when the current contract tuple permits it. |
| RISK_141_SCANNER_TIMEOUT_COULD_BE_MISTAKEN_FOR_ACCEPTANCE | Scanner timeout or unreadable output could be mistaken for an ordinary upload error and allow unsafe evidence to travel onward. | Distinctly separate retryable transfer failure from unreadable, integrity-failed, and quarantined states, and route unresolved safety meaning into fail_closed_review. |

## Source Traceability

- `prompt/141.md`
- `prompt/shared_operating_contract_136_to_145.md`
- `prompt/AGENT.md`
- `prompt/checklist.md`
- `blueprint/phase-1-the-red-flag-gate.md#1D. Attachment ingestion pipeline`
- `blueprint/phase-1-the-red-flag-gate.md#1E. Submit normalization and synchronous safety engine`
- `blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract`
- `blueprint/phase-0-the-foundation-protocol.md#ArtifactModeTruthProjection`
- `blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant`
- `blueprint/platform-frontend-blueprint.md#1.19A ArtifactStage`
- `blueprint/forensic-audit-findings.md#Finding 61 - The event catalogue lacked attachment-quarantine events`
- `docs/architecture/109_artifact_presentation_shell.md`
- `docs/integrations/129_adapter_simulator_validation.md`
- `docs/architecture/139_web_intake_journey_contract.md`
- `docs/api/139_phase1_submission_schema_lock.md`
- `docs/architecture/140_request_type_taxonomy.md`
- `data/contracts/139_intake_draft_view.schema.json`
- `data/contracts/139_intake_event_catalog.json`
- `data/contracts/140_request_type_taxonomy.json`
- `data/integration/adapter_validation_results.json`
