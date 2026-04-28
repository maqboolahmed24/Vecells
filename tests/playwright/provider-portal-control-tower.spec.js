import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "external", "39_provider_portal_control_tower.html");
const RETRY_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "browser_automation_retry_matrix.json",
);
const LIVE_GATE_RULES_PATH = path.join(ROOT, "data", "analysis", "live_mutation_gate_rules.json");

const RETRY_MATRIX = JSON.parse(fs.readFileSync(RETRY_MATRIX_PATH, "utf8"));
const LIVE_GATE_RULES = JSON.parse(fs.readFileSync(LIVE_GATE_RULES_PATH, "utf8"));

const IDEMPOTENCY_RANK = {
  read_only: 1,
  draft_resume_safe: 2,
  review_checkpoint: 3,
  non_idempotent_mutation: 4,
  secret_material_handling: 5,
};

const EVIDENCE_RANK = {
  gate_snapshot: 1,
  checkpoint_receipt: 2,
  review_reference: 3,
  provider_receipt: 4,
  vault_receipt: 5,
};

export const providerPortalControlTowerCoverage = [
  "provider family, action class, and live-gate filtering",
  "idempotency and evidence sorting",
  "action selection and inspector rendering",
  "retry-class chip rendering",
  "keyboard navigation",
  "responsive desktop/tablet/mobile layouts",
  "reduced-motion handling",
  "accessibility smoke",
  "table parity for the ladder diagram",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const rootDir = path.join(ROOT, "docs", "external");
    const server = http.createServer((req, res) => {
      if (!req.url || req.url === "/") {
        res.writeHead(302, { Location: "/39_provider_portal_control_tower.html" });
        res.end();
        return;
      }
      const safePath = req.url.replace(/^\/+/, "");
      const filePath = path.join(rootDir, safePath);
      if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : "application/octet-stream";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4339, "127.0.0.1", () => resolve(server));
  });
}

function expectedCount(predicate) {
  return RETRY_MATRIX.action_rows.filter(predicate).length;
}

function expectedFirstActionByRank(rankMap, key) {
  return [...RETRY_MATRIX.action_rows].sort(
    (left, right) => (rankMap[left[key]] ?? 0) - (rankMap[right[key]] ?? 0),
  )[0].action_key;
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing control tower HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.PROVIDER_PORTAL_CONTROL_TOWER_URL ??
    "http://127.0.0.1:4339/39_provider_portal_control_tower.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='tower-shell']").waitFor();
    await page.locator("[data-testid='rail']").waitFor();

    const initialRows = await page.locator("#register-body tr").count();
    assertCondition(
      initialRows === RETRY_MATRIX.summary.checkpoint_count,
      `Expected ${RETRY_MATRIX.summary.checkpoint_count} rows on load, found ${initialRows}`,
    );

    await page.locator("[data-testid='filter-family']").selectOption("pharmacy");
    const pharmacyRows = await page.locator("#register-body tr").count();
    assertCondition(
      pharmacyRows === expectedCount((row) => row.provider_family === "pharmacy"),
      `Pharmacy filter drifted: expected ${expectedCount((row) => row.provider_family === "pharmacy")}, found ${pharmacyRows}`,
    );

    await page.locator("[data-testid='filter-family']").selectOption("all");
    await page
      .locator("[data-testid='filter-action-class']")
      .selectOption("resume_from_checkpoint_only");
    const resumeRows = await page.locator("#register-body tr").count();
    assertCondition(
      resumeRows === expectedCount((row) => row.retry_class === "resume_from_checkpoint_only"),
      `Resume-only filter drifted: expected ${expectedCount((row) => row.retry_class === "resume_from_checkpoint_only")}, found ${resumeRows}`,
    );

    await page.locator("[data-testid='filter-action-class']").selectOption("all");
    await page.locator("[data-testid='filter-live-gate']").selectOption("pass");
    const passRows = await page.locator("#register-body tr").count();
    assertCondition(
      passRows === expectedCount((row) => row.live_gate_status === "pass"),
      `Pass filter drifted: expected ${expectedCount((row) => row.live_gate_status === "pass")}, found ${passRows}`,
    );

    await page.locator("[data-testid='filter-live-gate']").selectOption("all");
    await page.locator("[data-testid='sort-idempotency']").click();
    const firstIdempotencyKey = expectedFirstActionByRank(IDEMPOTENCY_RANK, "idempotency_class");
    const firstIdempotencyRow = await page
      .locator("#register-body tr")
      .first()
      .getAttribute("data-action-key");
    assertCondition(
      firstIdempotencyRow === firstIdempotencyKey,
      `Idempotency sort drifted: expected ${firstIdempotencyKey}, found ${firstIdempotencyRow}`,
    );

    await page.locator("[data-testid='sort-evidence']").click();
    const firstEvidenceKey = expectedFirstActionByRank(EVIDENCE_RANK, "evidence_class");
    const firstEvidenceRow = await page
      .locator("#register-body tr")
      .first()
      .getAttribute("data-action-key");
    assertCondition(
      firstEvidenceRow === firstEvidenceKey,
      `Evidence sort drifted: expected ${firstEvidenceKey}, found ${firstEvidenceRow}`,
    );

    await page
      .locator("[data-testid='checkpoint-row-act_notification_sender_domain_verification']")
      .click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("Capture sender or domain verification evidence and stop"),
      "Inspector lost the selected notification action title.",
    );
    assertCondition(
      inspectorText.includes("DNS") || inspectorText.includes("Ownership"),
      "Inspector drifted away from sender/domain verification posture.",
    );

    const chipCount = await page
      .locator(
        "[data-testid='chip-act_notification_sender_domain_verification-capture_evidence_then_stop']",
      )
      .count();
    assertCondition(
      chipCount === 1,
      "Retry-class chip disappeared from the notification verification row.",
    );

    await page.locator("[data-testid='sort-evidence']").click();
    const focusedRow = page.locator("#register-body tr").first();
    await focusedRow.focus();
    const firstKey = await focusedRow.getAttribute("data-action-key");
    const rows = [...RETRY_MATRIX.action_rows].sort(
      (left, right) =>
        (EVIDENCE_RANK[left.evidence_class] ?? 0) - (EVIDENCE_RANK[right.evidence_class] ?? 0),
    );
    const firstIndex = rows.findIndex((row) => row.action_key === firstKey);
    const expectedNext = rows[Math.min(firstIndex + 1, rows.length - 1)].action_key;
    await page.keyboard.press("ArrowDown");
    const selected = await page
      .locator(`[data-testid='checkpoint-row-${expectedNext}']`)
      .getAttribute("data-selected");
    assertCondition(selected === "true", "Arrow-down navigation no longer advances selection.");

    const parityRows = await page.locator("#parity-body tr").count();
    assertCondition(parityRows === 5, `Expected 5 parity rows, found ${parityRows}`);

    const liveStripCards = await page.locator("[data-testid='live-gate-strip'] .live-card").count();
    assertCondition(
      liveStripCards === LIVE_GATE_RULES.provider_profiles.length,
      `Expected ${LIVE_GATE_RULES.provider_profiles.length} live-strip cards, found ${liveStripCards}`,
    );

    await page.setViewportSize({ width: 1024, height: 1100 });
    await page.locator("[data-testid='register']").waitFor();

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const bodyFlag = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(bodyFlag === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("main, aside, section").count();
    assertCondition(
      landmarkCount >= 6,
      `Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`,
    );
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

export const providerPortalControlTowerManifest = {
  task: RETRY_MATRIX.task_id,
  checkpoints: RETRY_MATRIX.summary.checkpoint_count,
  blockedGateProfiles: LIVE_GATE_RULES.summary.blocked_gate_count,
};
