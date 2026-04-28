# Phase 9 Incident, Tenant Governance, And Dependency Hygiene Alignment

Task 469 is a composed test harness over the Phase 9 contracts rather than a new source of authority. Task 447 supplies SecurityIncident, NearMissReport, ReportabilityAssessment, ExternalReportingHandoffRecord, ContainmentAction, PostIncidentReview, CAPA, TrainingDrillRecord, assurance pack propagation, telemetry disclosure fencing, and ledger writeback.

Incident workflow tests cover telemetry-detected, operator-reported, and near-miss records. Severity triage must preserve impact scope, affected data/system refs, evidence preservation, investigation timeline links, containment settlement, reportability decisions, DSPT handoff readiness, PIR, root cause, CAPA ownership, training drill follow-up, and incident-to-assurance-pack propagation. Near misses remain first-class just-culture learning records and are not immediately classified as breaches.

Task 448 supplies TenantBaselineProfile, immutable ConfigVersion parent chains, PolicyPackVersion history, CompiledPolicyBundle gates, ConfigCompilationRecord, ConfigSimulationEnvelope, StandardsBaselineMap, StandardsDependencyWatchlist, DependencyLifecycleRecord, LegacyReferenceFinding, PolicyCompatibilityAlert, StandardsExceptionRecord, and PromotionReadinessAssessment.

Tenant governance tests cover baseline drift, policy pack effective windows, compiled policy gates, reference-case simulation readiness, visibility contract blockers, stale pharmacy dispatch rejection, stale assistive session invalidation, dependency lifecycle ownership, affected routes/bundles/simulations, policy compatibility enforcement, expired exception reopening, approval bypass invalidation, and candidate-bound watchlist hash parity.

Task 463 supplies the reportability export destination contract. The suite proves reportable incident handoff readiness through governed security-reporting bindings, outbound navigation grants, fake receiver records, redacted synthetic payloads, and no inline secret material.

Playwright coverage uses the existing 456 Incident Desk and 457 Tenant Governance surfaces. Required screenshots are exact, reportable, near-miss, containment-pending, CAPA-overdue, compile-blocked, promotion-blocked, exception-expired, and permission-denied. Browser checks reject PHI markers, raw incident detail fields, route params, artifact fragments, investigation keys, tokens, secret refs, raw export URLs, and trace persistence.
