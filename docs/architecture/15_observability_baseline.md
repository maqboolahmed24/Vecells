# 15 Observability Baseline

        Vecells should use a standards-based signal pipeline plus tuple-aware alerting and route-aware synthetic probes. The chosen baseline keeps traces, metrics, logs, UI telemetry, audit, and recovery evidence correlated without letting any of those surfaces become hidden runtime truth.

        ## Chosen Baselines

        | Family | Chosen baseline | Standards | Tuple authority | PHI-safe | Hidden state control | Total |
| --- | --- | --- | --- | --- | --- | --- |
| OpenTelemetry-compatible signal pipeline | OpenTelemetry collectors, PHI-safe telemetry gateway, append-only metrics or log or trace warehouse, and immutable audit-export mirror | 5 | 5 | 5 | 5 | 35 |
| Tuple-aware dashboards and alert routing | Machine-readable alert rule registry, role-scoped board projections, and evidence-aware alert routing that reads the published runtime tuple | 4 | 5 | 5 | 5 | 34 |
| Synthetic monitoring and canary proof runner | Route-contract-aware synthetic runner, wave-observation policy evaluator, and guardrail probe pack for ordinary and degraded journeys | 4 | 5 | 5 | 4 | 33 |

        ## PHI-Safe Signal Law

        - Correlation is mandatory through `edgeCorrelationId`, `causalToken`, and route or tuple hashes.
        - `UITelemetryDisclosureFence` stays authoritative for browser telemetry; patient, staff, embedded, replay, and recovery routes all remain bound to task 010 ceilings.
        - Logs and traces may carry diagnostic references and hashes, but raw patient identifiers, clinical narrative, route params, and artifact fragments remain forbidden.
        - Audit and evidence lanes carry the richer masked scope needed for replay, investigation, or assurance, but only through governed export posture.
        - Slice-bounded trust degradation remains explicit. One bad producer degrades only the affected assurance slices and the essential functions that depend on them.

        ## Signal Matrix

        | Signal | Family | Ceiling | Allowed identifiers | Authoritative lane | Alert route |
| --- | --- | --- | --- | --- | --- |
| Gateway ingress and route-intent traces | trace | descriptor_and_hash_only | edgeCorrelationId; causalToken; routeFamilyCode; safeRouteScopeHash | diagnostic_trace_then_audit_link | n/a |
| Command settlement and transition traces | trace | masked_scope_and_refs_only | edgeCorrelationId; causalToken; routeFamilyCode; lineageRef | command_settlement_audit_join | n/a |
| Patient and public UI telemetry fence events | ui_telemetry | descriptor_and_hash_only | eventId; edgeCorrelationId; causalToken; routeFamilyCode; shellDecisionClass; selectedAnchorChangeClass | ui_event_to_projection_visibility_receipt | ALERT_DISCLOSURE_FENCE_BLOCKED |
| Workspace, hub, pharmacy, support, and assistive UI telemetry fence events | ui_telemetry | masked_scope_and_refs_only | eventId; taskRef; lineageRef; maskScopeClass; restoreState; edgeCorrelationId | ui_event_to_audit_reference | ALERT_DISCLOSURE_FENCE_BLOCKED |
| Pipeline stage settlement logs | log | descriptor_only | edgeCorrelationId; releaseTupleHash; releaseContractMatrixHash; artifactDigestRef | pipeline_stage_settlement | ALERT_STAGE_SETTLEMENT_DRIFT |
| Build provenance and signature verification logs | log | descriptor_only | edgeCorrelationId; releaseTupleHash; artifactDigestRef; watchTupleHash | provenance_verification_then_audit_export | ALERT_PROVENANCE_OR_SBOM_BLOCKED |
| Assurance slice trust and completeness metrics | metric | descriptor_only | edgeCorrelationId; trustSliceCode; graphHash | assurance_slice_metric_and_export | ALERT_ASSURANCE_SLICE_QUARANTINED |
| Release publication parity and watch tuple metrics | metric | descriptor_only | edgeCorrelationId; releaseTupleHash; watchTupleHash; parityState | release_watch_and_ops_board | ALERT_WATCH_TUPLE_OR_PARITY_DRIFT |
| Canary and wave guardrail metrics | metric | descriptor_only | edgeCorrelationId; watchTupleHash; releaseTupleHash; serviceClass | guardrail_snapshot_then_wave_verification | ALERT_WAVE_GUARDRAIL_BREACH |
| Patient entry and recovery SLO metrics | metric | descriptor_only | edgeCorrelationId; releaseTupleHash; sliCode; routeFamilyCode | essential_function_board | ALERT_PATIENT_ENTRY_SLO |
| Workspace triage and settlement SLO metrics | metric | descriptor_only | edgeCorrelationId; releaseTupleHash; sliCode; routeFamilyCode | essential_function_board | ALERT_WORKSPACE_SETTLEMENT_SLO |
| Booking, hub, pharmacy, and callback delivery SLO metrics | metric | descriptor_only | edgeCorrelationId; releaseTupleHash; sliCode; routeFamilyCode | essential_function_board | ALERT_BOOKING_AND_PARTNER_FLOW_SLO |
| Break-glass, tenant switch, and support replay audit events | audit | descriptor_only | edgeCorrelationId; causalToken; breakGlassReasonClass; auditQueryHash | immutable_audit_and_incident_timeline | ALERT_BREAK_GLASS_OR_TENANT_SWITCH |
| Recovery posture, restore, failover, and chaos evidence events | evidence | descriptor_only | edgeCorrelationId; restoreTupleHash; failoverTupleHash; chaosTupleHash; recoveryPostureClass | recovery_evidence_artifact | ALERT_READINESS_OR_REHEARSAL_STALE |
| Incident and near-miss evidence writeback | evidence | descriptor_only | edgeCorrelationId; graphHash; controlObjectiveId; reviewState | assurance_graph_snapshot | ALERT_SECURITY_INCIDENT_OR_NEAR_MISS |

        ## Decision Notes

        - Dashboard and alert surfaces consume `EssentialFunctionHealthEnvelope`, `ReleaseTrustFreezeVerdict`, `ReleaseWatchEvidenceCockpit`, and `OperationalReadinessSnapshot` rather than reconstructing health from raw metrics.
        - Synthetic monitoring is route-contract-aware and recovery-aware. Generic uptime checks are not sufficient for Gate 4 or Gate 5 proof.
        - This baseline directly closes the PHI telemetry leak gap, the governance-watch parity gap, and the slice-blackout gap called out in prompt 015.
