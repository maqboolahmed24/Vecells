import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "87_event_spine_topology_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "event_broker_topology_manifest.json");
const MAPPING_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "canonical_event_to_transport_mapping.json",
);

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const MAPPING = JSON.parse(fs.readFileSync(MAPPING_PATH, "utf8"));

export const eventSpineAtlasCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verification that DLQ or quarantine routes remain visibly distinct from ordinary delivery",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function filteredMappings({
  namespace = "all",
  queueClass = "all",
  retryPosture = "all",
  consumerGroup = "all",
  eventState = "all",
}) {
  return MAPPING.transportMappings.filter((row) => {
    return (
      (namespace === "all" || row.namespaceCode === namespace) &&
      (queueClass === "all" || row.queueClassRefs.includes(queueClass)) &&
      (retryPosture === "all" || row.retryPostures.includes(retryPosture)) &&
      (consumerGroup === "all" || row.consumerGroupRefs.includes(consumerGroup)) &&
      (eventState === "all" || row.eventState === eventState)
    );
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/87_event_spine_topology_atlas.html"
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
          : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4387, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing event spine atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1460, height: 1180 } });
  const url =
    process.env.EVENT_SPINE_ATLAS_URL ??
    "http://127.0.0.1:4387/docs/architecture/87_event_spine_topology_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='river-diagram']").waitFor();
    await page.locator("[data-testid='queue-chart']").waitFor();
    await page.locator("[data-testid='trace-strip']").waitFor();
    await page.locator("[data-testid='topology-table']").waitFor();
    await page.locator("[data-testid='checkpoint-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialRows = await page.locator("[data-testid^='topology-row-']").count();
    assertCondition(
      initialRows === filteredMappings({}).length,
      `Initial topology row count drifted: expected ${filteredMappings({}).length}, found ${initialRows}`,
    );

    await page.locator("#filter-namespace").selectOption("communication");
    const communicationRows = await page.locator("[data-testid^='topology-row-']").count();
    assertCondition(
      communicationRows === filteredMappings({ namespace: "communication" }).length,
      "Namespace filter drifted.",
    );

    await page.locator("#filter-queue-class").selectOption("callback_checkpoint");
    const callbackRows = await page.locator("[data-testid^='topology-row-']").count();
    assertCondition(
      callbackRows ===
        filteredMappings({ namespace: "communication", queueClass: "callback_checkpoint" }).length,
      "Queue class filter drifted.",
    );

    await page.locator("#filter-retry").selectOption("correlation_checkpoint_retry");
    const retryRows = await page.locator("[data-testid^='topology-row-']").count();
    assertCondition(
      retryRows ===
        filteredMappings({
          namespace: "communication",
          queueClass: "callback_checkpoint",
          retryPosture: "correlation_checkpoint_retry",
        }).length,
      "Retry posture filter drifted.",
    );

    await page.locator("#filter-namespace").selectOption("all");
    await page.locator("#filter-queue-class").selectOption("all");
    await page.locator("#filter-retry").selectOption("all");
    await page.locator("#filter-consumer-group").selectOption("cg_notification_dispatch");
    await page.locator("#filter-event-state").selectOption("watch_or_review");

    const target = MAPPING.transportMappings.find(
      (row) => row.eventName === "patient.receipt.degraded",
    );
    assertCondition(Boolean(target), "Missing patient.receipt.degraded mapping.");

    await page
      .locator(`[data-testid='topology-row-${target.canonicalEventContractRef}'] .row-button`)
      .click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("patient.receipt.degraded") &&
        inspectorText.includes("q_event_notification_effects"),
      "Inspector lost expected degraded receipt detail.",
    );

    const dlqCards = await page
      .locator("[data-testid^='queue-card-'] [class*='queue-chip-dlq']")
      .count();
    assertCondition(
      dlqCards > 0,
      "DLQ chips are no longer visibly distinct from ordinary queue posture.",
    );

    await page.locator("#filter-consumer-group").selectOption("all");
    await page.locator("#filter-event-state").selectOption("all");
    const rows = filteredMappings({});
    const first = rows[0];
    const second = rows[1];
    const firstRow = page.locator(
      `[data-testid='topology-row-${first.canonicalEventContractRef}'] .row-button`,
    );
    await firstRow.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator(`[data-testid='topology-row-${second.canonicalEventContractRef}']`)
      .getAttribute("class");
    assertCondition(
      secondSelected?.includes("row-selected") === true,
      "Arrow-down navigation no longer advances to the next topology row.",
    );

    await page.setViewportSize({ width: 960, height: 1080 });
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
    assertCondition(landmarks >= 6, `Accessibility smoke failed: found ${landmarks} landmarks.`);
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

export const eventSpineAtlasManifest = {
  task: MANIFEST.task_id,
  streams: MANIFEST.summary.stream_count,
  mappings: MANIFEST.summary.transport_mapping_count,
  queueGroups: MANIFEST.summary.queue_group_count,
};
