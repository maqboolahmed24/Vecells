import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "32_telephony_lab_pack.json"), "utf8"),
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
    PACK.phase0_verdict === "withheld",
    "This harness expects the live posture to remain blocked while Phase 0 is withheld.",
  );
  assertCondition(
    PACK.live_gate_pack.allowed_vendor_ids.includes(process.env.TELEPHONY_VENDOR_ID),
    "Chosen telephony vendor is not on the task 031 shortlist.",
  );
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This harness needs the `playwright` package when run with --run.");
  }
}

async function verifyOfficialSource(url, expectedSnippets) {
  const response = await fetch(url, {
    headers: { "user-agent": "vecells-seq032-dry-run" },
  });
  assertCondition(response.ok, `Failed to fetch official source ${url}`);
  const html = await response.text();
  for (const snippet of expectedSnippets) {
    assertCondition(html.includes(snippet), `Official source ${url} no longer contains: ${snippet}`);
  }
}

async function verifyOfficialMechanics() {
  for (const entry of Object.values(PACK.live_gate_pack.official_label_checks)) {
    await verifyOfficialSource(entry.url, entry.expected);
  }
}

async function run() {
  const targetUrl =
    process.env.MOCK_TELEPHONY_LAB_URL ??
    "http://127.0.0.1:4181/?mode=actual&page=Live_Gates_and_Spend_Controls&telephonyBaseUrl=http://127.0.0.1:4180";
  const selectorProfile = PACK.live_gate_pack.selector_map.base_profile;
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  await verifyOfficialMechanics();

  if (realMutationRequested) {
    validateLiveGateInputs();
  }

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.locator(selectorProfile.mode_toggle_actual).click();
  await page.locator(selectorProfile.page_tab_live_gates).click();
  await page.locator(selectorProfile.field_vendor).selectOption(
    process.env.TELEPHONY_VENDOR_ID ?? "twilio_telephony_ivr",
  );
  await page.locator(selectorProfile.field_approver).fill(
    process.env.TELEPHONY_NAMED_APPROVER ?? "dry-run approver",
  );
  await page.locator(selectorProfile.field_environment).selectOption(
    process.env.TELEPHONY_TARGET_ENVIRONMENT ?? "provider_like_preprod",
  );
  await page.locator(selectorProfile.field_callback_base).fill(
    process.env.TELEPHONY_CALLBACK_BASE_URL ?? "https://example.invalid/telephony",
  );
  await page.locator(selectorProfile.field_recording_policy).selectOption(
    process.env.TELEPHONY_RECORDING_POLICY_REF ?? "rec_default_dual_channel",
  );
  await page.locator(selectorProfile.field_number_profile).selectOption(
    process.env.TELEPHONY_NUMBER_PROFILE_REF ?? "NUM_TEL_PROVIDER_TWILIO",
  );
  await page.locator(selectorProfile.field_spend_cap).fill(
    process.env.TELEPHONY_SPEND_CAP_GBP ?? "25",
  );
  await page.locator(selectorProfile.field_secret_ref).fill(
    process.env.TELEPHONY_WEBHOOK_SECRET_REF ?? "vault://telephony/webhook",
  );
  await page.locator(selectorProfile.field_allow_mutation).selectOption(
    realMutationRequested ? "true" : "false",
  );
  await page.locator(selectorProfile.field_allow_spend).selectOption(
    process.env.ALLOW_SPEND === "true" ? "true" : "false",
  );

  const buttonDisabled = await page.locator(selectorProfile.final_submit).isDisabled();
  assertCondition(
    buttonDisabled,
    "Dry-run posture drifted: real submit must stay disabled while Phase 0 remains withheld.",
  );

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const telephonyDryRunManifest = {
  task: PACK.task_id,
  requiredLiveEnv: requiredLiveEnv(),
  allowedVendors: PACK.live_gate_pack.allowed_vendor_ids,
};
