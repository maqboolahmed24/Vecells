import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "pds_access_pack.json"), "utf8"),
);

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requiredLiveEnv() {
  return PACK.live_gate_pack.required_env;
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

async function fetchOfficialModeDigest() {
  const source = PACK.official_guidance.find(
    (row) => row.source_id === "official_pds_integrated_products",
  );
  assertCondition(source, "Missing official integrated-products source in pack.");
  const response = await fetch(source.url, {
    headers: { "user-agent": "vecells-seq027-dry-run" },
  });
  assertCondition(response.ok, `Failed to fetch official PDS mode source from ${source.url}`);
  const html = await response.text();
  const requiredLabels = ["Patient access", "Healthcare worker with update"];
  const foundLabels = requiredLabels.filter((label) => html.includes(label));
  assertCondition(
    foundLabels.length === requiredLabels.length,
    "Current official PDS access-mode roster no longer contains the expected labels.",
  );
  return {
    fetchedAt: new Date().toISOString(),
    labels: foundLabels,
  };
}

async function run() {
  const selectorProfile =
    PACK.live_gate_pack.selector_map[process.env.PDS_SELECTOR_PROFILE ?? "base_profile"] ??
    PACK.live_gate_pack.selector_map.base_profile;
  const targetUrl =
    process.env.PDS_ONBOARDING_PORTAL_URL ??
    "http://127.0.0.1:4177/?mode=actual&page=Rollback_and_Kill_Switches";
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  const officialModeDigest = await fetchOfficialModeDigest();

  if (realMutationRequested) {
    validateLiveGateInputs();
  }

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  if (selectorProfile.mode_toggle_actual) {
    await page.locator(selectorProfile.mode_toggle_actual).click();
  }
  await page.locator(selectorProfile.page_tab_use_case).click();
  await page.locator(selectorProfile.route_button).click();
  await page.locator(selectorProfile.page_tab_rollback).click();
  await page.locator(selectorProfile.hazard_row).waitFor();
  await page.locator(selectorProfile.risk_row).waitFor();

  await page.locator(selectorProfile.field_approver).fill(
    process.env.PDS_NAMED_APPROVER ?? "dry-run approver",
  );
  await page.locator(selectorProfile.field_environment).fill(
    process.env.PDS_ENVIRONMENT_TARGET ?? "sandbox",
  );
  await page.locator(selectorProfile.field_ods).fill(
    process.env.PDS_ORGANISATION_ODS ?? "ORG-PLACEHOLDER",
  );
  await page.locator(selectorProfile.field_owner).fill(
    process.env.PDS_USE_CASE_OWNER ?? "ROLE_INTEROPERABILITY_LEAD",
  );
  await page.locator(selectorProfile.field_allow_mutation).selectOption(
    realMutationRequested ? "true" : "false",
  );

  if (!realMutationRequested) {
    const buttonDisabled = await page.locator(selectorProfile.final_submit).isDisabled();
    assertCondition(buttonDisabled, "Dry-run posture drifted: submit should stay disabled.");
  }

  if (realMutationRequested) {
    assertCondition(
      process.env.PDS_CONFIRM_FINAL_SUBMIT === "true",
      "Real mutation requested without explicit PDS_CONFIRM_FINAL_SUBMIT=true acknowledgement.",
    );
    await page.locator(selectorProfile.final_submit).click();
  }

  await browser.close();
  return officialModeDigest;
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const pdsDryRunManifest = {
  task: PACK.task_id,
  liveGates: PACK.live_gate_pack.live_gates.map((gate) => gate.gate_id),
  selectorProfiles: Object.keys(PACK.live_gate_pack.selector_map),
  requiredLiveEnv: requiredLiveEnv(),
};
