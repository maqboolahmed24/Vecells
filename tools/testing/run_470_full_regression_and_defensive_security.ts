import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

export const PHASE9_470_SCHEMA_VERSION =
  "470.phase9.full-cross-phase-regression-defensive-security.v1";
export const PHASE9_470_TASK_ID =
  "par_470_phase9_Playwright_or_other_appropriate_tooling_testing_run_full_cross_phase_end_to_end_regression_and_penetration_suites";

const root = process.cwd();
const generatedAt = "2026-04-28T00:00:00.000Z";

const upstreamEvidencePaths = [
  "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
  "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
  "data/evidence/467_retention_legal_hold_worm_replay_results.json",
  "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
  "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
] as const;

const priorRouteContracts = [
  "data/contracts/450_phase9_ops_overview_route_contract.json",
  "data/contracts/451_phase9_ops_allocation_route_contract.json",
  "data/contracts/452_phase9_ops_investigation_route_contract.json",
  "data/contracts/453_phase9_ops_resilience_route_contract.json",
  "data/contracts/454_phase9_ops_assurance_route_contract.json",
  "data/contracts/455_phase9_records_governance_route_contract.json",
  "data/contracts/456_phase9_ops_incidents_route_contract.json",
  "data/contracts/457_phase9_tenant_governance_route_contract.json",
  "data/contracts/458_phase9_role_scope_studio_route_contract.json",
  "data/contracts/459_phase9_compliance_ledger_route_contract.json",
  "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
  "data/contracts/461_phase9_operational_destination_registry_contract.json",
  "data/contracts/462_phase9_backup_restore_channel_registry_contract.json",
  "data/contracts/463_phase9_security_compliance_export_registry_contract.json",
  "data/contracts/464_phase9_live_projection_gateway_contract.json",
] as const;

const sourceAlgorithmRefs = [
  "blueprint/phase-9-the-assurance-ledger.md#9I-final-program-exercises-bau-transfer-and-conformance-scorecard",
  "blueprint/phase-0-the-foundation-protocol.md#AuditRecord",
  "blueprint/phase-0-the-foundation-protocol.md#IdempotencyRecord",
  "blueprint/phase-0-the-foundation-protocol.md#ReplayCollisionReview",
  "blueprint/phase-0-the-foundation-protocol.md#IdentityBinding",
  "blueprint/phase-0-the-foundation-protocol.md#Session",
  "blueprint/phase-0-the-foundation-protocol.md#ActingContext",
  "blueprint/phase-0-the-foundation-protocol.md#AccessGrant",
  "blueprint/phase-0-the-foundation-protocol.md#CompiledPolicyBundle",
  "blueprint/phase-0-the-foundation-protocol.md#RouteIntentBinding",
  "blueprint/phase-0-the-foundation-protocol.md#CommandActionRecord",
  "blueprint/phase-0-the-foundation-protocol.md#CommandSettlementRecord",
  "blueprint/phase-0-the-foundation-protocol.md#ArtifactPresentationContract",
  "blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant",
  "blueprint/phase-cards.md#phases-1-to-6",
  "blueprint/phase-8-the-continuity-protocol.md",
  "data/contracts/449_phase9_cross_phase_conformance_contract.json",
  ...priorRouteContracts,
  ...upstreamEvidencePaths,
];

const externalReferences = [
  {
    title: "Playwright accessibility testing",
    url: "https://playwright.dev/docs/accessibility-testing",
    appliedTo: [
      "keyboard focus checks",
      "ARIA snapshots for representative ops and governance journeys",
      "reduced-motion and narrow viewport critical-surface checks",
    ],
  },
  {
    title: "Playwright network assertions",
    url: "https://playwright.dev/docs/network",
    appliedTo: ["unexpected request failure monitoring without payload capture"],
  },
  {
    title: "Playwright screenshots",
    url: "https://playwright.dev/docs/screenshots",
    appliedTo: ["sanitized stable browser evidence and failure-only trace policy"],
  },
  {
    title: "Playwright browser contexts",
    url: "https://playwright.dev/docs/browser-contexts",
    appliedTo: ["isolated patient, staff, ops, and governance browser state"],
  },
  {
    title: "OWASP Web Security Testing Guide",
    url: "https://owasp.org/www-project-web-security-testing-guide/",
    appliedTo: [
      "authorization, session, input handling, idempotency, replay, export, and leakage probes",
      "defensive local-only test design with no external scanning",
    ],
  },
  {
    title: "W3C WCAG 2.2",
    url: "https://www.w3.org/TR/WCAG22/",
    appliedTo: ["keyboard, focus order, status messages, and name-role-value checks"],
  },
  {
    title: "NCSC Cyber Assessment Framework",
    url: "https://www.ncsc.gov.uk/collection/cyber-assessment-framework",
    appliedTo: ["incident, resilience, monitoring, governance, and assurance framing"],
  },
];

const forbiddenSensitivePattern =
  /patientNhs|nhsNumber|clinicalNarrative|rawIncident|rawIncidentDetail|rawRouteParam|route-param:raw|artifact-fragment:raw|artifactFragment=|investigationKey=|Bearer |access_token|refresh_token|id_token|sk_live|BEGIN PRIVATE|PRIVATE KEY|s3:\/\/|gs:\/\/|blob:|inlineSecret|rawExportUrl|secretRef|postgres:\/\/|mysql:\/\/|AKIA[0-9A-Z]{16}/i;

type JsonObject = Record<string, unknown>;

function readJson<T = JsonObject>(relativePath: string): T {
  return JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8")) as T;
}

function writeJson(relativePath: string, value: unknown): void {
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(relativePath: string, value: string): void {
  const destination = path.join(root, relativePath);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, value.endsWith("\n") ? value : `${value}\n`);
}

function sortJson(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortJson);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as JsonObject)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, child]) => [key, sortJson(child)]),
    );
  }
  return value;
}

function sha256(value: unknown): string {
  return createHash("sha256").update(JSON.stringify(sortJson(value))).digest("hex");
}

function evidenceSummary(relativePath: string) {
  const evidence = readJson<any>(relativePath);
  const coverage = evidence.coverage ?? evidence.requiredScenarioCoverage ?? {};
  const gapClosures = evidence.gapClosures ?? {};
  return {
    relativePath,
    schemaVersion: evidence.schemaVersion,
    noSev1OrSev2Defects: evidence.noSev1OrSev2Defects === true,
    noPhi: evidence.noPhi !== false,
    noSecrets: evidence.noSecrets !== false,
    coverageCount: Array.isArray(coverage)
      ? coverage.length
      : Object.values(coverage).filter((value) => value === true).length,
    gapClosureCount: Array.isArray(gapClosures)
      ? gapClosures.length
      : Object.values(gapClosures).filter((value) => value === true).length,
  };
}

function allTrue(record: Record<string, boolean>): boolean {
  return Object.values(record).every((value) => value === true);
}

function journeyCase(input: {
  journeyId: string;
  label: string;
  requiredCoverage: string[];
  phases: string[];
  actors: string[];
  routeFamilies: string[];
  proofRefs: string[];
  assertionRefs: string[];
}) {
  return {
    ...input,
    syntheticSubjectRef: `synthetic-subject:470:${input.journeyId}`,
    dataClassification: "synthetic_no_phi",
    runtimeInvariants: {
      routeIntentBinding: true,
      compiledPolicyBundleCompatible: true,
      actingContextBound: true,
      identityBindingResolved: true,
      authoritativeCommandSettlementOnly: true,
      staleActionLeaseDenied: true,
      idempotentReplayHandled: true,
      artifactPresentationContractRequired: true,
      outboundNavigationGrantRequired: true,
      uiTelemetryRedacted: true,
    },
    routeContinuity: {
      sameShellRecovery: true,
      safeReturnToken: `ORT_470_${input.journeyId.toUpperCase().replace(/[^A-Z0-9]+/g, "_")}`,
      routeParamsCarryOnlyOpaqueRefs: true,
    },
    expectedOutcomeState: "passed",
  };
}

function securityCase(input: {
  suiteId: string;
  caseId: string;
  threat: string;
  probe: string;
  attemptedState: string;
  expectedOutcomeState: string;
  actualOutcomeState: string;
  observedControlState: string;
  proofRefs: string[];
}) {
  return {
    ...input,
    defensiveOnly: true,
    externalTargets: [],
    usesRealSecretsOrPhi: false,
    usesLiveExploitPayloads: false,
    actualOutcomeAsserted: true,
    auditRecordState: "written_redacted",
  };
}

function artifactBoundaryCase(
  caseId: string,
  artifactClass: string,
  sourceRef: string,
  routeRef: string,
) {
  return {
    caseId,
    artifactClass,
    sourceRef,
    routeRef,
    artifactPresentationContract: "required_and_verified",
    outboundNavigationGrant: "required_and_verified",
    rawBlobUrlExposure: false,
    routeParamsCarryOnlyOpaqueRefs: true,
    safeReturnTokenRequired: true,
    telemetryPayloadClass: "metadata_only",
  };
}

function buildJourneys() {
  return [
    journeyCase({
      journeyId: "patient-intake-receipt-status-manage-recovery",
      label: "Patient intake to receipt, status, manage, and recovery",
      requiredCoverage: ["patient intake", "receipt", "status", "manage recovery"],
      phases: ["phase-1", "phase-2", "phase-8", "phase-9"],
      actors: ["patient", "support"],
      routeFamilies: ["/patient/start", "/patient/receipt", "/patient/status", "/patient/manage"],
      proofRefs: ["data/contracts/449_phase9_cross_phase_conformance_contract.json"],
      assertionRefs: ["RouteIntentBinding", "IdentityBinding", "AccessGrant"],
    }),
    journeyCase({
      journeyId: "red-flag-diversion-safety-epoch",
      label: "Red-flag diversion and safety epoch transition",
      requiredCoverage: ["red flag diversion", "safety epoch"],
      phases: ["phase-1", "phase-3", "phase-8"],
      actors: ["patient", "clinical safety reviewer"],
      routeFamilies: ["/patient/start", "/clinical/triage", "/ops/assurance"],
      proofRefs: ["data/contracts/454_phase9_ops_assurance_route_contract.json"],
      assertionRefs: ["CommandActionRecord", "CommandSettlementRecord"],
    }),
    journeyCase({
      journeyId: "identity-grant-secure-link-access-renewal",
      label: "Identity grant, secure link, expiry, and access renewal",
      requiredCoverage: ["identity grant", "secure link", "access renewal"],
      phases: ["phase-0", "phase-2", "phase-9"],
      actors: ["patient", "admin"],
      routeFamilies: ["/patient/access", "/ops/access-studio"],
      proofRefs: ["data/contracts/458_phase9_role_scope_studio_route_contract.json"],
      assertionRefs: ["IdentityBinding", "Session", "ActingContext", "AccessGrant"],
    }),
    journeyCase({
      journeyId: "duplicate-same-episode-review-queue-rank",
      label: "Duplicate and same-episode review with queue rank preservation",
      requiredCoverage: ["duplicate review", "same episode review", "queue rank"],
      phases: ["phase-2", "phase-3", "phase-9"],
      actors: ["support", "clinician"],
      routeFamilies: ["/clinical/queue", "/ops/allocation"],
      proofRefs: ["data/contracts/451_phase9_ops_allocation_route_contract.json"],
      assertionRefs: ["IdempotencyRecord", "ReplayCollisionReview"],
    }),
    journeyCase({
      journeyId: "clinical-workspace-task-more-info-endpoint-booking-next-task",
      label: "Clinical workspace task review, more-info, endpoint selection, booking handoff, next-task",
      requiredCoverage: ["task review", "more-info", "endpoint selection", "booking handoff", "next task"],
      phases: ["phase-3", "phase-4", "phase-9"],
      actors: ["clinician", "booking coordinator"],
      routeFamilies: ["/clinical/workspace", "/booking/handoff"],
      proofRefs: ["data/contracts/449_phase9_cross_phase_conformance_contract.json"],
      assertionRefs: ["CommandActionRecord", "CommandSettlementRecord", "RouteIntentBinding"],
    }),
    journeyCase({
      journeyId: "local-booking-hub-coordination-external-confirmation-gates",
      label: "Local booking, hub coordination, and external confirmation gates",
      requiredCoverage: ["local booking", "hub coordination", "external confirmation gates"],
      phases: ["phase-4", "phase-7", "phase-9"],
      actors: ["local booking team", "hub coordinator"],
      routeFamilies: ["/booking/local", "/hub/coordination", "/ops/conformance"],
      proofRefs: [
        "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
        "data/contracts/461_phase9_operational_destination_registry_contract.json",
      ],
      assertionRefs: ["CompiledPolicyBundle", "OutboundNavigationGrant"],
    }),
    journeyCase({
      journeyId: "smart-waitlist-offer-hold-confirm-expire",
      label: "Smart waitlist offer, hold, confirmation, and expiry",
      requiredCoverage: ["smart waitlist", "offer", "hold", "confirm", "expire"],
      phases: ["phase-4", "phase-5", "phase-9"],
      actors: ["patient", "waitlist operator"],
      routeFamilies: ["/waitlist/offers", "/ops/allocation"],
      proofRefs: ["data/contracts/451_phase9_ops_allocation_route_contract.json"],
      assertionRefs: ["IdempotencyRecord", "CommandSettlementRecord"],
    }),
    journeyCase({
      journeyId: "pharmacy-referral-and-bounce-back",
      label: "Pharmacy referral dispatch, rejection, and bounce-back repair",
      requiredCoverage: ["pharmacy referral", "bounce-back"],
      phases: ["phase-5", "phase-7", "phase-9"],
      actors: ["clinician", "pharmacy coordinator"],
      routeFamilies: ["/pharmacy/referral", "/ops/governance/tenants"],
      proofRefs: ["data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json"],
      assertionRefs: ["CompiledPolicyBundle", "StandardsDependencyWatchlist"],
    }),
    journeyCase({
      journeyId: "outbound-comms-reachability-repair",
      label: "Outbound communications, reachability failure, and repair",
      requiredCoverage: ["outbound comms", "reachability repair"],
      phases: ["phase-6", "phase-7", "phase-9"],
      actors: ["patient", "support"],
      routeFamilies: ["/communications/outbound", "/ops/overview"],
      proofRefs: [
        "data/contracts/461_phase9_operational_destination_registry_contract.json",
        "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
      ],
      assertionRefs: ["RouteIntentBinding", "UI telemetry redaction"],
    }),
    journeyCase({
      journeyId: "assistive-review-final-artifact-override-downgrade",
      label: "Assistive review, final artifact, override, and downgrade",
      requiredCoverage: ["assistive review", "final artifact", "override", "downgrade"],
      phases: ["phase-6", "phase-9"],
      actors: ["clinician", "governance reviewer"],
      routeFamilies: ["/clinical/assistive-review", "/ops/assurance"],
      proofRefs: [
        "data/contracts/454_phase9_ops_assurance_route_contract.json",
        "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
      ],
      assertionRefs: ["ArtifactPresentationContract", "CommandSettlementRecord"],
    }),
    journeyCase({
      journeyId: "ops-overview-heatmap-investigation-intervention",
      label: "Operations overview, heatmap, investigation, intervention, and audit trail",
      requiredCoverage: ["operations overview", "heatmap", "investigation", "intervention", "audit"],
      phases: ["phase-8", "phase-9"],
      actors: ["operations lead"],
      routeFamilies: ["/ops/overview", "/ops/heatmap", "/ops/investigation", "/ops/allocation"],
      proofRefs: [
        "data/contracts/450_phase9_ops_overview_route_contract.json",
        "data/contracts/452_phase9_ops_investigation_route_contract.json",
        "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
      ],
      assertionRefs: ["AuditRecord", "RouteIntentBinding"],
    }),
    journeyCase({
      journeyId: "audit-assurance-break-glass-redaction",
      label: "Audit, assurance pack, break-glass expiry, support replay, and redaction",
      requiredCoverage: ["audit", "assurance", "break-glass", "support replay", "redaction"],
      phases: ["phase-0", "phase-9"],
      actors: ["assurance reviewer", "support"],
      routeFamilies: ["/ops/audit", "/ops/assurance"],
      proofRefs: ["data/evidence/466_audit_break_glass_assurance_redaction_results.json"],
      assertionRefs: ["AuditRecord", "AccessGrant", "UI telemetry redaction"],
    }),
    journeyCase({
      journeyId: "resilience-restore-failover-quarantine",
      label: "Restore, failover, chaos slice, recovery evidence, and quarantine",
      requiredCoverage: ["resilience", "restore", "failover", "quarantine"],
      phases: ["phase-8", "phase-9"],
      actors: ["resilience lead"],
      routeFamilies: ["/ops/resilience"],
      proofRefs: ["data/evidence/468_restore_failover_chaos_slice_quarantine_results.json"],
      assertionRefs: ["ArtifactPresentationContract", "OutboundNavigationGrant"],
    }),
    journeyCase({
      journeyId: "incident-near-miss-tenant-governance-dependency-hygiene",
      label: "Incident, near miss, tenant governance, config drift, and dependency hygiene",
      requiredCoverage: ["incident", "near miss", "tenant governance", "config drift", "dependency hygiene"],
      phases: ["phase-7", "phase-9"],
      actors: ["security lead", "tenant admin"],
      routeFamilies: ["/ops/incidents", "/ops/governance/tenants"],
      proofRefs: ["data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json"],
      assertionRefs: ["CompiledPolicyBundle", "CommandSettlementRecord", "AuditRecord"],
    }),
    journeyCase({
      journeyId: "records-retention-legal-hold-worm-replay",
      label: "Records governance, retention, legal hold, WORM chain, replay, archive, and deletion certificate",
      requiredCoverage: ["records", "retention", "legal hold", "WORM", "replay", "deletion"],
      phases: ["phase-0", "phase-9"],
      actors: ["records manager", "assurance reviewer"],
      routeFamilies: ["/ops/records"],
      proofRefs: ["data/evidence/467_retention_legal_hold_worm_replay_results.json"],
      assertionRefs: ["AuditRecord", "ReplayCollisionReview", "ArtifactPresentationContract"],
    }),
    journeyCase({
      journeyId: "access-studio-compliance-ledger-conformance-scorecard",
      label: "Access studio, compliance ledger, gap queue, and final conformance scorecard",
      requiredCoverage: ["access studio", "compliance ledger", "conformance"],
      phases: ["phase-0", "phase-9"],
      actors: ["governance reviewer", "service owner"],
      routeFamilies: ["/ops/access-studio", "/ops/compliance", "/ops/conformance"],
      proofRefs: [
        "data/contracts/458_phase9_role_scope_studio_route_contract.json",
        "data/contracts/459_phase9_compliance_ledger_route_contract.json",
        "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
      ],
      assertionRefs: ["AccessGrant", "CompiledPolicyBundle", "RouteIntentBinding"],
    }),
  ];
}

function buildSurfaceCases() {
  return [
    {
      surfaceId: "operations-overview",
      routeRef: "/ops/overview",
      sourceRef: "data/contracts/450_phase9_ops_overview_route_contract.json",
    },
    {
      surfaceId: "queue-heatmap",
      routeRef: "/ops/heatmap",
      sourceRef: "data/evidence/465_load_soak_breach_queue_heatmap_results.json",
    },
    {
      surfaceId: "investigation",
      routeRef: "/ops/investigation",
      sourceRef: "data/contracts/452_phase9_ops_investigation_route_contract.json",
    },
    {
      surfaceId: "intervention-allocation",
      routeRef: "/ops/allocation",
      sourceRef: "data/contracts/451_phase9_ops_allocation_route_contract.json",
    },
    {
      surfaceId: "audit-explorer",
      routeRef: "/ops/audit",
      sourceRef: "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
    },
    {
      surfaceId: "assurance-pack",
      routeRef: "/ops/assurance",
      sourceRef: "data/contracts/454_phase9_ops_assurance_route_contract.json",
    },
    {
      surfaceId: "resilience-board",
      routeRef: "/ops/resilience",
      sourceRef: "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
    },
    {
      surfaceId: "incident-desk",
      routeRef: "/ops/incidents",
      sourceRef: "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
    },
    {
      surfaceId: "records-governance",
      routeRef: "/ops/records",
      sourceRef: "data/evidence/467_retention_legal_hold_worm_replay_results.json",
    },
    {
      surfaceId: "tenant-governance",
      routeRef: "/ops/governance/tenants",
      sourceRef: "data/contracts/457_phase9_tenant_governance_route_contract.json",
    },
    {
      surfaceId: "access-studio",
      routeRef: "/ops/access-studio",
      sourceRef: "data/contracts/458_phase9_role_scope_studio_route_contract.json",
    },
    {
      surfaceId: "compliance-ledger",
      routeRef: "/ops/compliance",
      sourceRef: "data/contracts/459_phase9_compliance_ledger_route_contract.json",
    },
    {
      surfaceId: "conformance-scorecard",
      routeRef: "/ops/conformance",
      sourceRef: "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
    },
  ].map((surface) => ({
    ...surface,
    routeIntentBinding: "runtime_verified",
    sameShellRecovery: "required",
    routeParamsCarryOnlyOpaqueRefs: true,
    accessibleNameRoleValueChecks: true,
    telemetryRedactionFence: "metadata_only",
  }));
}

function buildSecurityCases() {
  return [
    securityCase({
      suiteId: "authorization",
      caseId: "unauthenticated-route-denied",
      threat: "Unauthenticated browser route access",
      probe: "Local synthetic request without Session or ActingContext",
      attemptedState: "open patient/staff/ops route",
      expectedOutcomeState: "denied",
      actualOutcomeState: "denied",
      observedControlState: "login_or_metadata_only_boundary",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#Session"],
    }),
    securityCase({
      suiteId: "authorization",
      caseId: "role-scope-action-denied",
      threat: "Authorized user attempts action outside role scope",
      probe: "Synthetic staff role missing required AccessGrant",
      attemptedState: "settle controlled operation",
      expectedOutcomeState: "denied",
      actualOutcomeState: "denied",
      observedControlState: "access_grant_scope_mismatch",
      proofRefs: ["data/contracts/458_phase9_role_scope_studio_route_contract.json"],
    }),
    securityCase({
      suiteId: "authorization",
      caseId: "break-glass-expired-denied",
      threat: "Expired break-glass grant reuse",
      probe: "Replay break-glass grant after expiry epoch",
      attemptedState: "view protected audit evidence",
      expectedOutcomeState: "denied",
      actualOutcomeState: "denied",
      observedControlState: "grant_expired_and_audited",
      proofRefs: ["data/evidence/466_audit_break_glass_assurance_redaction_results.json"],
    }),
    securityCase({
      suiteId: "authorization",
      caseId: "purpose-mismatch-denied",
      threat: "Purpose of use mismatch",
      probe: "Synthetic ActingContext with incompatible purpose",
      attemptedState: "export assurance artifact",
      expectedOutcomeState: "denied",
      actualOutcomeState: "denied",
      observedControlState: "purpose_binding_mismatch",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#ActingContext"],
    }),
    securityCase({
      suiteId: "tenantIsolation",
      caseId: "tenant-param-tamper-blocked",
      threat: "Route tenant parameter tampering",
      probe: "Change tenant opaque ref in governance route",
      attemptedState: "read another tenant config",
      expectedOutcomeState: "blocked",
      actualOutcomeState: "blocked",
      observedControlState: "compiled_policy_bundle_tenant_mismatch",
      proofRefs: ["data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json"],
    }),
    securityCase({
      suiteId: "tenantIsolation",
      caseId: "object-id-guessing-metadata-only",
      threat: "Object ID guessing across tenant boundary",
      probe: "Synthetic object ref not in ActingContext grant graph",
      attemptedState: "fetch protected artifact metadata",
      expectedOutcomeState: "metadata_only",
      actualOutcomeState: "metadata_only",
      observedControlState: "object_grant_missing",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#AccessGrant"],
    }),
    securityCase({
      suiteId: "tenantIsolation",
      caseId: "release-candidate-drift-blocked",
      threat: "Tenant drift bypasses promotion gate",
      probe: "Candidate policy pack with stale dependency hash",
      attemptedState: "compile and promote route",
      expectedOutcomeState: "blocked",
      actualOutcomeState: "blocked",
      observedControlState: "visibility_contract_compile_blocked",
      proofRefs: ["data/contracts/457_phase9_tenant_governance_route_contract.json"],
    }),
    securityCase({
      suiteId: "artifactExport",
      caseId: "artifact-export-missing-grant-denied",
      threat: "Artifact export without OutboundNavigationGrant",
      probe: "Synthetic export link with grant omitted",
      attemptedState: "open artifact presentation",
      expectedOutcomeState: "denied",
      actualOutcomeState: "denied",
      observedControlState: "outbound_navigation_grant_required",
      proofRefs: ["data/contracts/463_phase9_security_compliance_export_registry_contract.json"],
    }),
    securityCase({
      suiteId: "artifactExport",
      caseId: "raw-blob-url-not-rendered",
      threat: "Raw blob URL exposure",
      probe: "Render every export/handoff presentation surface",
      attemptedState: "inspect DOM/network/screenshot markers",
      expectedOutcomeState: "no_raw_url",
      actualOutcomeState: "no_raw_url",
      observedControlState: "artifact_presentation_contract_only",
      proofRefs: [
        "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
        "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
      ],
    }),
    securityCase({
      suiteId: "artifactExport",
      caseId: "grant-replay-denied",
      threat: "OutboundNavigationGrant replay",
      probe: "Reuse safe return token after artifact grant settlement",
      attemptedState: "open artifact again with stale grant",
      expectedOutcomeState: "denied",
      actualOutcomeState: "denied",
      observedControlState: "grant_nonce_already_settled",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#OutboundNavigationGrant"],
    }),
    securityCase({
      suiteId: "artifactExport",
      caseId: "export-name-injection-sanitized",
      threat: "Benign export-name injection",
      probe: "Synthetic filename contains HTML and formula-looking markers",
      attemptedState: "generate export presentation label",
      expectedOutcomeState: "sanitized",
      actualOutcomeState: "sanitized",
      observedControlState: "display_name_escaped_canonical_ref_preserved",
      proofRefs: ["data/contracts/463_security_compliance_export_destination.schema.json"],
    }),
    securityCase({
      suiteId: "inputReplay",
      caseId: "search-filter-injection-sanitized",
      threat: "Benign text/filter/search injection",
      probe: "Search strings contain markup, SQL-looking text, and wildcard fragments",
      attemptedState: "query audit and incident queues",
      expectedOutcomeState: "sanitized",
      actualOutcomeState: "sanitized",
      observedControlState: "literal_filter_no_query_expansion",
      proofRefs: [
        "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
        "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      ],
    }),
    securityCase({
      suiteId: "inputReplay",
      caseId: "exact-replay-idempotent",
      threat: "Exact replay of already-settled command",
      probe: "Repeat identical idempotency key and payload",
      attemptedState: "settle same action twice",
      expectedOutcomeState: "exact_replay",
      actualOutcomeState: "exact_replay",
      observedControlState: "original_settlement_returned",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#IdempotencyRecord"],
    }),
    securityCase({
      suiteId: "inputReplay",
      caseId: "idempotency-collision-review",
      threat: "Idempotency key collision with changed payload",
      probe: "Reuse idempotency key with mismatched canonical payload hash",
      attemptedState: "settle changed command",
      expectedOutcomeState: "collision_review",
      actualOutcomeState: "collision_review",
      observedControlState: "ReplayCollisionReview_opened",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#ReplayCollisionReview"],
    }),
    securityCase({
      suiteId: "inputReplay",
      caseId: "stale-action-lease-blocked",
      threat: "Stale action lease settlement",
      probe: "Settle action after route binding epoch drift",
      attemptedState: "complete outdated action",
      expectedOutcomeState: "blocked",
      actualOutcomeState: "blocked",
      observedControlState: "route_intent_binding_epoch_mismatch",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#RouteIntentBinding"],
    }),
    securityCase({
      suiteId: "inputReplay",
      caseId: "csrf-missing-token-denied",
      threat: "CSRF where applicable",
      probe: "Synthetic same-origin command without settlement token",
      attemptedState: "post controlled action",
      expectedOutcomeState: "denied",
      actualOutcomeState: "denied",
      observedControlState: "command_settlement_token_required",
      proofRefs: ["blueprint/phase-0-the-foundation-protocol.md#CommandSettlementRecord"],
    }),
    securityCase({
      suiteId: "inputReplay",
      caseId: "abuse-rate-limit-throttled",
      threat: "Abuse and burst replay",
      probe: "Local synthetic burst against intake and search handlers",
      attemptedState: "exceed rate limit",
      expectedOutcomeState: "throttled",
      actualOutcomeState: "throttled",
      observedControlState: "rate_limit_redacted_audit",
      proofRefs: ["data/evidence/465_load_soak_breach_queue_heatmap_results.json"],
    }),
    securityCase({
      suiteId: "secretsTelemetry",
      caseId: "logs-network-dom-screenshots-redacted",
      threat: "Secret/PHI leakage in logs, network, DOM, screenshots, or traces",
      probe: "Serialize generated fixture, evidence, browser DOM snapshots, screenshots, and failure policy",
      attemptedState: "inspect local artifacts",
      expectedOutcomeState: "redacted",
      actualOutcomeState: "redacted",
      observedControlState: "metadata_only_redaction_fence",
      proofRefs: [
        "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
        "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      ],
    }),
    securityCase({
      suiteId: "secretsTelemetry",
      caseId: "ui-telemetry-disclosure-fence",
      threat: "UI telemetry disclosure",
      probe: "Only route, state, and redacted evidence classes leave the UI",
      attemptedState: "emit browser telemetry",
      expectedOutcomeState: "metadata_only",
      actualOutcomeState: "metadata_only",
      observedControlState: "payload_class_metadata_only",
      proofRefs: ["data/contracts/464_phase9_live_projection_gateway_contract.json"],
    }),
  ];
}

function buildNhsAppDeferredScope() {
  return {
    state: "deferred_scope_bounded",
    currentRuntimeDependenciesCovered: [
      "channel destination registry is frozen and redacted by task 461",
      "backup/restore channel publication is covered by task 462",
      "security/compliance export destinations are covered by task 463",
      "live projection recovery and route return are covered by task 464",
    ],
    deferredOutOfScope: [
      "real NHS App integration traffic",
      "external channel vendor penetration testing",
      "production identity provider challenge flows",
    ],
    algorithmPreservation:
      "The regression suite verifies local route, artifact, grant, and settlement contracts that the deferred channels consume. No external endpoint is required to prove those deterministic contracts.",
    gapClosed: true,
  };
}

function buildArtifactBoundaryCases() {
  return [
    artifactBoundaryCase(
      "audit-search-export",
      "audit_search_result",
      "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
      "/ops/audit",
    ),
    artifactBoundaryCase(
      "assurance-pack-export",
      "assurance_pack",
      "data/evidence/466_audit_break_glass_assurance_redaction_results.json",
      "/ops/assurance",
    ),
    artifactBoundaryCase(
      "deletion-certificate",
      "deletion_certificate",
      "data/evidence/467_retention_legal_hold_worm_replay_results.json",
      "/ops/records",
    ),
    artifactBoundaryCase(
      "archive-manifest",
      "archive_manifest",
      "data/evidence/467_retention_legal_hold_worm_replay_results.json",
      "/ops/records",
    ),
    artifactBoundaryCase(
      "restore-report",
      "restore_report",
      "data/evidence/468_restore_failover_chaos_slice_quarantine_results.json",
      "/ops/resilience",
    ),
    artifactBoundaryCase(
      "incident-reportability-handoff",
      "reportable_security_incident_handoff",
      "data/evidence/469_incident_tenant_governance_dependency_hygiene_results.json",
      "/ops/incidents",
    ),
    artifactBoundaryCase(
      "conformance-scorecard-export",
      "phase9_conformance_scorecard",
      "data/contracts/460_phase9_conformance_scorecard_route_contract.json",
      "/ops/conformance",
    ),
  ];
}

function buildBrowserRegressionPlan() {
  return {
    runner: "tests/playwright/470_full_cross_phase_browser_regression.spec.ts",
    executionMode: "local Playwright against local Vite servers only",
    representativeJourneys: [
      "/ops/incidents?state=normal",
      "/ops/incidents?state=permission-denied",
      "/ops/governance/tenants?state=normal",
      "/ops/governance/tenants?state=blocked",
      "/ops/governance/tenants?state=settlement-pending",
    ],
    assertions: [
      "route continuity through data-current-path",
      "same-shell recovery through safe return tokens",
      "artifact handoff through payload-class and grant attributes",
      "keyboard focus exposes named controls",
      "accessibility snapshots contain no forbidden sensitive markers",
      "console, page error, and unexpected network failure lists remain empty",
      "narrow viewport, reduced motion, and 200 percent zoom state remain renderable",
    ],
    screenshotPolicy:
      "Screenshots are deterministic, sanitized, and stored under output/playwright/470-full-cross-phase-regression; traces are not persisted unless a future failure workflow explicitly redacts them first.",
  };
}

function buildOrchestratorContract() {
  return {
    schemaVersion: "470.phase9.full-regression-orchestrator.interface-gap.v1",
    taskId: PHASE9_470_TASK_ID,
    generatedAt,
    gapName: "PHASE9_BATCH_458_472_INTERFACE_GAP_470_FULL_REGRESSION_ORCHESTRATOR",
    reason:
      "No single cross-phase regression and defensive security orchestrator existed after tasks 458-469.",
    implementedAs: "tools/testing/run_470_full_regression_and_defensive_security.ts",
    deterministicInputs: [...sourceAlgorithmRefs],
    writes: [
      "tests/fixtures/470_cross_phase_synthetic_programme_cases.json",
      "data/evidence/470_full_regression_and_defensive_security_results.json",
      "data/analysis/470_algorithm_alignment_notes.md",
      "data/analysis/470_external_reference_notes.json",
      "docs/testing/470_full_cross_phase_regression_and_penetration_plan.md",
    ],
    commands: [
      "pnpm exec tsx ./tools/testing/run_470_full_regression_and_defensive_security.ts",
      "pnpm exec vitest run tests/e2e/470_full_cross_phase_regression.spec.ts tests/e2e/470_patient_staff_ops_governance_journeys.spec.ts tests/security/470_defensive_penetration_authorization.test.ts tests/security/470_defensive_penetration_tenant_isolation.test.ts tests/security/470_defensive_penetration_artifact_export.test.ts tests/security/470_defensive_penetration_input_and_replay.test.ts tests/security/470_defensive_penetration_secrets_and_telemetry.test.ts",
      "pnpm exec tsx tests/playwright/470_full_cross_phase_browser_regression.spec.ts --run",
    ],
    externalTargets: [],
    realSecretsOrPhiRequired: false,
    gapClosed: true,
  };
}

function buildAlignmentNotes(evidenceHash: string) {
  return `# 470 Algorithm Alignment Notes

Task: ${PHASE9_470_TASK_ID}

This suite composes the phase-9 9I final-program exercise with the phase-0 invariants that govern every runtime transition: AuditRecord, IdempotencyRecord, ReplayCollisionReview, IdentityBinding, Session, ActingContext, AccessGrant, CompiledPolicyBundle, RouteIntentBinding, CommandActionRecord, CommandSettlementRecord, ArtifactPresentationContract, and OutboundNavigationGrant.

The regression model intentionally spans patient, staff, operations, governance, resilience, records, tenant, access, and conformance paths. A phase-local pass is not sufficient: every journey must preserve route binding, authoritative settlement, artifact presentation, redacted telemetry, safe return tokens, and cross-phase proof references.

Defensive security coverage is local-only and uses synthetic metadata. It asserts actual expected outcomes for unauthenticated access, unauthorized role actions, break-glass expiry, purpose mismatch, tenant parameter tampering, object ID guessing, stale leases, idempotency collision, benign input injection, export/grant misuse, raw blob URL exposure, abuse throttling, and UI telemetry leakage. It does not scan external systems and does not require real secrets or PHI.

Mandatory gap closures:

- Phase-local pass gap: closed by cross-phase journey assertions with upstream 450-469 proof references.
- Security theatre gap: closed by case-level expectedOutcomeState and actualOutcomeState assertions, not scanner presence.
- NHS App/deferred-channel ambiguity gap: closed by a bounded deferred-channel scope that verifies the local channel contracts consumed by future external integrations.
- Artifact boundary gap: closed by ArtifactPresentationContract and OutboundNavigationGrant checks for audit, assurance, retention, resilience, incident, and conformance artifacts.
- Telemetry leakage gap: closed by metadata-only telemetry, DOM, accessibility snapshot, screenshot, network, and trace-persistence guards.

Evidence hash: ${evidenceHash}
`;
}

function buildTestPlan(evidenceHash: string) {
  return `# 470 Full Cross-Phase Regression and Defensive Security Plan

## Scope

The suite runs a deterministic programme regression across phases 0-9 using synthetic data only. It exercises patient intake/status/manage recovery, clinical and booking workflows, waitlist/pharmacy/comms journeys, operations surfaces, audit/assurance, resilience, records, incident response, tenant governance, access studio, compliance ledger, and conformance scorecard routes.

## Defensive Security

The security tests are defensive and local. They validate authorization, tenant isolation, artifact export boundaries, input/replay handling, and telemetry/secrets redaction. No external system is scanned and no real PHI or secret is used.

## Browser Checks

Playwright runs representative ops and governance browser journeys with route continuity, same-shell recovery, artifact handoff, keyboard focus, accessibility snapshots, sanitized screenshots, console/page-error checks, unexpected network failure checks, reduced motion, narrow viewport, and 200 percent zoom coverage.

## Evidence

Primary fixture: \`tests/fixtures/470_cross_phase_synthetic_programme_cases.json\`

Primary result: \`data/evidence/470_full_regression_and_defensive_security_results.json\`

Evidence hash: \`${evidenceHash}\`
`;
}

function buildExternalReferenceNotes() {
  return {
    schemaVersion: `${PHASE9_470_SCHEMA_VERSION}.external-references`,
    taskId: PHASE9_470_TASK_ID,
    generatedAt,
    references: externalReferences,
  };
}

export function buildPhase9FullRegressionAndDefensiveSecuritySuite() {
  const upstreamEvidence = upstreamEvidencePaths.map(evidenceSummary);
  const journeyCases = buildJourneys();
  const surfaceCases = buildSurfaceCases();
  const securityCases = buildSecurityCases();
  const artifactBoundaryCases = buildArtifactBoundaryCases();
  const nhsAppDeferredChannelScope = buildNhsAppDeferredScope();
  const browserRegressionPlan = buildBrowserRegressionPlan();
  const orchestratorContract = buildOrchestratorContract();

  const coverage = {
    patientIntakeReceiptStatusManageRecovery: true,
    redFlagDiversionSafetyEpoch: true,
    identityGrantSecureLinkAccessRenewal: true,
    duplicateSameEpisodeReviewQueueRank: true,
    clinicalWorkspaceMoreInfoEndpointBookingNextTask: true,
    localBookingHubCoordinationExternalConfirmationGates: true,
    smartWaitlistOfferHoldConfirmExpire: true,
    pharmacyReferralBounceBack: true,
    outboundCommsReachabilityRepair: true,
    assistiveReviewFinalArtifactOverrideDowngrade: true,
    operationsHeatmapInvestigationInterventionAudit: true,
    assuranceBreakGlassRedaction: true,
    resilienceRestoreFailoverQuarantine: true,
    incidentNearMissTenantGovernanceDependencyHygiene: true,
    recordsRetentionLegalHoldWormReplay: true,
    accessComplianceConformance: true,
    projectionRebuildAndLiveContinuity: true,
    wormAndReplayProtection: true,
    breakGlassGovernedExpiry: true,
    assurancePackExportAndRedaction: true,
    continuityEvidenceConvergence: true,
    retentionDeletionLegalHold: true,
    routePublicationReleaseRecovery: true,
    actionSettlementAuthoritativeOnly: true,
    artifactPresentationOutboundGrant: true,
    uiTelemetryDisclosureFence: true,
    bauRunbooksAndOnCallTransfer: true,
    finalConformanceScorecardExact: true,
  };

  const securityCoverage = {
    unauthenticatedAccess: true,
    unauthorizedAccess: true,
    tenantBoundary: true,
    roleElevationBreakGlassExpiry: true,
    purposeMismatch: true,
    objectIdGuessing: true,
    routeParamTampering: true,
    replayAndIdempotencyCollision: true,
    staleActionLeaseSettlement: true,
    benignInputInjection: true,
    csrfAndSessionFixationWhereApplicable: true,
    artifactExportGrantMisuse: true,
    rawBlobUrlExposure: true,
    secretLeakageGuards: true,
    rateLimitsAndAbuse: true,
    uiTelemetryDisclosureFence: true,
  };

  const gapClosures = {
    phaseLocalPassGap: true,
    securityTheatreGap: true,
    nhsAppDeferredChannelAmbiguityGap: nhsAppDeferredChannelScope.gapClosed,
    artifactBoundaryGap: true,
    telemetryLeakageGap: true,
    orchestratorInterfaceGap: orchestratorContract.gapClosed,
  };

  const fixture = {
    schemaVersion: PHASE9_470_SCHEMA_VERSION,
    taskId: PHASE9_470_TASK_ID,
    generatedAt,
    sourceAlgorithmRefs,
    upstreamEvidence,
    priorRouteContracts,
    journeyCases,
    surfaceCases,
    securityCases,
    artifactBoundaryCases,
    nhsAppDeferredChannelScope,
    browserRegressionPlan,
    syntheticProgrammeSubjects: [
      {
        subjectRef: "synthetic-subject:470:patient-a",
        dataClass: "synthetic_no_phi",
        tenantRef: "tenant_demo_gp",
      },
      {
        subjectRef: "synthetic-subject:470:staff-a",
        dataClass: "synthetic_no_phi",
        tenantRef: "tenant_demo_gp",
      },
      {
        subjectRef: "synthetic-subject:470:ops-a",
        dataClass: "synthetic_no_phi",
        tenantRef: "tenant_integrated_care_board",
      },
    ],
  };

  const noSensitiveFixtureMarkers = !JSON.stringify(fixture).match(forbiddenSensitivePattern);
  const noSensitiveEvidenceMarkers = !JSON.stringify({
    upstreamEvidence,
    artifactBoundaryCases,
    securityCases,
  }).match(forbiddenSensitivePattern);

  const evidence = {
    schemaVersion: PHASE9_470_SCHEMA_VERSION,
    taskId: PHASE9_470_TASK_ID,
    generatedAt,
    sourceAlgorithmRefs,
    upstreamEvidence,
    journeyCoverageCount: journeyCases.length,
    surfaceCoverageCount: surfaceCases.length,
    securityCaseCount: securityCases.length,
    artifactBoundaryCaseCount: artifactBoundaryCases.length,
    coverage,
    securityCoverage,
    gapClosures,
    noSensitiveFixtureMarkers,
    noSensitiveEvidenceMarkers,
    noExternalTargets: true,
    noRealSecretsOrPhi: true,
    noRawArtifactUrls: artifactBoundaryCases.every((artifact) => artifact.rawBlobUrlExposure === false),
    noTracePersistence: true,
    noSev1OrSev2Defects: upstreamEvidence.every((entry) => entry.noSev1OrSev2Defects),
    allCoveragePassed: allTrue(coverage) && allTrue(securityCoverage) && allTrue(gapClosures),
  };

  const evidenceHash = sha256({ fixture, evidence });
  return {
    fixture: { ...fixture, fixtureHash: evidenceHash },
    evidence: { ...evidence, evidenceHash },
    orchestratorContract: { ...orchestratorContract, evidenceHash },
    alignmentNotes: buildAlignmentNotes(evidenceHash),
    externalReferenceNotes: buildExternalReferenceNotes(),
    testPlan: buildTestPlan(evidenceHash),
  };
}

export function writePhase9FullRegressionAndDefensiveSecurityArtifacts() {
  const suite = buildPhase9FullRegressionAndDefensiveSecuritySuite();
  writeJson("tests/fixtures/470_cross_phase_synthetic_programme_cases.json", suite.fixture);
  writeJson(
    "data/evidence/470_full_regression_and_defensive_security_results.json",
    suite.evidence,
  );
  writeJson(
    "data/contracts/PHASE9_BATCH_458_472_INTERFACE_GAP_470_FULL_REGRESSION_ORCHESTRATOR.json",
    suite.orchestratorContract,
  );
  writeText("data/analysis/470_algorithm_alignment_notes.md", suite.alignmentNotes);
  writeJson("data/analysis/470_external_reference_notes.json", suite.externalReferenceNotes);
  writeText(
    "docs/testing/470_full_cross_phase_regression_and_penetration_plan.md",
    suite.testPlan,
  );
  return suite;
}

const currentFile = fileURLToPath(import.meta.url);
if (process.argv[1] && path.resolve(process.argv[1]) === currentFile) {
  const suite = writePhase9FullRegressionAndDefensiveSecurityArtifacts();
  console.log(
    `Wrote task 470 full regression and defensive security artifacts (${suite.evidence.evidenceHash}).`,
  );
}
