import assert from "node:assert/strict";
import path from "node:path";
import { write480SeedArtifacts } from "../../tools/testing/run_480_final_uat_visual";
import {
  OUTPUT_ROOT,
  assertCleanRuntime,
  assertNoSensitiveSerialized,
  attachRuntimeGuards,
  captureScreenshot,
  expectAttribute,
  gotoAndWait,
  loadPlaywright,
  outputRelative,
  startViteApp,
  stopServer,
  writeAriaSnapshot,
  writeSuiteArtifactManifest,
} from "./480_final_uat.helpers";

const SUITE = "governance-release";
const GOVERNANCE_PORT = 4364;
const OPS_PORT = 4365;

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
  const governance = await startViteApp(
    "governance-console",
    GOVERNANCE_PORT,
    "/ops/release?signoffState=ready_with_constraints",
  );
  const ops = await startViteApp("ops-console", OPS_PORT, "/ops/conformance?waveState=approved");
  const browser = await playwright.chromium.launch({ headless: true });
  const entries: { scenarioId: string; artifactRef: string }[] = [];

  try {
    const context = await browser.newContext({
      viewport: { width: 1440, height: 1200 },
      reducedMotion: "reduce",
      forcedColors: "active",
      colorScheme: "dark",
    });

    const governanceArtifacts = await runScenario(
      context,
      "uat_480_governance_signoff_review",
      async (page) => {
        const artifacts: string[] = [];
        const cockpit = await gotoAndWait(
          page,
          `${governance.baseUrl}/ops/release?signoffState=ready_with_constraints`,
          "[data-testid='final-477-signoff-cockpit']",
        );
        await expectAttribute(cockpit, "data-overall-signoff-state", "ready_with_constraints");
        const evidenceRow = page.locator(
          "[data-testid='final-477-evidence-row-seb_477_clinical_core_web_dcb0129']",
        );
        await evidenceRow.focus();
        await page.keyboard.press("Enter");
        const drawer = page.locator("[data-testid='final-477-source-drawer']");
        await drawer.waitFor();
        assert(/Clinical Safety Officer|ROLE_CLINICAL_SAFETY_LEAD/i.test(await drawer.innerText()));
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              drawer,
              `${SUITE}/uat_480_governance_signoff_review.source-drawer.aria.txt`,
            ),
          ),
        );
        await page.locator("[data-testid='final-477-close-source-drawer']").click();
        await page.waitForFunction(
          (testId: string) =>
            (document.activeElement as HTMLElement | null)?.dataset.testid === testId,
          "final-477-evidence-row-seb_477_clinical_core_web_dcb0129",
        );
        assert.equal(
          await page.evaluate(
            () => (document.activeElement as HTMLElement | null)?.dataset.testid ?? "",
          ),
          "final-477-evidence-row-seb_477_clinical_core_web_dcb0129",
          "Signoff drawer must restore focus to the selected evidence row.",
        );
        assertNoSensitiveSerialized(await cockpit.innerText(), "signoff cockpit");

        const roleScope = await gotoAndWait(
          page,
          `${governance.baseUrl}/ops/access/role-scope-studio`,
          "[data-testid='role-scope-studio']",
        );
        await page.locator("[data-testid='role-scope-matrix']").waitFor();
        artifacts.push(
          outputRelative(
            await writeAriaSnapshot(
              roleScope,
              `${SUITE}/uat_480_governance_signoff_review.role-scope.aria.txt`,
            ),
          ),
        );
        assertNoSensitiveSerialized(await roleScope.innerText(), "role scope studio");

        const release = await gotoAndWait(
          page,
          `${ops.baseUrl}/ops/conformance?waveState=approved`,
          "[data-testid='release-476-planner']",
        );
        await page.locator("[data-testid='release-476-approve-wave']").click();
        const releaseDialog = page.locator(
          "[data-testid='release-476-command-confirmation-dialog']",
        );
        await releaseDialog.waitFor();
        assert(
          await page.getByRole("button", { name: /Confirm activation/i }).isDisabled(),
          "Release approval remains gated until backend settlement.",
        );
        artifacts.push(
          outputRelative(
            await captureScreenshot(
              release,
              `${SUITE}/uat_480_governance_signoff_review.release-planner.png`,
            ),
          ),
        );
        return artifacts;
      },
    );
    governanceArtifacts.forEach((artifactRef) =>
      entries.push({ scenarioId: "uat_480_governance_signoff_review", artifactRef }),
    );

    await context.close();
  } finally {
    await browser.close();
    await stopServer(ops);
    await stopServer(governance);
  }

  writeSuiteArtifactManifest(SUITE, entries);
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
