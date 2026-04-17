
# 141 Attachment Acceptance Policy

Generated: 2026-04-14T12:37:32Z

## Security Posture

The attachment pipeline is quarantine-first. The browser writes only to a signed quarantine target. Promotion to durable storage occurs only after MIME, extension, size, malware, and integrity checks settle cleanly.

| Control | Policy |
| --- | --- |
| Max accepted bytes | 15 MB |
| Max inline preview bytes | 8 MB |
| Raw storage URLs | forbidden |
| Duplicate idempotency | checksum lineage replay |
| Quarantine visibility | same-shell card remains visible |
| Fail-closed unresolved meaning | required |

## Canonical States

- `accepted_safe` is the only state that may create both the durable Attachment row and the `DocumentReference`
- `preview_unavailable_but_file_kept` preserves the file and same-shell continuity, but keeps preview bounded
- `retryable_transfer_failure` is not a scanner verdict and may not masquerade as accepted evidence
- `quarantined_malware`, `quarantined_integrity_failure`, `quarantined_unsupported_type`, `quarantined_unreadable`, and `quarantined_size_exceeded` each remain visible and fail closed

## Event Law

- `intake.attachment.added` may emit only after safe promotion and durable linking
- `intake.attachment.quarantined` must emit whenever a quarantined terminal verdict is reached
- no raw object URL or local browser acknowledgement may stand in for a durable event or grant

## Mock_now_execution

The current mock-now path is explicit: adapter `GAP_MISSING_SIMULATOR_RUNTIME_ADP_MALWARE_ARTIFACT_SCANNING_V1` remains simulator-stubbed, so this pack freezes policy and fail-closed outcomes without pretending the local stub is production-accredited.

## Actual_production_strategy_later

- production scanners may add stronger threat intelligence, metadata stripping, and integrity signals
- production may not weaken the accepted or quarantined outcomes frozen here
- production stores and delivery services must keep the same `attachmentPublicId`, scan states, event names, and governed handoff law

## Explicit Control Notes

- `ASSUMPTION_141_QUARANTINE_STORAGE_IS_PRIVATE_ONLY`
- `ASSUMPTION_141_DERIVATIVE_GENERATION_IS_NON_AUTHORITATIVE`
- `CONFLICT_141_PRODUCTION_SCANNERS_MAY_STRENGTHEN_BUT_NOT_RELAX`
- `RISK_141_DERIVATIVE_FAILURE_COULD_HIDE_CLINICAL_CONTEXT`
- `RISK_141_SCANNER_TIMEOUT_COULD_BE_MISTAKEN_FOR_ACCEPTANCE`
