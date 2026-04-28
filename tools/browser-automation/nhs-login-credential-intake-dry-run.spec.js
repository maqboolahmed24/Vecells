import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PLACEHOLDERS = JSON.parse(
  fs.readFileSync(
    path.join(ROOT, "data", "analysis", "nhs_login_actual_credential_placeholders.json"),
    "utf8",
  ),
);

// This harness is intentionally driven by the data-driven selector map in
// nhs_login_actual_credential_placeholders.json rather than brittle inline selectors.
function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requiredLiveEnv() {
  return [
    "NHS_LOGIN_NAMED_APPROVER",
    "NHS_LOGIN_ENVIRONMENT_TARGET",
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
  const selectorProfile =
    PLACEHOLDERS.selector_map[process.env.NHS_LOGIN_SELECTOR_PROFILE ?? "base_profile"] ??
    PLACEHOLDERS.selector_map.base_profile;
  const targetUrl =
    process.env.NHS_LOGIN_PORTAL_URL ?? PLACEHOLDERS.dry_run_defaults.default_target_url;
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  if (realMutationRequested) {
    validateLiveGateInputs();
  }

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1080 } });

  await page.goto(targetUrl, { waitUntil: "networkidle" });

  if (selectorProfile.mode_toggle_actual) {
    await page.locator(selectorProfile.mode_toggle_actual).click();
  }

  const fieldPrefix = selectorProfile.placeholder_field_prefix;
  const namedApproverField = `[data-testid='${fieldPrefix}cred_named_approver']`;
  const environmentField = `[data-testid='${fieldPrefix}cred_environment_target']`;
  const mutationField = `[data-testid='${fieldPrefix}cred_live_mutation_flag']`;

  await page.locator(selectorProfile.credential_intake_drawer).waitFor();
  await page.locator(selectorProfile.redaction_notice).waitFor();

  if (await page.locator(namedApproverField).count()) {
    await page
      .locator(namedApproverField)
      .fill(process.env.NHS_LOGIN_NAMED_APPROVER ?? "dry-run-approver");
  }
  if (await page.locator(environmentField).count()) {
    await page
      .locator(environmentField)
      .fill(process.env.NHS_LOGIN_ENVIRONMENT_TARGET ?? "integration");
  }
  if (await page.locator(mutationField).count()) {
    await page.locator(mutationField).fill(realMutationRequested ? "true" : "false");
  }

  if (!realMutationRequested) {
    const blockedGateCount = PLACEHOLDERS.live_gates.filter(
      (gate) => gate.status !== "pass",
    ).length;
    assertCondition(
      blockedGateCount >= 1,
      "Dry-run posture drifted: at least one live gate should remain blocked.",
    );
  }

  if (realMutationRequested) {
    assertCondition(
      process.env.NHS_LOGIN_CONFIRM_FINAL_SUBMIT === "true",
      "Real mutation requested without explicit pause-and-confirm acknowledgement.",
    );
    await page.locator(selectorProfile.final_submit).click();
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const liveDryRunManifest = {
  task: PLACEHOLDERS.task_id,
  liveGates: PLACEHOLDERS.live_gates.map((gate) => gate.gate_id),
  selectorProfiles: Object.keys(PLACEHOLDERS.selector_map),
  requiredLiveEnv: requiredLiveEnv(),
};
