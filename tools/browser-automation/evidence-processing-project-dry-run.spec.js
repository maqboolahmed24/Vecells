import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "35_evidence_processing_lab_pack.json"), "utf8"),
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
    PACK.live_gate_pack.allowed_vendor_ids.includes(process.env.EVIDENCE_PROVIDER_VENDOR_ID),
    "Chosen provider is not on the task 034 shortlist.",
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
    process.env.MOCK_EVIDENCE_GATE_LAB_URL ??
    "http://127.0.0.1:4202/?mode=actual&page=Live_Gates_and_Retention_Posture&transcriptionBaseUrl=http://127.0.0.1:4200&scanBaseUrl=http://127.0.0.1:4201";
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
    process.env.EVIDENCE_PROVIDER_VENDOR_ID ?? PACK.live_gate_pack.allowed_vendor_ids[0],
  );
  await page.locator(selectors.field_project_scope).selectOption(
    process.env.EVIDENCE_PROJECT_SCOPE ?? PACK.project_scopes[0].project_scope,
  );
  await page.locator(selectors.field_region_policy).selectOption(
    process.env.EVIDENCE_REGION_POLICY_REF ?? PACK.region_policies[1].region_policy_ref,
  );
  await page.locator(selectors.field_retention_policy).selectOption(
    process.env.EVIDENCE_RETENTION_POLICY_REF ?? PACK.retention_policies[0].retention_policy_ref,
  );
  await page.locator(selectors.field_callback_base).fill(
    process.env.EVIDENCE_WEBHOOK_BASE_URL ?? "https://example.invalid/evidence-gate",
  );
  await page.locator(selectors.field_secret_ref).fill(
    process.env.EVIDENCE_WEBHOOK_SECRET_REF ?? "vault://evidence/provider/webhook",
  );
  await page.locator(selectors.field_bucket_ref).fill(
    process.env.EVIDENCE_STORAGE_BUCKET_REF ?? "s3://vecells-evidence-nonprod",
  );
  await page.locator(selectors.field_scan_policy).selectOption(
    process.env.EVIDENCE_SCAN_POLICY_REF ?? PACK.scan_and_quarantine_policy_rows[0].scan_policy_ref,
  );
  await page.locator(selectors.field_environment).selectOption(
    process.env.EVIDENCE_TARGET_ENVIRONMENT ?? "provider_like_preprod",
  );
  await page.locator(selectors.field_approver).fill(
    process.env.EVIDENCE_NAMED_APPROVER ?? "dry-run approver",
  );
  await page.locator(selectors.field_allow_mutation).selectOption(realMutationRequested ? "true" : "false");
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

export const evidenceProjectDryRunManifest = {
  task: PACK.task_id,
  requiredLiveEnv: requiredLiveEnv(),
  allowedVendors: PACK.live_gate_pack.allowed_vendor_ids,
};
