import fs from "node:fs";
import path from "node:path";
import {
  ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF,
  ROLE_SCOPE_STUDIO_SCHEMA_VERSION,
  createRoleScopeStudioFixture,
  createRoleScopeStudioProjection,
} from "../../apps/governance-console/src/role-scope-studio-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "458_phase9_role_scope_studio_route_contract.json");
const fixturePath = path.join(fixturesDir, "458_role_scope_studio_fixtures.json");
const notePath = path.join(analysisDir, "458_role_scope_studio_implementation_note.md");

const fixture = createRoleScopeStudioFixture();
const normal = fixture.scenarioProjections.normal;
const stale = fixture.scenarioProjections.stale;
const blocked = fixture.scenarioProjections.blocked;
const permissionDenied = fixture.scenarioProjections.permission_denied;
const frozen = fixture.scenarioProjections.frozen;
const masked = fixture.scenarioProjections.masked;
const incidentPersona = createRoleScopeStudioProjection({
  selectedPersonaRef: "persona:incident-commander",
  selectedRouteFamilyRef: "route-family:incident-command",
});

const allCellStates = new Set(
  normal.roleGrantMatrix.rows.flatMap((row) => row.cells.map((cell) => cell.state)),
);
const requiredFreezeKinds = [
  "channel_freeze",
  "config_freeze",
  "standards_watchlist",
  "recovery_only",
  "assurance_graph",
  "incident_command",
];

const contractArtifact = {
  schemaVersion: ROLE_SCOPE_STUDIO_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  gapArtifactRef: ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF,
  automationAnchors: fixture.automationAnchors,
  matrixCoverage: {
    columnCount: normal.roleGrantMatrix.capabilityColumns.length,
    rowCount: normal.roleGrantMatrix.rows.length,
    requiredStatesPresent: ["live", "diagnostic", "recovery", "denied", "frozen", "masked"].every(
      (state) => allCellStates.has(state),
    ),
    navigationIsNotAuthorization: normal.roleGrantMatrix.rows.every((row) =>
      row.cells.every(
        (cell) =>
          cell.authorityRef === "phase5-acting-context-visibility-kernel" &&
          cell.mutableControlState === "not_mutable_in_preview",
      ),
    ),
    selectedRouteDrivesPreview:
      incidentPersona.roleGrantMatrix.selectedRouteFamilyRef === "route-family:incident-command" &&
      incidentPersona.effectiveAccessPreview.objectTypeRef === "incident_review",
  },
  accessPreviewSafety: {
    usesGapArtifact: normal.gapArtifactRef === ROLE_SCOPE_STUDIO_GAP_ARTIFACT_REF,
    noLiveMutationControls: normal.noLiveMutationControls === true,
    hiddenFieldsNotRendered: masked.accessPreviewArtifactMask.hiddenFieldsNotRendered === true,
    telemetryRedacted: masked.accessPreviewArtifactMask.telemetryRedacted === true,
    syntheticFixtureOnly: masked.accessPreviewArtifactMask.syntheticFixtureOnly === true,
    permissionDeniedDecisionIsDeny: permissionDenied.effectiveAccessPreview.decision === "deny",
    permissionDeniedMetadataOnly:
      permissionDenied.effectiveAccessPreview.artifactMode === "metadata_only",
    maskedPreviewState: masked.effectiveAccessPreview.previewState === "masked",
    telemetryFenceBlocksSensitiveKeys:
      normal.telemetryDisclosureFence.blockedPayloadKeys.length >= 5 &&
      normal.telemetryDisclosureFence.rawSensitiveTextAbsent === true,
  },
  breakGlassPosture: {
    incidentPersonaShowsActiveElevation:
      incidentPersona.breakGlassElevationSummary.reviewState === "active" &&
      incidentPersona.breakGlassElevationSummary.reasonAdequacyState === "adequate",
    blockedCannotInvoke: blocked.breakGlassElevationSummary.eligibilityState === "not_eligible",
  },
  freezeCardCoverage: {
    cardCount: normal.releaseFreezeCards.length,
    requiredKindsPresent: requiredFreezeKinds.every((kind) =>
      normal.releaseFreezeCards.some((card) => card.freezeKind === kind),
    ),
    frozenDowngradesExportApproval:
      frozen.roleGrantMatrix.rows.length > 0 &&
      frozen.roleGrantMatrix.rows.every((row) =>
        row.cells
          .filter((cell) => ["export", "approval", "admin"].includes(cell.columnRef))
          .every((cell) => cell.state === "frozen"),
      ),
    staleDowngradesLiveToDiagnostic: stale.roleGrantMatrix.rows.some((row) =>
      row.cells.some((cell) => cell.columnRef === "ordinary" && cell.state === "diagnostic"),
    ),
  },
  deniedActionSafety: {
    explainerCount: normal.deniedActionExplainers.length,
    allExplainSourcePredicateConsequenceAndNextAction: normal.deniedActionExplainers.every(
      (explainer) =>
        explainer.sourceObjectRef.length > 0 &&
        explainer.failedPredicate.length > 0 &&
        explainer.consequence.length > 0 &&
        explainer.nextSafeAction.length > 0,
    ),
    exportAlwaysBlocked: normal.actionRail.some(
      (action) => action.actionType === "export_preview" && action.allowed === false,
    ),
    approveAlwaysBlocked: normal.actionRail.some(
      (action) => action.actionType === "approve_role" && action.allowed === false,
    ),
  },
  returnContext: {
    preservesGovernanceHandoff:
      normal.governanceReturnContextStrip.returnTokenRef.startsWith("OpsGovernanceHandoff:"),
    permissionDeniedReturnDenied:
      permissionDenied.governanceReturnContextStrip.safeReturnState === "denied",
  },
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        bindingState: projection.bindingState,
        actionControlState: projection.actionControlState,
        previewState: projection.effectiveAccessPreview.previewState,
        releaseFreezeVerdict: projection.governanceScopeRibbon.releaseFreezeVerdict,
      },
    ]),
  ),
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(
  notePath,
  [
    "# Phase 9 Role Scope Studio Implementation Note",
    "",
    "Task 458 adds `/ops/access/role-scope-studio` to the governance console. The surface binds a persistent scope ribbon, role-scope matrix, effective access preview, mask diff, break-glass/elevation summary, release-freeze card rail, denied-action explainer, tuple inspector, telemetry disclosure fence, and return context strip.",
    "",
    "A dedicated canonical frontend access-preview read model is not present in the repository, so the task records `PHASE9_BATCH_458_472_INTERFACE_GAP_458_ACCESS_PREVIEW_READ_MODEL.json` and uses a preview-only adapter over canonical acting-scope, visibility, minimum-necessary, release-freeze, and settlement refs.",
    "",
    "The studio is fail-closed: navigation is not authorization, hidden fields are not rendered, masked fields use deterministic synthetic labels, export and role approval remain blocked, break-glass is not flattened into a role toggle, and stale/frozen/degraded/permission-missing states are visible.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 role scope studio contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 role scope studio fixture: ${path.relative(root, fixturePath)}`);
