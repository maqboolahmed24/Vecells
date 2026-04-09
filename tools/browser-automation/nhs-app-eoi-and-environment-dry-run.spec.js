import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "nhs_app_stage_progression.json"), "utf8"),
);
const LIVE_GATES = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "nhs_app_live_gate_checklist.json"), "utf8"),
);

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requiredLiveEnv() {
  return [
    "NHS_APP_NAMED_APPROVER",
    "NHS_APP_ENVIRONMENT_TARGET",
    "ALLOW_REAL_PROVIDER_MUTATION",
  ];
}

function validateLiveGateInputs() {
  for (const envVar of requiredLiveEnv()) {
    assertCondition(process.env[envVar], `Missing required live gate input: ${envVar}`);
  }
  assertCondition(
    process.env.ALLOW_REAL_PROVIDER_MUTATION === "true",
    "Real provider mutation remains blocked until ALLOW_REAL_PROVIDER_MUTATION=true",
  );
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This harness needs the `playwright` package when run with --run.");
  }
}

async function run() {
  const selectorProfile = LIVE_GATES.selector_map.studio_profile;
  const targetUrl = process.env.NHS_APP_PORTAL_URL ?? LIVE_GATES.dry_run_defaults.default_target_url;
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  if (realMutationRequested) {
    validateLiveGateInputs();
  }

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.locator(selectorProfile.stage_rail).waitFor();
  await page.locator(selectorProfile.release_page_tab).click();
  await page.locator(selectorProfile.mode_toggle_actual).click();

  if (await page.locator("[data-testid='actual-field-named-approver']").count()) {
    await page.locator("[data-testid='actual-field-named-approver']").fill(
      process.env.NHS_APP_NAMED_APPROVER ?? "dry-run-approver",
    );
  }
  if (await page.locator("[data-testid='actual-field-environment-target']").count()) {
    await page.locator("[data-testid='actual-field-environment-target']").selectOption(
      process.env.NHS_APP_ENVIRONMENT_TARGET ?? "sandpit",
    );
  }
  if (await page.locator("[data-testid='actual-field-allow-mutation']").count()) {
    await page.locator("[data-testid='actual-field-allow-mutation']").selectOption(
      realMutationRequested ? "true" : "false",
    );
  }

  await page.locator(selectorProfile.gate_board).waitFor();
  await page.locator("[data-testid='actual-submission-notice']").waitFor();

  const blockedGateCount = LIVE_GATES.live_gates.filter((gate) => gate.status !== "pass").length;
  assertCondition(blockedGateCount >= 1, "Dry-run posture drifted: at least one live gate should remain blocked.");

  if (realMutationRequested) {
    assertCondition(
      process.env.NHS_APP_CONFIRM_FINAL_SUBMIT === "true",
      "Real mutation requested without explicit pause-and-confirm acknowledgement.",
    );
  }

  const disabled = await page.locator("[data-testid='actual-submit-button']").isDisabled();
  assertCondition(disabled, "Dry-run harness should stop with the real submit button disabled.");

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const nhsAppDryRunManifest = {
  task: PACK.task_id,
  liveGates: LIVE_GATES.live_gates.map((gate) => gate.gate_id),
  requiredLiveEnv: requiredLiveEnv(),
};
