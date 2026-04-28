import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "site_link_environment_matrix.json"), "utf8"),
);

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requiredLiveEnv() {
  return [
    "SITE_LINK_NAMED_APPROVER",
    "SITE_LINK_ENVIRONMENT_TARGET",
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
  const targetUrl =
    process.env.SITE_LINK_STUDIO_URL ?? PACK.live_gate_pack.dry_run_defaults.default_target_url;
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  if (realMutationRequested) {
    validateLiveGateInputs();
  }

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='page-tab-Real_Registration_Gates']").click();
  await page.locator("[data-testid='mode-toggle-actual']").click();

  if (await page.locator("[data-testid='actual-field-named-approver']").count()) {
    await page
      .locator("[data-testid='actual-field-named-approver']")
      .fill(process.env.SITE_LINK_NAMED_APPROVER ?? "dry-run-approver");
  }
  if (await page.locator("[data-testid='actual-field-environment-target']").count()) {
    await page
      .locator("[data-testid='actual-field-environment-target']")
      .selectOption(process.env.SITE_LINK_ENVIRONMENT_TARGET ?? "sandpit_like");
  }
  if (await page.locator("[data-testid='actual-field-allow-mutation']").count()) {
    await page
      .locator("[data-testid='actual-field-allow-mutation']")
      .selectOption(realMutationRequested ? "true" : "false");
  }

  await page.locator("[data-testid='actual-submission-notice']").waitFor();
  await page.locator("[data-testid='live-gate-board']").waitFor();

  const blockedGateCount = PACK.live_gate_pack.live_gates.filter(
    (gate) => gate.status !== "pass",
  ).length;
  assertCondition(
    blockedGateCount >= 1,
    "Dry-run posture drifted: at least one live gate should remain blocked.",
  );

  if (realMutationRequested) {
    assertCondition(
      process.env.SITE_LINK_CONFIRM_FINAL_SUBMIT === "true",
      "Real mutation requested without explicit pause-and-confirm acknowledgement.",
    );
  }

  const disabled = await page.locator("[data-testid='actual-submit-button']").isDisabled();
  assertCondition(
    disabled,
    "Dry-run harness should stop with the real registration button disabled.",
  );

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const siteLinkDryRunManifest = {
  task: PACK.task_id,
  liveGates: PACK.live_gate_pack.live_gates.map((gate) => gate.gate_id),
  requiredLiveEnv: requiredLiveEnv(),
};
