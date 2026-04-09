# 10 PHI Masking And Redaction Policy

This pack closes the core masking gaps: no UI-collapse-as-privacy, no preview/detail shared payloads, no widening after browser delivery, and no raw claims, phone numbers, JWTs, or secrets in telemetry or standard logs.

## Policy Families

| Policy | Family | Preview rule | Artifact rule | Telemetry rule |
| --- | --- | --- | --- | --- |
| POL_PUBLIC_SAFE_PLACEHOLDER | Public-safe placeholder and recovery policy | Previews expose only neutral labels, status buckets, governed placeholders, and recovery-safe next steps. | Artifacts are awareness-only or summary-only; no raw body or browser handoff by default. | Emit route family, shell state, summary safety tier, and placeholder reason only. |
| POL_GRANT_RECOVERY_BOUNDARY | Grant-scoped recovery boundary policy | Recovery routes may show only the selected lineage summary, current blockage, and next safe step. | Artifacts stay summary-only or placeholder-only until route checks and step-up complete. | Use masked grant family, route family, fence state, and recovery reason only. |
| POL_PATIENT_AUTH_SUMMARY | Authenticated patient summary and detail policy | List rows, home cards, and message snippets stay preview-bound and may not inherit destination detail payloads. | Artifacts remain separate from preview and detail and may degrade to summary, inline, or governed handoff independently. | Emit class codes, route families, hash refs, and settled posture only. |
| POL_PATIENT_ARTIFACT_GOVERNED | Patient artifact presentation policy | Artifact rows disclose only title class, freshness, and parity-safe summary until the mode-specific contract allows more. | Structured summary is the default; inline preview, download, print, and handoff each require separate contract proof. | Telemetry records artifact mode, parity state, transfer outcome class, and disclosure class only. |
| POL_EMBEDDED_ARTIFACT_CHANNEL | Embedded channel artifact and URL scrub policy | Embedded previews remain summary-first and must survive narrow-host capability loss. | No raw PHI-bearing URLs, no conventional download dependence, and no print-first flow; use governed inline, summary, or scrubbed handoff. | Bridge and embedded telemetry stay PHI-safe and route-contract-bound. |
| POL_WORKSPACE_MINIMUM_NECESSARY | Operational workspace minimum-necessary policy | Queue rows and chips show only the minimum clinically or operationally necessary context for the current task. | Artifacts may show inline or handoff posture only when the governing artifact contract allows the same audience and task scope. | Workspace telemetry uses task refs, lineage refs, stage classes, and trust or freeze posture only. |
| POL_SUPPORT_MASKED_REPLAY | Support masked replay and restore policy | Support timeline previews keep chronology and actor class but mask body content and held-draft detail. | Support presentation artifacts remain summary-first or masked-inline; export and external handoff are separately governed. | Support telemetry records checkpoint hash, mask scope class, restore posture, and route-intent validity only. |
| POL_OPS_AGGREGATE_DISCLOSURE | Operations aggregate and drilldown disclosure policy | Boards default to aggregated, slice-bound, or masked diagnostic cues rather than subject payloads. | Exports and readiness artifacts are governance artifacts with their own artifact contracts. | Use counts, slice ids, queue ids, trust states, and severity bands only. |
| POL_TELEMETRY_PHI_SAFE | PHI-safe telemetry policy | Not applicable. | Not applicable. | Only hashes, ids, route family codes, anchor change classes, disclosure classes, and causal tokens are allowed. |
| POL_LOG_REFERENCE_ONLY | Reference-only structured logging policy | Not applicable. | Not applicable. | Not applicable. |
| POL_INVESTIGATION_SCOPE_ENVELOPE | Investigation scope envelope policy | Investigation summaries remain selected-anchor-bound and mask-scope-bound. | Export and replay artifacts remain separately governed and may still redact underlying body detail. | Telemetry records envelope ids, scope member classes, and restore posture only. |
| POL_RETENTION_GOVERNED_EXPORT | Retention governance witness policy | Governance witnesses show status, artifact set hashes, hold state, and authoritative outcome class only. | Deletion certificates, archive manifests, and assurance packs are not patient-downloadable ordinary documents. | Emit artifact family, disposition state, and graph hash only. |

## Synthetic Preview Examples

| Example | Synthetic text | Policy |
| --- | --- | --- |
| Public-safe summary preview | [message preview withheld pending sign-in] | POL_PUBLIC_SAFE_PLACEHOLDER |
| Wrong-patient hold placeholder | [identity check required before this request can reopen] | POL_PATIENT_AUTH_SUMMARY |
| Embedded artifact fallback | [summary available here; full document requires approved handoff] | POL_EMBEDDED_ARTIFACT_CHANNEL |
| Masked replay breadcrumb | [masked reply thread shown under current replay scope] | POL_SUPPORT_MASKED_REPLAY |

## Required Behaviors

- Allowlisted materialization is required on every row.
- Wrong-patient hold demotes cached PHI and suppresses stale replay.
- Embedded channels scrub URL and handoff detail rather than relying on browser capability.
- Support replay remains masked and selected-anchor-bound until restore settlement re-proves live scope.
