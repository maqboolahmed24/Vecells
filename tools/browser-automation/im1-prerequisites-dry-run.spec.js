import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const LIVE_GATES = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "im1_live_gate_checklist.json"), "utf8"),
);
const PROVIDERS = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "im1_provider_supplier_register.json"), "utf8"),
);

// This harness stays data-driven: selectors come from im1_live_gate_checklist.json and
// provider roster refresh rules come from im1_provider_supplier_register.json.
function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function requiredLiveEnv() {
  return LIVE_GATES.required_env;
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

async function fetchCurrentProviderRoster() {
  const response = await fetch(PROVIDERS.roster_refresh.roster_source_url, {
    headers: { "user-agent": "vecells-seq026-dry-run" },
  });
  assertCondition(
    response.ok,
    `Failed to fetch current IM1 roster from ${PROVIDERS.roster_refresh.roster_source_url}`,
  );
  const html = await response.text();
  const foundProviders = PROVIDERS.roster_refresh.known_provider_suppliers_on_capture.filter(
    (providerName) => html.includes(providerName),
  );
  assertCondition(
    foundProviders.length >= 2,
    "Current official IM1 roster no longer contains the expected provider suppliers.",
  );
  return {
    fetchedAt: new Date().toISOString(),
    providerNames: foundProviders,
  };
}

async function run() {
  const selectorProfile =
    LIVE_GATES.selector_map[process.env.IM1_SELECTOR_PROFILE ?? "base_profile"] ??
    LIVE_GATES.selector_map.base_profile;
  const targetUrl =
    process.env.IM1_PREREQ_PORTAL_URL ?? LIVE_GATES.dry_run_defaults.default_target_url;
  const realMutationRequested = process.env.ALLOW_REAL_PROVIDER_MUTATION === "true";

  const rosterDigest = await fetchCurrentProviderRoster();

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
  await page.locator(selectorProfile.page_tab_licence).click();
  await page.locator(selectorProfile.evidence_drawer).waitFor();
  await page.locator(selectorProfile.redaction_notice).waitFor();

  await page.locator(selectorProfile.field_mvp_evidence_url).fill(
    process.env.IM1_MVP_EVIDENCE_URL ?? "https://vecells.example/demo/im1",
  );
  await page.locator(selectorProfile.field_sponsor_name).fill(
    process.env.IM1_SPONSOR_NAME ?? "dry-run sponsor",
  );
  await page.locator(selectorProfile.field_commercial_owner).fill(
    process.env.IM1_COMMERCIAL_OWNER ?? "dry-run commercial owner",
  );
  await page.locator(selectorProfile.field_named_approver).fill(
    process.env.IM1_NAMED_APPROVER ?? "dry-run approver",
  );
  await page.locator(selectorProfile.field_environment_target).fill(
    process.env.IM1_ENVIRONMENT_TARGET ?? "supported_test",
  );
  await page.locator(selectorProfile.refresh_provider_roster).click();
  await page.locator(selectorProfile.field_allow_mutation).selectOption(
    realMutationRequested ? "true" : "false",
  );

  if (!realMutationRequested) {
    const buttonDisabled = await page.locator(selectorProfile.final_submit).isDisabled();
    assertCondition(buttonDisabled, "Dry-run posture drifted: submit should stay disabled.");
  }

  if (realMutationRequested) {
    assertCondition(
      process.env.IM1_CONFIRM_FINAL_SUBMIT === "true",
      "Real mutation requested without explicit IM1_CONFIRM_FINAL_SUBMIT=true acknowledgement.",
    );
    await page.locator(selectorProfile.final_submit).click();
  }

  await browser.close();

  return rosterDigest;
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const im1DryRunManifest = {
  task: LIVE_GATES.task_id,
  liveGates: LIVE_GATES.live_gates.map((gate) => gate.gate_id),
  selectorProfiles: Object.keys(LIVE_GATES.selector_map),
  requiredLiveEnv: requiredLiveEnv(),
};
