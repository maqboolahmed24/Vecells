import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "60_resilience_control_lab.html");
const ESSENTIAL_PATH = path.join(ROOT, "data", "analysis", "essential_function_map.json");
const POSTURE_PATH = path.join(ROOT, "data", "analysis", "recovery_control_posture_rules.json");
const BACKUP_PATH = path.join(ROOT, "data", "analysis", "backup_scope_matrix.csv");

const ESSENTIAL_PAYLOAD = JSON.parse(fs.readFileSync(ESSENTIAL_PATH, "utf8"));
const POSTURE_PAYLOAD = JSON.parse(fs.readFileSync(POSTURE_PATH, "utf8"));
const BACKUP_ROWS = parseCsv(fs.readFileSync(BACKUP_PATH, "utf8"));

export const resilienceControlCoverage = [
  "function filtering",
  "posture filtering",
  "tier filtering",
  "evidence freshness filtering",
  "card selection",
  "map and matrix and inspector synchronization",
  "keyboard navigation",
  "responsive layout",
  "reduced motion",
  "accessibility smoke checks",
  "table parity",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      continue;
    }
    field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
  );
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/" ? "/docs/architecture/60_resilience_control_lab.html" : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4360, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing resilience lab HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.RESILIENCE_CONTROL_LAB_URL ??
    "http://127.0.0.1:4360/docs/architecture/60_resilience_control_lab.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='function-map']").waitFor();
    await page.locator("[data-testid='posture-panel']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("[data-testid='evidence-rail']").waitFor();

    const initialCards = await page.locator("[data-testid^='posture-card-']").count();
    assertCondition(
      initialCards === POSTURE_PAYLOAD.postureRules.length,
      `Posture card count drifted: expected ${POSTURE_PAYLOAD.postureRules.length}, found ${initialCards}`,
    );

    await page.locator("[data-testid='function-filter']").selectOption("patient");
    const patientCards = await page.locator("[data-testid^='posture-card-']").count();
    assertCondition(patientCards === 2, `Expected 2 patient scopes, found ${patientCards}`);

    await page.locator("[data-testid='function-filter']").selectOption("all");
    await page.locator("[data-testid='posture-filter']").selectOption("blocked");
    const blockedCards = await page.locator("[data-testid^='posture-card-']").count();
    assertCondition(blockedCards === 2, `Expected 2 blocked scopes, found ${blockedCards}`);

    await page.locator("[data-testid='posture-filter']").selectOption("all");
    await page.locator("[data-testid='tier-filter']").selectOption("tier_0");
    const tierZeroCards = await page.locator("[data-testid^='posture-card-']").count();
    assertCondition(tierZeroCards === 2, `Expected 2 tier_0 scopes, found ${tierZeroCards}`);

    await page.locator("[data-testid='tier-filter']").selectOption("all");
    await page.locator("[data-testid='freshness-filter']").selectOption("stale");
    const staleCards = await page.locator("[data-testid^='posture-card-']").count();
    assertCondition(staleCards === 2, `Expected 2 stale-evidence scopes, found ${staleCards}`);

    await page.locator("[data-testid='freshness-filter']").selectOption("all");
    await page.locator("[data-testid='posture-card-scope_pharmacy_referral_recovery']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("governed_recovery") &&
        inspectorText.includes("BSM_060_PHARMACY_REFERRAL_STATE_V1"),
      "Inspector lost the governed pharmacy recovery tuple details.",
    );

    const selectedNode = await page
      .locator("[data-testid='function-node-ef_pharmacy_referral_reconciliation']")
      .getAttribute("data-selected");
    assertCondition(
      selectedNode === "true",
      "Function map did not synchronize with the selected card.",
    );

    const selectedRule = await page
      .locator("[data-testid='rule-row-scope_pharmacy_referral_recovery']")
      .getAttribute("data-selected");
    assertCondition(
      selectedRule === "true",
      "Rule table did not synchronize with the selected card.",
    );

    const selectedBackup = await page
      .locator("[data-testid='backup-row-BSM_060_PHARMACY_REFERRAL_STATE_V1']")
      .getAttribute("data-selected");
    assertCondition(
      selectedBackup === "true",
      "Backup matrix did not synchronize with the selected card.",
    );

    const visibleCards = await page.locator("[data-testid^='posture-card-']").count();
    const visibleNodes = await page.locator("[data-testid^='function-node-']").count();
    const parityRows = await page
      .locator("[data-testid='function-map-parity-table'] tbody tr")
      .count();
    assertCondition(
      visibleCards === visibleNodes && visibleCards === parityRows,
      "Function map or parity table drifted from the visible scope set.",
    );

    const postureChips = await page.locator("[data-testid^='posture-chip-']").count();
    const postureParityRows = await page
      .locator("[data-testid='posture-parity-table'] tbody tr")
      .count();
    assertCondition(
      postureChips === 4 && postureParityRows === 4,
      "Posture panel or parity table drifted from the four posture states.",
    );

    const evidenceRows = await page.locator("[data-testid^='evidence-row-']").count();
    assertCondition(
      evidenceRows === 2,
      `Expected 2 evidence rows for the selected scope, found ${evidenceRows}`,
    );

    await page.locator("[data-testid='posture-card-scope_patient_entry_recovery']").focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='posture-card-scope_patient_self_service_continuity']")
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "Arrow-down navigation no longer advances card selection.",
    );

    await page.locator("[data-testid='backup-row-BSM_060_IDENTITY_ENTRY_STATE_V1']").focus();
    await page.keyboard.press("ArrowDown");
    const secondBackupSelected = await page
      .locator("[data-testid='backup-row-BSM_060_PATIENT_CONTINUITY_READ_MODELS_V1']")
      .getAttribute("data-selected");
    assertCondition(
      secondBackupSelected === "true",
      "Backup-row arrow navigation no longer advances selection.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}`);
  } finally {
    await browser.close();
    await new Promise((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const resilienceControlManifest = {
  task: ESSENTIAL_PAYLOAD.task_id,
  essentialFunctions: ESSENTIAL_PAYLOAD.summary.essential_function_count,
  liveControlScopes: POSTURE_PAYLOAD.summary.live_control_scope_count,
  blockedScopes: POSTURE_PAYLOAD.summary.blocked_scope_count,
  backupManifests: BACKUP_ROWS.length,
};
