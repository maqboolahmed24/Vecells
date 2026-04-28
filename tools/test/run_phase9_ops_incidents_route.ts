import fs from "node:fs";
import path from "node:path";
import { format, resolveConfig } from "prettier";
import {
  OPS_INCIDENTS_SCHEMA_VERSION,
  OPS_INCIDENTS_TASK_ID,
  createOpsIncidentsFixture,
} from "../../apps/ops-console/src/operations-incidents-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "456_phase9_ops_incidents_route_contract.json");
const fixturePath = path.join(fixturesDir, "456_phase9_ops_incidents_route_fixtures.json");
const notesPath = path.join(analysisDir, "456_ops_incidents_implementation_note.md");

const fixture = createOpsIncidentsFixture();

async function formatJson(value: unknown, filePath: string): Promise<string> {
  const config = (await resolveConfig(filePath)) ?? {};
  return format(JSON.stringify(value, null, 2), { ...config, filepath: filePath });
}

const normal = fixture.scenarioProjections.normal;
const empty = fixture.scenarioProjections.empty;
const stale = fixture.scenarioProjections.stale;
const degraded = fixture.scenarioProjections.degraded;
const blocked = fixture.scenarioProjections.blocked;
const permissionDenied = fixture.scenarioProjections.permission_denied;
const settlementPending = fixture.scenarioProjections.settlement_pending;

const contractArtifact = {
  taskId: OPS_INCIDENTS_TASK_ID,
  schemaVersion: OPS_INCIDENTS_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  requiredSurfaces: [
    "IncidentDesk",
    "IncidentCommandStrip",
    "IncidentQueue",
    "NearMissIntake",
    "SeverityBoard",
    "ContainmentTimeline",
    "ReportabilityChecklist",
    "ExternalReportingHandoff",
    "PostIncidentReview",
    "IncidentCapaLinks",
    "IncidentEvidenceLinks",
    "IncidentTelemetryRedaction",
  ],
  automationAnchors: fixture.automationAnchors,
  scenarioStates: Object.keys(fixture.scenarioProjections),
  reportabilityAuthority: {
    normalDecision: normal.reportabilityChecklist.decision,
    normalHandoff: normal.externalReportingHandoff.handoffState,
    pendingDecision: settlementPending.reportabilityChecklist.decision,
    blockedDecision: blocked.reportabilityChecklist.decision,
    staleDecision: stale.reportabilityChecklist.decision,
    permissionDecision: permissionDenied.reportabilityChecklist.decision,
    degradedDecision: degraded.reportabilityChecklist.decision,
  },
  containmentAuthority: {
    normalStates: normal.containmentTimeline.map((event) => event.state),
    pendingStates: settlementPending.containmentTimeline.map((event) => event.state),
    blockedStates: blocked.containmentTimeline.map((event) => event.state),
  },
  closureAuthority: {
    normalClosureState: normal.pirPanel.closureState,
    normalClosureBlockers: normal.pirPanel.closureBlockerRefs,
    blockedClosureState: blocked.pirPanel.closureState,
    emptyClosureState: empty.pirPanel.closureState,
  },
  nearMissAuthority: {
    nearMissCount: normal.commandStrip.nearMissCount,
    intakeAllowed: normal.nearMissIntake.allowed,
    degradedIntakeAllowed: degraded.nearMissIntake.allowed,
    settlementCopy: settlementPending.nearMissIntake.settlementCopy,
  },
  evidenceAuthority: {
    evidenceLinks: normal.evidenceLinks.map((link) => ({
      targetSurface: link.targetSurface,
      safeReturnTokenRef: link.safeReturnTokenRef,
      payloadClass: link.payloadClass,
    })),
    capaLinks: normal.capaLinks.map((link) => link.linkRef),
  },
  redactionAuthority: {
    uiEventEnvelopeRef: normal.telemetryRedaction.uiEventEnvelopeRef,
    transitionSettlementRef: normal.telemetryRedaction.transitionSettlementRef,
    disclosureFenceRef: normal.telemetryRedaction.disclosureFenceRef,
    permittedPayloadClass: normal.telemetryRedaction.permittedPayloadClass,
    redactedFields: normal.telemetryRedaction.redactedFields,
  },
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });

fs.writeFileSync(contractPath, await formatJson(contractArtifact, contractPath));
fs.writeFileSync(fixturePath, await formatJson(fixture, fixturePath));
fs.writeFileSync(
  notesPath,
  [
    "# Task 456 Operations Incidents Implementation Note",
    "",
    "`/ops/incidents` now renders a same-shell Incident Desk with a command strip, filterable incident and near-miss queue, near-miss intake, severity board, containment timeline, reportability checklist, external DSPT handoff, post-incident review, CAPA/training links, safe-return evidence links, and UI telemetry redaction proof.",
    "",
    "Reportability uses the task 447 workflow authority. The normal path shows `reported` and acknowledged handoff, settlement-pending keeps `reportable_pending_submission`, blocked and permission-limited states expose `insufficient_facts_blocked`, and stale projections remain `superseded` until revalidated.",
    "",
    "Closure is deliberately blocked until PIR, CAPA, training drill, and reportability all complete. Local UI actions expose settlement refs and disabled reasons instead of implying command success.",
    "",
    "The route carries `UIEventEnvelope`, `UITransitionSettlementRecord`, and `UITelemetryDisclosureFence` refs and only permits metadata-only telemetry. Incident summaries, patient identifiers, route params, artifact fragments, and investigation keys are listed as redacted fields.",
    "",
    "Task 456 reuses task 439 timeline, task 440 pack, task 441 CAPA/attestation, task 446 quarantine, and task 447 incident reportability contracts, so no `PHASE9_BATCH_443_457_INTERFACE_GAP_456_REPORTABILITY_INPUTS.json` artifact is required.",
    "",
    "Playwright evidence is written to `.artifacts/operations-incidents-456` for normal, empty, stale, degraded, blocked, permission-denied, settlement-pending, reduced-motion, desktop, laptop, tablet, and narrow mission-stack states.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 ops incidents contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 ops incidents fixture: ${path.relative(root, fixturePath)}`);
