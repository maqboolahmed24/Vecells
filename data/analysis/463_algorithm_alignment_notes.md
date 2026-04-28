# Task 463 Algorithm Alignment Notes

## Phase 9 Source Alignment

- 9C audit export requires investigation bundles to render through `ArtifactPresentationContract`; the export destination contract carries `artifactPresentationContractRef`, `artifactTransferSettlementRef`, and `outboundNavigationGrantRef`.
- 9D assurance pack export requires deterministic framework version, graph hash, redaction policy, export manifest, and reproduction hash; these are first-class fields on `ComplianceExportPolicyBinding` and `ExportDestinationVerificationRecord`.
- 9E records lifecycle requires archive manifests and deletion certificates to remain summary-first; the records destination class permits only archive manifest and deletion certificate artifact classes and disallows raw export URLs.
- 9G security incidents require reportability handoff status; `SecurityReportingDestinationBinding` embeds `ReportabilityHandoffVerificationRecord`.
- 9I final exercises require export handoff proof across audit, assurance, records, recovery, and conformance; `sourceReadiness` exposes those surfaces with blocked destination refs.

## Contract Behavior

- Natural scope is tenant, environment, destination class, framework, and artifact class.
- Secret material is represented only as `vault-ref/...`; `secretMaterialInline` is always `false`.
- Fake receiver payloads include redacted summaries, manifest metadata, hash refs, framework refs, and settlement refs only.
- `stale_graph` and `stale_redaction_policy` create drifted reproduction state and stale source readiness.
- `blocked_graph`, `blocked_redaction`, `denied_scope`, `permission_denied`, and `missing_destination` block source readiness.
- `delivery_failed` records a failed delivery settlement and keeps the safe fallback disposition.

## Browser Automation Alignment

- Playwright tests intercept `/phase9/fake-security-reporting-receiver` and `/phase9/fake-compliance-export-receiver`.
- Keyboard-only tests exercise select, input, tab, enter, and click paths.
- Redaction tests assert no raw URLs, bearer tokens, access tokens, private key markers, inline secrets, or clinical narrative fields are exposed in DOM, network payloads, screenshots, or console output.
