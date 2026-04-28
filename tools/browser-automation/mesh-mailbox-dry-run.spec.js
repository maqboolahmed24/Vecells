import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "mesh_execution_pack.json"), "utf8"),
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
  assertCondition(
    process.env.ALLOW_SPEND === "true",
    "Potential commercial or managed-service paths remain blocked until ALLOW_SPEND=true",
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
    headers: { "user-agent": "vecells-seq028-dry-run" },
  });
  assertCondition(response.ok, `Failed to fetch official source ${url}`);
  const html = await response.text();
  for (const snippet of expectedSnippets) {
    assertCondition(
      html.includes(snippet),
      `Official source ${url} no longer contains: ${snippet}`,
    );
  }
}

async function verifyOfficialMechanics() {
  await verifyOfficialSource(
    PACK.official_guidance.find((row) => row.source_id === "official_mesh_mailbox_apply_form").url,
    PACK.live_gate_pack.official_label_checks.mailbox_form,
  );
  await verifyOfficialSource(
    PACK.official_guidance.find((row) => row.source_id === "official_mesh_workflow_request_form")
      .url,
    PACK.live_gate_pack.official_label_checks.workflow_form,
  );
}

async function run() {
  const selectorProfile =
    PACK.live_gate_pack.selector_map[process.env.MESH_SELECTOR_PROFILE ?? "base_profile"] ??
    PACK.live_gate_pack.selector_map.base_profile;
  const targetUrl =
    process.env.MESH_MAILROOM_URL ??
    "http://127.0.0.1:4179/?mode=actual&page=Mailbox_Application_Pack";
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  await verifyOfficialMechanics();

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
  await page.locator(selectorProfile.page_tab_application_pack).click();
  await page.locator(selectorProfile.mailbox_button).click();
  await page.locator(selectorProfile.page_tab_registry).click();
  await page.locator(selectorProfile.workflow_row).waitFor();
  await page.locator(selectorProfile.page_tab_application_pack).click();

  await page
    .locator(selectorProfile.field_approver)
    .fill(process.env.MESH_NAMED_APPROVER ?? "dry-run approver");
  await page
    .locator(selectorProfile.field_environment)
    .fill(process.env.MESH_ENVIRONMENT_TARGET ?? "path_to_live_integration");
  await page
    .locator(selectorProfile.field_owner_ods)
    .fill(process.env.MESH_MAILBOX_OWNER_ODS ?? "VEC01");
  await page
    .locator(selectorProfile.field_manager_mode)
    .selectOption(process.env.MESH_MANAGING_PARTY_MODE ?? "self_managed");
  await page
    .locator(selectorProfile.field_workflow_contact)
    .fill(process.env.MESH_WORKFLOW_TEAM_CONTACT ?? "Named MESH team contact");
  await page
    .locator(selectorProfile.field_allow_mutation)
    .selectOption(realMutationRequested ? "true" : "false");
  await page
    .locator(selectorProfile.field_allow_spend)
    .selectOption(process.env.ALLOW_SPEND === "true" ? "true" : "false");

  if (!realMutationRequested) {
    const buttonDisabled = await page.locator(selectorProfile.final_submit).isDisabled();
    assertCondition(buttonDisabled, "Dry-run posture drifted: submit should stay disabled.");
  }

  if (realMutationRequested) {
    assertCondition(
      process.env.MESH_CONFIRM_FINAL_SUBMIT === "true",
      "Real mutation requested without explicit MESH_CONFIRM_FINAL_SUBMIT=true acknowledgement.",
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

export const meshDryRunManifest = {
  task: PACK.task_id,
  requiredLiveEnv: requiredLiveEnv(),
  selectorProfiles: Object.keys(PACK.live_gate_pack.selector_map),
};
