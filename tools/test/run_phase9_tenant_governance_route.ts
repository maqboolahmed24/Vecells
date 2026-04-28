import fs from "node:fs";
import path from "node:path";
import {
  TENANT_GOVERNANCE_SCHEMA_VERSION,
  createTenantGovernanceFixture,
  createTenantGovernanceProjection,
} from "../../apps/governance-console/src/tenant-governance-phase9.model";

const root = process.cwd();
const contractsDir = path.join(root, "data", "contracts");
const fixturesDir = path.join(root, "data", "fixtures");
const analysisDir = path.join(root, "data", "analysis");

const contractPath = path.join(contractsDir, "457_phase9_tenant_governance_route_contract.json");
const fixturePath = path.join(fixturesDir, "457_phase9_tenant_governance_route_fixtures.json");
const notePath = path.join(analysisDir, "457_tenant_governance_implementation_note.md");

const fixture = createTenantGovernanceFixture();
const normal = fixture.scenarioProjections.normal;
const blocked = fixture.scenarioProjections.blocked;
const stale = fixture.scenarioProjections.stale;
const settlementPending = fixture.scenarioProjections.settlement_pending;
const filteredPreserve = createTenantGovernanceProjection({
  selectedTenantRef: "tenant:harbour-west",
  matrixFilter: "blocked",
});

const contractArtifact = {
  schemaVersion: TENANT_GOVERNANCE_SCHEMA_VERSION,
  routes: fixture.routes,
  sourceAlgorithmRefs: fixture.sourceAlgorithmRefs,
  upstreamSchemaVersions: fixture.upstreamSchemaVersions,
  automationAnchors: fixture.automationAnchors,
  matrixCoverage: {
    domainCount: normal.matrixDomains.length,
    rowCount: normal.tenantBaselineMatrix.length,
    requiredDomainsPresent: [
      "enabled_capabilities",
      "policy_packs",
      "integrations",
      "standards_versions",
      "visibility_access_policy",
      "pharmacy_overrides",
      "callback_messaging_policy",
      "migration_backfill_posture",
      "approval_state",
      "drift_state",
    ].every((domainRef) => normal.matrixDomains.some((domain) => domain.domainRef === domainRef)),
    cellsExposeExactEffectiveInheritanceAndVersion: normal.tenantBaselineMatrix.every((row) =>
      row.cells.every(
        (cell) =>
          cell.exactValue.length > 0 &&
          cell.effectiveValue.length > 0 &&
          cell.inheritanceState.length > 0 &&
          cell.versionRef.length > 0,
      ),
    ),
    selectedTenantPreservedUnderFilters:
      filteredPreserve.tenantBaselineMatrix[0]?.tenantRef === "tenant:harbour-west" &&
      filteredPreserve.tenantBaselineMatrix[0]?.preservedByFilter === true,
  },
  watchlistAuthority: {
    usesTask448Contract:
      normal.upstreamSchemaVersions["448"] === "448.phase9.tenant-config-governance.v1",
    currentWatchlistRef: normal.standardsWatchlist.standardsDependencyWatchlistRef,
    currentWatchlistHash: normal.standardsWatchlist.watchlistHash,
    blockedWatchlistRef: blocked.standardsWatchlist.standardsDependencyWatchlistRef,
    blockedWatchlistHash: blocked.standardsWatchlist.watchlistHash,
    blockedFindingsVisible: blocked.standardsWatchlist.blockingFindingRefs.length >= 3,
    legacyFindingsVisible: blocked.legacyReferenceFindings.length > 0,
    policyCompatibilityAlertsVisible: blocked.policyCompatibilityAlerts.length > 0,
    standardsExceptionsVisible: blocked.standardsExceptions.length > 0,
    noInterfaceGapRequired: normal.noInterfaceGapRequired === true,
  },
  promotionSafety: {
    compilationRecordRef: normal.promotionApprovalStatus.configCompilationRecordRef,
    simulationEnvelopeRef: normal.promotionApprovalStatus.configSimulationEnvelopeRef,
    releaseFreezeTupleHash: normal.releaseWatchStatus.releaseFreezeTupleHash,
    migrationExecutionTupleHash: normal.migrationPosture.migrationExecutionTupleHash,
    compileAndPromoteFrozenUntilAllTuplesSettle: [normal, stale, blocked, settlementPending].every(
      (projection) =>
        projection.actionRail
          .filter((action) => ["compile_candidate", "promote_bundle"].includes(action.actionType))
          .every((action) => action.allowed === false),
    ),
    staleRequiresRevalidation: stale.actionRail.some(
      (action) => action.actionType === "revalidate_watchlist" && action.allowed,
    ),
    settlementPendingBlocksPromotion:
      settlementPending.promotionApprovalStatus.blockerRefs.includes(
        "governance-action-settlement:pending",
      ) && settlementPending.releaseWatchStatus.waveSettlementState === "pending",
  },
  scenarioCoverage: Object.fromEntries(
    Object.entries(fixture.scenarioProjections).map(([scenarioState, projection]) => [
      scenarioState,
      {
        bindingState: projection.bindingState,
        actionControlState: projection.actionControlState,
        watchlistState: projection.watchlistState,
      },
    ]),
  ),
  noGapArtifactRequired: true,
};

fs.mkdirSync(contractsDir, { recursive: true });
fs.mkdirSync(fixturesDir, { recursive: true });
fs.mkdirSync(analysisDir, { recursive: true });
fs.writeFileSync(contractPath, `${JSON.stringify(contractArtifact, null, 2)}\n`);
fs.writeFileSync(fixturePath, `${JSON.stringify(fixture, null, 2)}\n`);
fs.writeFileSync(
  notePath,
  [
    "# Phase 9 Tenant Governance Route Implementation Note",
    "",
    "Task 457 adds `/ops/governance/tenants` and `/ops/config/tenants` tenant governance surfaces to the governance shell. The surface keeps the tenant baseline matrix, config diff viewer, policy-pack history, standards/dependency watchlist, legacy findings, policy compatibility alerts, standards exceptions, promotion approvals, release watch, and migration/backfill posture in one review context.",
    "",
    "The frontend uses the canonical task 448 tenant-config governance outputs. The same StandardsDependencyWatchlist hash is shown beside compilation, simulation, approval, release freeze, migration, read-path compatibility, and projection backfill posture.",
    "",
    "Compile and promote controls remain unavailable until compilation, simulation, watchlist, approvals, migration/backfill, continuity evidence, and release-watch settlement requirements are all satisfied. Stale or drifted watchlists expose revalidation instead of silently refreshing the selected tenant anchor.",
    "",
    "No `PHASE9_BATCH_443_457_INTERFACE_GAP_457_TENANT_WATCHLIST_INPUTS.json` artifact is required because the 448 contract already provides the canonical tenant config watchlist, findings, exceptions, compilation record, simulation envelope, and promotion readiness inputs.",
    "",
  ].join("\n"),
);

console.log(`Phase 9 tenant governance route contract: ${path.relative(root, contractPath)}`);
console.log(`Phase 9 tenant governance route fixture: ${path.relative(root, fixturePath)}`);
