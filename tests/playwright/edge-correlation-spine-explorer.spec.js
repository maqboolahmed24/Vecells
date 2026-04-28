import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(
  ROOT,
  "docs",
  "architecture",
  "93_edge_correlation_spine_explorer.html",
);
const MANIFEST_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "observability_event_schema_manifest.json",
);
const POLICY_PATH = path.join(ROOT, "data", "analysis", "telemetry_redaction_policy.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "correlation_propagation_matrix.csv");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const POLICY = JSON.parse(fs.readFileSync(POLICY_PATH, "utf8"));

export const edgeCorrelationSpineExplorerCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that missing-correlation and blocked-disclosure states are visibly distinct from verified states",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }
    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }
    if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell);
      if (row.some((value) => value.length > 0)) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }
    cell += char;
  }
  if (cell.length || row.length) {
    row.push(cell);
    rows.push(row);
  }
  const [headers, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(headers.map((header, idx) => [header, values[idx] ?? ""])),
  );
}

const MATRIX_ROWS = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));

function filteredTraces({
  environment = "all",
  hopType = "all",
  eventFamily = "all",
  disclosureState = "all",
  replayState = "all",
} = {}) {
  return MANIFEST.trace_runs.filter((trace) => {
    if (environment !== "all" && trace.environment !== environment) return false;
    if (disclosureState !== "all" && trace.disclosureState !== disclosureState) return false;
    if (replayState !== "all" && trace.replayState !== replayState) return false;
    if (hopType !== "all" && !trace.hops.some((hop) => hop.hopKind === hopType)) return false;
    if (eventFamily !== "all" && !trace.hops.some((hop) => hop.eventFamily === eventFamily))
      return false;
    return true;
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/93_edge_correlation_spine_explorer.html"
          : rawUrl.split("?")[0];
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
    server.listen(4393, "127.0.0.1", () => resolve(server));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing explorer HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.EDGE_CORRELATION_SPINE_EXPLORER_URL ??
    "http://127.0.0.1:4393/docs/architecture/93_edge_correlation_spine_explorer.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='causality-river']").waitFor();
    await page.locator("[data-testid='disclosure-matrix']").waitFor();
    await page.locator("[data-testid='settlement-timeline']").waitFor();
    await page.locator("[data-testid='event-table']").waitFor();
    await page.locator("[data-testid='policy-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();
    await page.locator("#stat-replay").waitFor();

    const initialTraceCount = await page.locator("[data-testid^='trace-card-']").count();
    assertCondition(
      initialTraceCount === MANIFEST.trace_runs.length,
      `Initial trace count drifted: expected ${MANIFEST.trace_runs.length}, found ${initialTraceCount}`,
    );

    await page.locator("[data-testid='filter-environment']").selectOption("integration");
    const integrationTraces = filteredTraces({ environment: "integration" });
    assertCondition(
      (await page.locator("[data-testid^='trace-card-']").count()) === integrationTraces.length,
      "Environment filter drifted.",
    );
    await page.locator("[data-testid='trace-card-trace_support_restore_visible']").click();
    const supportInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      supportInspector.includes("trace_support_restore_visible") &&
        supportInspector.includes("restored"),
      "Support restore selection lost inspector parity.",
    );

    await page.locator("[data-testid='filter-environment']").selectOption("all");
    await page.locator("[data-testid='filter-disclosure-state']").selectOption("blocked");
    const blockedTraces = filteredTraces({ disclosureState: "blocked" });
    assertCondition(
      (await page.locator("[data-testid^='trace-card-']").count()) === blockedTraces.length,
      "Blocked disclosure filter drifted.",
    );
    await page.locator("[data-testid='trace-card-trace_governance_blocked_disclosure']").click();
    const blockedInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      blockedInspector.includes("trace_governance_blocked_disclosure") &&
        blockedInspector.includes("blocked"),
      "Blocked disclosure selection lost inspector parity.",
    );
    await page.locator("[data-testid='event-row-trace_governance_blocked_disclosure-7']").click();
    const selectedRiverNode = await page
      .locator("[data-hop='trace_governance_blocked_disclosure_hop_7']")
      .getAttribute("data-selected");
    assertCondition(
      selectedRiverNode === "true",
      "Selected hop no longer synchronizes the causality river.",
    );
    const policyRowCount = await page.locator("[data-testid^='policy-row-']").count();
    assertCondition(policyRowCount === POLICY.rules.length, "Policy table count drifted.");

    await page.locator("[data-testid='filter-disclosure-state']").selectOption("all");
    await page.locator("[data-testid='filter-replay-state']").selectOption("restored");
    const restoredTraces = filteredTraces({ replayState: "restored" });
    assertCondition(
      (await page.locator("[data-testid^='trace-card-']").count()) === restoredTraces.length,
      "Replay-state filter drifted.",
    );

    await page.locator("[data-testid='filter-replay-state']").selectOption("all");
    await page.locator("[data-testid='filter-event-family']").selectOption("ui_visibility_receipt");
    const receiptTraces = filteredTraces({ eventFamily: "ui_visibility_receipt" });
    assertCondition(
      (await page.locator("[data-testid^='trace-card-']").count()) === receiptTraces.length,
      "Event-family filter drifted.",
    );

    await page.locator("[data-testid='filter-event-family']").selectOption("all");
    await page.locator("[data-testid='trace-card-trace_patient_live_settled']").focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='trace-card-trace_support_restore_visible']")
      .getAttribute("data-selected");
    assertCondition(secondSelected === "true", "ArrowDown did not advance trace selection.");

    const verifiedColor = await page.evaluate(() => {
      const node = document.querySelector(".state-verified");
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    const blockedColor = await page.evaluate(() => {
      const node = document.querySelector(".state-blocked");
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    const missingColor = await page.evaluate(() => {
      const node = document.querySelector(".state-missing");
      return node ? getComputedStyle(node).backgroundColor : "";
    });
    assertCondition(
      verifiedColor !== blockedColor && blockedColor !== missingColor,
      "Verified, blocked, and missing states are no longer visually distinct.",
    );

    await page.setViewportSize({ width: 920, height: 1080 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("header, main, aside").count();
    assertCondition(
      landmarkCount >= 3,
      `Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`,
    );

    const replayStat = await page.locator("#stat-replay").innerText();
    assertCondition(replayStat === "2/3", `Replay health stat drifted: ${replayStat}`);

    assertCondition(
      MATRIX_ROWS.some((row) => row.traceCorrelationState === "missing"),
      "Matrix lost missing-correlation coverage.",
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
