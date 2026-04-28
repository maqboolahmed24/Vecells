import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "programme", "61_parallel_foundation_gate_cockpit.html");
const GROUPS_PATH = path.join(ROOT, "data", "analysis", "parallel_foundation_track_groups.json");
const SEAMS_PATH = path.join(ROOT, "data", "analysis", "parallel_track_shared_seams.json");
const VERDICT_PATH = path.join(ROOT, "data", "analysis", "parallel_foundation_gate_verdict.json");
const ELIGIBILITY_PATH = path.join(ROOT, "data", "analysis", "parallel_track_eligibility.csv");

const GROUPS_PAYLOAD = JSON.parse(fs.readFileSync(GROUPS_PATH, "utf8"));
const SEAMS_PAYLOAD = JSON.parse(fs.readFileSync(SEAMS_PATH, "utf8"));
const VERDICT_PAYLOAD = JSON.parse(fs.readFileSync(VERDICT_PATH, "utf8"));
const ELIGIBILITY_ROWS = parseCsv(fs.readFileSync(ELIGIBILITY_PATH, "utf8"));

export const parallelFoundationGateCoverage = [
  "group filtering",
  "eligibility filtering",
  "track-card selection",
  "diagram and matrix and inspector synchronization",
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
        rawUrl === "/" ? "/docs/programme/61_parallel_foundation_gate_cockpit.html" : rawUrl.split("?")[0];
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
    server.listen(4361, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing parallel foundation gate HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.PARALLEL_FOUNDATION_GATE_URL ??
    "http://127.0.0.1:4361/docs/programme/61_parallel_foundation_gate_cockpit.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='verdict-banner']").waitFor();
    await page.locator("[data-testid='shard-map']").waitFor();
    await page.locator("[data-testid='seam-diagram']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("[data-testid^='track-card-']").count();
    assertCondition(
      initialCards === VERDICT_PAYLOAD.summary.candidate_track_count,
      `Expected ${VERDICT_PAYLOAD.summary.candidate_track_count} initial track cards, found ${initialCards}`,
    );

    await page.locator("[data-testid='group-filter']").selectOption("frontend_shells");
    const frontendCards = await page.locator("[data-testid^='track-card-']").count();
    assertCondition(frontendCards === 18, `Expected 18 frontend tracks, found ${frontendCards}`);

    await page.locator("[data-testid='group-filter']").selectOption("all");
    await page.locator("[data-testid='eligibility-filter']").selectOption("conditional");
    const conditionalCards = await page.locator("[data-testid^='track-card-']").count();
    assertCondition(conditionalCards === 21, `Expected 21 conditional tracks, found ${conditionalCards}`);

    await page.locator("[data-testid='eligibility-filter']").selectOption("all");
    await page.locator("[data-testid='track-card-par_101']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("par_101") &&
        inspectorText.includes("schema::restore-run") &&
        inspectorText.includes("STUB_061_RECOVERY_CONTROL_HANDOFF"),
      "Inspector lost the restore/recovery conditional details for par_101.",
    );

    const selectedShard = await page
      .locator("[data-testid='shard-node-SHARD_061_RUNTIME_GOVERNORS']")
      .getAttribute("data-selected");
    assertCondition(selectedShard === "true", "Shard map did not synchronize with the selected runtime-governor track.");

    const selectedMatrixRow = await page
      .locator("[data-testid='matrix-row-par_101']")
      .getAttribute("data-selected");
    assertCondition(selectedMatrixRow === "true", "Eligibility matrix did not synchronize with the selected track.");

    const selectedSeam = await page
      .locator("[data-testid='seam-node-SEAM_061_RECOVERY_AND_READINESS_TUPLES']")
      .getAttribute("data-selected");
    assertCondition(selectedSeam === "true", "Seam diagram did not highlight the recovery tuple seam.");

    const shardNodes = await page.locator("[data-testid^='shard-node-']").count();
    const shardParityRows = await page.locator("[data-testid='shard-parity-table'] tbody tr").count();
    assertCondition(
      shardNodes === GROUPS_PAYLOAD.summary.shard_count && shardNodes === shardParityRows,
      "Shard map parity drifted from the shard payload.",
    );

    const seamNodes = await page.locator("[data-testid^='seam-node-']").count();
    const seamParityRows = await page.locator("[data-testid='seam-parity-table'] tbody tr").count();
    assertCondition(
      seamNodes === SEAMS_PAYLOAD.summary.shared_seam_count && seamNodes === seamParityRows,
      "Seam diagram parity drifted from the seam payload.",
    );

    await page.locator("[data-testid='track-card-par_077']").focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='track-card-par_078']")
      .getAttribute("data-selected");
    assertCondition(secondSelected === "true", "Arrow-down navigation no longer advances track-card selection.");

    await page.locator("[data-testid='matrix-row-par_094']").focus();
    await page.keyboard.press("ArrowDown");
    const nextRowSelected = await page
      .locator("[data-testid='matrix-row-par_096']")
      .getAttribute("data-selected");
    assertCondition(nextRowSelected === "true", "Arrow-down navigation no longer advances matrix-row selection.");

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
    assertCondition(landmarks >= 9, `Expected multiple landmarks, found ${landmarks}`);
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

export const parallelFoundationGateManifest = {
  task: VERDICT_PAYLOAD.task_id,
  candidateTracks: VERDICT_PAYLOAD.summary.candidate_track_count,
  eligibleTracks: VERDICT_PAYLOAD.summary.eligible_track_count,
  conditionalTracks: VERDICT_PAYLOAD.summary.conditional_track_count,
  blockedTracks: VERDICT_PAYLOAD.summary.blocked_track_count,
  seamCount: SEAMS_PAYLOAD.summary.shared_seam_count,
  stubCount: SEAMS_PAYLOAD.summary.interface_stub_count,
  eligibilityRows: ELIGIBILITY_ROWS.length,
};
