import assert from "node:assert/strict";
import path from "node:path";
import { write480SeedArtifacts } from "../../tools/testing/run_480_final_uat_visual";
import {
  OUTPUT_ROOT,
  assertCleanRuntime,
  assertNoHorizontalOverflow,
  assertNoSensitiveSerialized,
  attachRuntimeGuards,
  expectAttribute,
  gotoAndWait,
  loadPlaywright,
  outputRelative,
  startViteApp,
  stopServer,
  writeAriaSnapshot,
  writeSuiteArtifactManifest,
} from "./480_final_uat.helpers";

const SUITE = "accessibility";
const PATIENT_PORT = 4370;
const STAFF_PORT = 4371;
const OPS_PORT = 4372;
const GOVERNANCE_PORT = 4373;

async function runScenario(
  context: any,
  scenarioId: string,
  exercise: (page: any) => Promise<readonly string[]>,
): Promise<readonly string[]> {
  const page = await context.newPage();
  const guards = attachRuntimeGuards(page);
  await context.tracing.start({ screenshots: true, snapshots: true, sources: true });
  try {
    const artifacts = await exercise(page);
    assertCleanRuntime(guards, scenarioId);
    const tracePath = path.join(OUTPUT_ROOT, `${scenarioId}.trace.zip`);
    await context.tracing.stop({ path: tracePath });
    await page.close();
    return [...artifacts, outputRelative(tracePath)];
  } catch (error) {
    const tracePath = path.join(OUTPUT_ROOT, `${scenarioId}.failure.trace.zip`);
    await context.tracing.stop({ path: tracePath });
    await page.close();
    throw error;
  }
}

export async function run(): Promise<void> {
  write480SeedArtifacts();
  const playwright = await loadPlaywright();
  const patient = await startViteApp("patient-web", PATIENT_PORT, "/home");
  const staff = await startViteApp("clinical-workspace", STAFF_PORT, "/workspace");
  const ops = await startViteApp("ops-console", OPS_PORT, "/ops/conformance?waveState=approved");
  const governance = await startViteApp(
    "governance-console",
    GOVERNANCE_PORT,
    "/ops/governance/records",
  );
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const desktop = await browser.newContext({
      viewport: { width: 1440, height: 1180 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const crossShell = await runScenario(
      desktop,
      "uat_480_accessibility_cross_shell_snapshots",
      async (page) => {
        const artifacts: string[] = [];
        const patientHome = await gotoAndWait(
          page,
          `${patient.baseUrl}/home`,
          "[data-testid='Patient_Home_Requests_Detail_Route']",
        );
        await page.getByRole("heading").first().waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              patientHome,
              `${SUITE}/uat_480_accessibility_cross_shell_snapshots.patient-home.aria.txt`,
            ),
          ),
        );

        const staffShell = await gotoAndWait(
          page,
          `${staff.baseUrl}/workspace`,
          "[data-testid='staff-shell-root']",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              staffShell,
              `${SUITE}/uat_480_accessibility_cross_shell_snapshots.staff-shell.aria.txt`,
            ),
          ),
        );

        await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/conformance?waveState=approved`,
          "[data-testid='release-476-planner']",
        );
        await page.locator("[data-testid='release-476-guardrail-table']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='release-476-guardrail-table']"),
              `${SUITE}/uat_480_accessibility_cross_shell_snapshots.release-table.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='release-476-blast-radius-matrix']"),
              `${SUITE}/uat_480_accessibility_cross_shell_snapshots.release-matrix.aria.txt`,
            ),
          ),
        );

        const records = await gotoAndWait(
          page,
          `${governance.baseUrl}/ops/governance/records`,
          "[data-testid='records-governance']",
        );
        await page.locator("[data-testid='records-selected-summary']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              records,
              `${SUITE}/uat_480_accessibility_cross_shell_snapshots.records.aria.txt`,
            ),
          ),
        );
        assertNoSensitiveSerialized(await records.innerText(), "records governance");
        return artifacts;
      },
    );
    crossShell.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_accessibility_cross_shell_snapshots", artifactRef }),
    );

    const assistive = await runScenario(
      desktop,
      "uat_480_assistive_provenance_posture",
      async (page) => {
        const artifacts: string[] = [];
        const staffShell = await gotoAndWait(
          page,
          `${staff.baseUrl}/workspace/task/task-311/decision?state=read_only&assistiveRail=observe-only&assistiveDraft=insert-blocked-slot&assistiveTrust=degraded&assistiveRecovery=trust-drift`,
          "[data-testid='staff-shell-root']",
        );
        const rail = page.locator("[data-testid='AssistiveRailShell']");
        await expectAttribute(rail, "data-trust-state", "degraded");
        const insertBars = page.locator("[data-testid='AssistiveBoundedInsertBar']");
        for (let index = 0; index < (await insertBars.count()); index += 1) {
          assert.notEqual(
            await insertBars.nth(index).getAttribute("data-insert-state"),
            "available",
            "Assistive provenance route must not expose insert as authoritative action.",
          );
        }
        assert(
          !/authoritative clinical decision/i.test(await staffShell.innerText()),
          "Assistive provenance must not read as clinical authority.",
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              rail,
              `${SUITE}/uat_480_assistive_provenance_posture.rail.aria.txt`,
            ),
          ),
        );
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              page.locator("[data-testid='AssistiveTrustStateFrame']"),
              `${SUITE}/uat_480_assistive_provenance_posture.trust.aria.txt`,
            ),
          ),
        );
        return artifacts;
      },
    );
    assistive.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_assistive_provenance_posture", artifactRef }),
    );
    await desktop.close();

    const mobile = await browser.newContext({
      viewport: { width: 390, height: 920 },
      isMobile: true,
      reducedMotion: "reduce",
      colorScheme: "light",
    });
    const channel = await runScenario(mobile, "uat_480_nhs_app_mobile_channel", async (page) => {
      const artifacts: string[] = [];
      const cockpit = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/release/nhs-app`,
        "[data-testid='NHSAppReadinessCockpit']",
      );
      await page.locator("[data-testid='NHSAppRouteInventoryTable']").waitFor();
      await assertNoHorizontalOverflow(page, "NHS App readiness cockpit mobile");
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            cockpit,
            `${SUITE}/uat_480_nhs_app_mobile_channel.readiness-mobile.aria.txt`,
          ),
        ),
      );

      const dependency = await gotoAndWait(
        page,
        `${ops.baseUrl}/ops/dependencies?dependencyState=deferred_channel&dependency=dep_478_nhs_app_channel`,
        "[data-testid='dependency-478-board']",
      );
      await expectAttribute(
        page.locator("[data-testid='dependency-478-card-dep_478_nhs_app_channel']"),
        "data-readiness-state",
        "not_applicable",
      );
      await assertNoHorizontalOverflow(page, "NHS App deferred dependency board mobile");
      artifacts.push(
        outputRelative(
          await writeAriaSnapshot(
            dependency,
            `${SUITE}/uat_480_nhs_app_mobile_channel.deferred-board.aria.txt`,
          ),
        ),
      );
      return artifacts;
    });
    channel.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_nhs_app_mobile_channel", artifactRef }),
    );
    await mobile.close();
  } finally {
    await browser.close();
    await stopServer(governance);
    await stopServer(ops);
    await stopServer(staff);
    await stopServer(patient);
  }

  writeSuiteArtifactManifest(SUITE, entries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
