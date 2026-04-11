import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "33_notification_studio_pack.json"), "utf8"),
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
    PACK.live_gate_pack.allowed_vendor_ids.includes(process.env.NOTIFICATION_VENDOR_ID),
    "Chosen notification vendor is not on the task 031 shortlist.",
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
    process.env.MOCK_NOTIFICATION_STUDIO_URL ??
    "http://127.0.0.1:4191/?mode=actual&page=Live_Gates_and_Sender_Readiness&notificationBaseUrl=http://127.0.0.1:4190";
  const selectors = PACK.live_gate_pack.selector_map.base_profile;
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  if (realMutationRequested) {
    validateLiveGateInputs();
  }

  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });

  await page.goto(targetUrl, { waitUntil: "networkidle" });
  await page.locator(selectors.mode_toggle_actual).click();
  await page.locator(selectors.page_tab_live_gates).click();
  await page.locator(selectors.field_vendor).selectOption(
    process.env.NOTIFICATION_VENDOR_ID ?? PACK.live_gate_pack.allowed_vendor_ids[0],
  );
  await page.locator(selectors.field_project_scope).selectOption(
    process.env.NOTIFICATION_PROJECT_SCOPE ?? PACK.project_scopes[0].project_scope,
  );
  await page.locator(selectors.field_sender_ref).selectOption(
    process.env.NOTIFICATION_SENDER_REF ?? PACK.sender_and_domain_rows[0].identity_ref,
  );
  await page.locator(selectors.field_domain_ref).fill(
    process.env.NOTIFICATION_DOMAIN_REF ?? "placeholder.vecells.example",
  );
  await page.locator(selectors.field_callback_base).fill(
    process.env.NOTIFICATION_CALLBACK_BASE_URL ?? "https://example.invalid/notification",
  );
  await page.locator(selectors.field_secret_ref).fill(
    process.env.NOTIFICATION_WEBHOOK_SECRET_REF ?? "vault://notifications/webhook",
  );
  await page.locator(selectors.field_environment).selectOption(
    process.env.NOTIFICATION_TARGET_ENVIRONMENT ?? "provider_like_preprod",
  );
  await page.locator(selectors.field_approver).fill(
    process.env.NOTIFICATION_NAMED_APPROVER ?? "dry-run approver",
  );
  await page.locator(selectors.field_allow_mutation).selectOption(
    realMutationRequested ? "true" : "false",
  );
  await page.locator(selectors.field_allow_spend).selectOption(
    process.env.ALLOW_SPEND === "true" ? "true" : "false",
  );

  const buttonDisabled = await page.locator(selectors.final_submit).isDisabled();
  assertCondition(
    buttonDisabled,
    "Dry-run posture drifted: actual submit must stay disabled while Phase 0 remains withheld.",
  );

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const notificationDryRunManifest = {
  task: PACK.task_id,
  requiredLiveEnv: requiredLiveEnv(),
  allowedVendors: PACK.live_gate_pack.allowed_vendor_ids,
};
