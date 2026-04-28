import fs from "node:fs";
import path from "node:path";

import {
  assert397MonthlyPackRedactionSafe,
  buildDefault397ChannelReleaseCohortManifest,
  buildDefault397ReleaseGuardrailPolicyManifest,
  buildDefault397RouteFreezeDispositionManifest,
  create397ReleaseControlApplication,
  generate397MonthlyPerformancePack,
  rehearse397GuardrailFreezeAndKillSwitch,
  submit397JourneyChangeNotice,
} from "../../services/command-api/src/phase7-nhs-app-release-control-service.ts";

const ROOT = "/Users/test/Code/V";
const OUTPUT_DIR = path.join(ROOT, "output", "scheduled");
const SENSITIVE_PATTERN =
  /Bearer\s+[A-Za-z0-9._-]+|eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.?[A-Za-z0-9_-]*|grantId|patientId|nhsNumber|nhs_number|access_token|id_token|assertedLoginIdentity|[?&](?:token|jwt|grant|nhsNumber)=/iu;

function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertSafe(value: unknown, label: string): void {
  assertCondition(!SENSITIVE_PATTERN.test(JSON.stringify(value)), `${label} leaked sensitive data`);
}

export async function run(): Promise<void> {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  const cohortManifest = buildDefault397ChannelReleaseCohortManifest();
  const guardrailManifest = buildDefault397ReleaseGuardrailPolicyManifest();
  const dispositionManifest = buildDefault397RouteFreezeDispositionManifest();
  const application = create397ReleaseControlApplication({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });

  const packs = ["2026-05", "2026-06"].map((period) =>
    generate397MonthlyPerformancePack({
      application,
      cohortManifest,
      guardrailManifest,
      dispositionManifest,
      environment: "limited_release",
      period,
      observationWindow: { sampleSize: 80, telemetryPresent: true },
    }),
  );
  for (const pack of packs) {
    const redaction = assert397MonthlyPackRedactionSafe(pack);
    assertCondition(redaction.safeForExport, `monthly pack ${pack.period} failed redaction`);
    assertCondition(
      pack.guardrailBreaches.length === 0,
      `monthly pack ${pack.period} has breaches`,
    );
    assertSafe(pack, `monthly pack ${pack.period}`);
  }

  const rehearsal = rehearse397GuardrailFreezeAndKillSwitch({
    cohortManifest,
    guardrailManifest,
    dispositionManifest,
  });
  assertCondition(rehearsal.disabledJumpOffWithoutRedeploy, "rollback rehearsal not reversible");

  const notice = submit397JourneyChangeNotice({
    application,
    cohortManifest,
    changeType: "minor",
    affectedJourneys: ["jp_start_medical_request"],
    submittedAt: "2026-04-27T12:00:00.000Z",
    plannedChangeAt: "2026-05-30T12:00:00.000Z",
    integrationManagerRef: "IntegrationManager:401:scheduled-pack",
  });
  assertCondition(notice.approvalState === "submitted", "scheduled change notice not submitted");

  const proof = {
    taskId: "401",
    jobId: "ScheduledJob:401:monthly-pack-and-rollback",
    generatedAt: "2026-04-27T12:00:00.000Z",
    packs,
    rehearsal: {
      rehearsalId: rehearsal.rehearsalId,
      freezeDecision: rehearsal.freezeDecision.decision,
      killSwitchDecision: rehearsal.killSwitchDecision.decision,
      disabledJumpOffWithoutRedeploy: rehearsal.disabledJumpOffWithoutRedeploy,
      rollbackActionRef: rehearsal.rollbackActionRef,
    },
    notice,
  };
  assertSafe(proof, "scheduled proof");
  fs.writeFileSync(
    path.join(OUTPUT_DIR, "401_monthly_pack_and_rollback_job.json"),
    JSON.stringify(proof, null, 2),
    "utf8",
  );

  console.log("401_monthly_pack_and_rollback_job: ok");
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
