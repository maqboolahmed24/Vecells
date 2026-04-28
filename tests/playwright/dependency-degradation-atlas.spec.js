import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "98_dependency_degradation_atlas.html");
const CATALOG_PATH = path.join(ROOT, "data", "analysis", "dependency_degradation_profiles.json");

const CATALOG = JSON.parse(fs.readFileSync(CATALOG_PATH, "utf8"));
const GOVERNANCE_COUNT = CATALOG.profiles.filter((profile) =>
  profile.audienceFallbacks.some((fallback) => fallback.audienceType === "governance"),
).length;
const CALLBACK_AMBIGUITY_COUNT = CATALOG.profiles.filter(
  (profile) => profile.failureModeClass === "callback_ambiguity",
).length;
const DISTINCT_MODES = [
  "gateway_read_only",
  "command_halt",
  "projection_stale",
  "integration_queue_only",
  "local_placeholder",
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

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const rawUrl = req.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/98_dependency_degradation_atlas.html"
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
    server.listen(4398, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing dependency degradation atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1480, height: 1120 } });
  const url =
    process.env.DEPENDENCY_DEGRADATION_ATLAS_URL ??
    "http://127.0.0.1:4398/docs/architecture/98_dependency_degradation_atlas.html";

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    for (const testId of [
      "degradation-masthead",
      "profile-rail",
      "fallback-table",
      "impact-table",
      "audience-table",
      "inspector",
      "filter-topology",
      "filter-audience",
      "filter-failure-mode",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    let cards = await page.locator(".profile-card").count();
    assertCondition(
      cards === CATALOG.summary.runtime_execution_profile_count,
      `Expected ${CATALOG.summary.runtime_execution_profile_count} profile cards, found ${cards}.`,
    );

    await page.locator("[data-testid='filter-topology']").selectOption("command_halt");
    cards = await page.locator(".profile-card").count();
    assertCondition(
      cards === CATALOG.summary.command_halt_count,
      `Expected ${CATALOG.summary.command_halt_count} command_halt cards, found ${cards}.`,
    );

    await page.locator("[data-testid='filter-topology']").selectOption("all");
    await page.locator("[data-testid='filter-audience']").selectOption("governance");
    cards = await page.locator(".profile-card").count();
    assertCondition(
      cards === GOVERNANCE_COUNT,
      `Expected ${GOVERNANCE_COUNT} governance cards, found ${cards}.`,
    );
    await page.locator("[data-testid='profile-card-dep_nhs_assurance_and_standards_sources']").click();
    const governanceInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      governanceInspector.includes("local_placeholder") &&
        governanceInspector.includes("FOLLOW_ON_DEPENDENCY_CONTENT_OPERATIONS_DIAGNOSTIC_COPY_V1"),
      "Audience fallback inspection lost the governance-bounded placeholder posture.",
    );

    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-failure-mode']").selectOption("callback_ambiguity");
    cards = await page.locator(".profile-card").count();
    assertCondition(
      cards === CALLBACK_AMBIGUITY_COUNT,
      `Expected ${CALLBACK_AMBIGUITY_COUNT} callback_ambiguity cards, found ${cards}.`,
    );
    await page.locator("[data-testid='profile-card-dep_nhs_login_rail']").click();
    const identityInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      identityInspector.includes("callback_ambiguity") &&
        identityInspector.includes("patient_safe_placeholder") &&
        identityInspector.includes("gateway_read_only"),
      "Inspector lost callback ambiguity or bounded fallback tokens for NHS login.",
    );

    await page.locator("[data-testid='filter-failure-mode']").selectOption("transport_loss");
    await page.locator("[data-testid='profile-card-dep_transcription_processing_provider']").click();
    const transcriptInspector = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      transcriptInspector.includes("projection_stale"),
      "Failure-mode filtering lost projection_stale bounded fallback detail.",
    );

    await page.locator("[data-testid='filter-topology']").selectOption("all");
    await page.locator("[data-testid='filter-audience']").selectOption("all");
    await page.locator("[data-testid='filter-failure-mode']").selectOption("all");
    await page.locator("[data-testid='profile-card-dep_nhs_login_rail']").focus();
    await page.keyboard.press("ArrowDown");
    const nextSelected = await page
      .locator(`[data-testid='profile-card-${CATALOG.profiles[1].dependencyCode}']`)
      .getAttribute("data-selected");
    assertCondition(nextSelected === "true", "ArrowDown did not advance profile selection.");

    for (const mode of DISTINCT_MODES) {
      const badgeCount = await page.locator(`[data-mode='${mode}']`).count();
      assertCondition(
        badgeCount > 0,
        `${mode} disappeared from the atlas; fallback modes must remain visually distinct.`,
      );
    }

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reduced = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reduced === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    await page.setViewportSize({ width: 1040, height: 920 });
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared at tablet width.",
    );
    assertCondition(
      await page.locator("[data-testid='audience-table']").isVisible(),
      "Audience fallback table disappeared at tablet width.",
    );

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(
      landmarks >= 8,
      `Accessibility smoke failed: found only ${landmarks} landmarks.`,
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

export const dependencyDegradationAtlasManifest = {
  task: "par_098",
  profiles: CATALOG.summary.runtime_execution_profile_count,
  coverage: [
    "topology fallback filtering",
    "audience fallback inspection",
    "failure-mode filtering",
    "keyboard navigation",
    "reduced motion",
    "responsive layout",
    "accessibility landmarks",
    "gateway_read_only, command_halt, projection_stale, integration_queue_only, and local_placeholder remain distinct",
  ],
};
