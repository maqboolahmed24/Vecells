import { serviceDefinition } from "../../services/command-api/src/service-definition.ts";
import {
  assert397MonthlyPackRedactionSafe,
  buildDefault397ChannelReleaseCohortManifest,
  buildDefault397ReleaseGuardrailPolicyManifest,
  buildDefault397RouteFreezeDispositionManifest,
  create397ReleaseControlApplication,
  create397ReleaseControlReadinessReport,
  evaluate397ReleaseGuardrails,
  generate397MonthlyPerformancePack,
  phase7NhsAppReleaseControlRoutes,
  release397FreezeWithFreshGreenWindow,
  rehearse397GuardrailFreezeAndKillSwitch,
  submit397JourneyChangeNotice,
  validateReleaseControlsFromFiles,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";
import { createEmbeddedA11yCoverageRows } from "../../apps/patient-web/src/embedded-accessibility-responsive.model.ts";

const ROOT = "/Users/test/Code/V";
const SENSITIVE_PROOF_PATTERN =
  /Bearer\s+[A-Za-z0-9._-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.?[A-Za-z0-9_-]*|grantId|patientId|nhsNumber|nhs_number|access_token|id_token|assertedLoginIdentity|[?&](?:token|jwt|grant|nhsNumber)=/iu;

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertNoSensitiveProof(value: unknown, label: string): void {
  const serialized = JSON.stringify(value);
  assertCondition(
    !SENSITIVE_PROOF_PATTERN.test(serialized),
    `${label} leaked sensitive proof data`,
  );
}

export async function run(): Promise<void> {
  for (const route of phase7NhsAppReleaseControlRoutes) {
    assertCondition(
      serviceDefinition.routeCatalog.some((entry) => entry.routeId === route.routeId),
      `release-control route missing from command API: ${route.routeId}`,
    );
  }

  const cohortManifest = buildDefault397ChannelReleaseCohortManifest();
  const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
  const dispositionManifest = buildDefault397RouteFreezeDispositionManifest();
  const cohortId = cohortManifest.cohorts[0]?.cohortId;
  assertCondition(Boolean(cohortId), "limited-release cohort missing");

  const reportFromFiles = validateReleaseControlsFromFiles({
    root: ROOT,
    cohortManifestPath: "data/config/397_channel_release_cohort_manifest.example.json",
    guardrailManifestPath: "data/config/397_release_guardrail_policy_manifest.example.json",
    dispositionManifestPath: "data/config/397_route_freeze_disposition_manifest.example.json",
  });
  assertCondition(
    reportFromFiles.readinessState === "ready",
    "checked-in release controls not ready",
  );
  assertCondition(
    reportFromFiles.machineReadableSummary.rollbackWithoutRedeploy,
    "release controls are not reversible without redeploy",
  );

  const generatedReport = create397ReleaseControlReadinessReport({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  assertCondition(generatedReport.readinessState === "ready", "generated release report not ready");
  assertCondition(
    generatedReport.machineReadableSummary.allFreezeTriggersConfigured,
    "not all freeze triggers are configured",
  );

  const limitedRelease = cohortManifest.cohorts.find(
    (cohort) => cohort.releaseStage === "limited_release",
  );
  const fullRelease = cohortManifest.cohorts.find(
    (cohort) => cohort.releaseStage === "full_release",
  );
  assertCondition(limitedRelease?.reversibleWithoutRedeploy, "limited release is not reversible");
  assertCondition(fullRelease?.cohortState === "disabled", "full release should remain disabled");
  assertCondition(
    fullRelease.exposureCeiling === 0,
    "full release exposure should be zero before approval",
  );

  const modes = new Set(dispositionManifest.dispositions.map((entry) => entry.freezeMode));
  for (const requiredMode of ["read_only", "placeholder_only", "redirect_to_safe_route"]) {
    assertCondition(modes.has(requiredMode), `missing route-freeze mode ${requiredMode}`);
  }

  const coverageRows = createEmbeddedA11yCoverageRows();
  assertCondition(coverageRows.length >= 7, "embedded accessibility route matrix incomplete");
  assertCondition(
    coverageRows.every((row) => row.contractCount >= 10),
    "embedded accessibility coverage row missing required contracts",
  );

  const triggerScenarios = [
    {
      trigger: "telemetry_missing",
      observationWindow: { telemetryPresent: false },
    },
    {
      trigger: "threshold_breach",
      observationWindow: { journeyErrorRate: 0.04 },
    },
    {
      trigger: "assurance_slice_degraded",
      observationWindow: { assuranceSliceState: "degraded" as const },
    },
    {
      trigger: "compatibility_drift",
      observationWindow: { compatibilityEvidenceState: "stale" as const },
    },
    {
      trigger: "continuity_evidence_degraded",
      observationWindow: { continuityEvidenceState: "degraded" as const },
    },
  ] as const;

  for (const scenario of triggerScenarios) {
    const guardrails = evaluate397ReleaseGuardrails({
      guardrailManifest,
      observationWindow: scenario.observationWindow,
    });
    assertCondition(
      guardrails.triggerTypes.includes(scenario.trigger),
      `guardrail evaluator missing ${scenario.trigger}`,
    );
    const application = create397ReleaseControlApplication({
      cohortManifest,
      guardrailManifest,
      dispositionManifest,
    });
    const decision = application.evaluateCohort({
      cohortId,
      observationWindow: scenario.observationWindow,
      operatorNoteRef: `OperatorNote:401:${scenario.trigger}`,
    });
    assertCondition(
      decision.decision === "freeze" || decision.decision === "rollback_recommendation",
      `scenario ${scenario.trigger} did not freeze release`,
    );
    assertCondition(
      decision.freezeRecord?.triggerType === scenario.trigger,
      `freeze record trigger drifted for ${scenario.trigger}`,
    );
    assertCondition(
      decision.routeDispositions.length > 0,
      `${scenario.trigger} lacked dispositions`,
    );
  }

  const monthlyPack = generate397MonthlyPerformancePack({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
    environment: "limited_release",
    period: "2026-05",
  });
  const redaction = assert397MonthlyPackRedactionSafe(monthlyPack);
  assertCondition(redaction.safeForExport, "monthly pack redaction failed");
  assertCondition(monthlyPack.eventContractRefs.length >= 1, "monthly pack lacks event contracts");
  assertCondition(
    monthlyPack.guardrailBreaches.length === 0,
    "monthly pack has guardrail breaches",
  );
  assertNoSensitiveProof(monthlyPack, "monthly pack");

  const rehearsal = rehearse397GuardrailFreezeAndKillSwitch({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  assertCondition(
    rehearsal.freezeDecision.decision === "freeze",
    "freeze rehearsal did not freeze",
  );
  assertCondition(
    rehearsal.killSwitchDecision.decision === "kill_switch_activation",
    "kill-switch rehearsal did not activate",
  );
  assertCondition(
    rehearsal.disabledJumpOffWithoutRedeploy,
    "kill-switch rehearsal did not disable jump-off without redeploy",
  );

  const releaseReadyCohortManifest = {
    ...cohortManifest,
    cohorts: cohortManifest.cohorts.map((cohort) => ({
      ...cohort,
      enabledJourneys: ["jp_pharmacy_status"],
    })),
  };
  const releaseReadyCohortId = releaseReadyCohortManifest.cohorts[0]?.cohortId;
  assertCondition(Boolean(releaseReadyCohortId), "release-ready cohort missing");
  const releaseApplication = create397ReleaseControlApplication({
    cohortManifest: releaseReadyCohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  const enabled = releaseApplication.evaluateCohort({ cohortId: releaseReadyCohortId });
  const frozen = releaseApplication.evaluateCohort({
    cohortId: releaseReadyCohortId,
    observationWindow: { journeyErrorRate: 0.04 },
    operatorNoteRef: "OperatorNote:401:release-rehearsal-freeze",
  });
  assertCondition(enabled.decision === "enable", "cohort did not enable under green observation");
  assertCondition(Boolean(frozen.freezeRecord), "freeze rehearsal did not create freeze record");
  const released = release397FreezeWithFreshGreenWindow({
    application: releaseApplication,
    guardrailManifest,
    freezeRecordId: frozen.freezeRecord?.freezeRecordId ?? "missing",
    expectedManifestVersion: frozen.freezeRecord?.manifestVersionRef ?? "missing",
    expectedReleaseApprovalFreezeRef: frozen.freezeRecord?.releaseApprovalFreezeRef ?? "missing",
    operatorNoteRef: "OperatorNote:401:green-window-release",
    greenWindowDays: 7,
    observationWindow: { sampleSize: 100, telemetryPresent: true },
  });
  assertCondition(released.freezeState === "released", "freeze release did not complete");

  const minorNotice = submit397JourneyChangeNotice({
    application: releaseApplication,
    cohortManifest,
    changeType: "minor",
    affectedJourneys: ["jp_request_status"],
    submittedAt: "2026-04-27T12:00:00.000Z",
    plannedChangeAt: "2026-05-30T12:00:00.000Z",
    integrationManagerRef: "IntegrationManager:401:nhs-app-phase7",
  });
  const blockedNotice = submit397JourneyChangeNotice({
    application: releaseApplication,
    cohortManifest,
    changeType: "significant",
    affectedJourneys: ["jp_request_status"],
    submittedAt: "2026-04-27T12:00:00.000Z",
    plannedChangeAt: "2026-06-01T12:00:00.000Z",
    integrationManagerRef: "IntegrationManager:401:nhs-app-phase7",
  });
  assertCondition(minorNotice.approvalState === "submitted", "minor notice not submitted");
  assertCondition(
    blockedNotice.approvalState === "blocked_lead_time",
    "significant notice did not enforce lead time",
  );

  const auditDecisions = releaseApplication
    .listEvidence()
    .auditEvents.map((event) => event.decision);
  for (const expectedDecision of ["enable", "freeze", "release"]) {
    assertCondition(
      auditDecisions.includes(expectedDecision),
      `release audit missing ${expectedDecision}`,
    );
  }
  assertNoSensitiveProof(releaseApplication.listEvidence(), "release audit evidence");

  console.log("401_release_readiness_contract: ok");
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
