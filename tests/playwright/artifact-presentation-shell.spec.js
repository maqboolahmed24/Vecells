import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "109_artifact_studio.html");
const MODE_EXAMPLES_PATH = path.join(ROOT, "data", "analysis", "artifact_mode_truth_examples.json");

const MODE_EXAMPLES = JSON.parse(fs.readFileSync(MODE_EXAMPLES_PATH, "utf8"));

export const artifactPresentationShellCoverage = [
  "preview allowed and summary-only downgrade stay in one governed shell",
  "provisional parity messaging remains visible near the summary",
  "embedded fallback fails closed in place",
  "handoff posture stays grant-bound and return-safe",
  "expired grants degrade print posture in place",
  "stable DOM markers publish artifact mode, parity, handoff, and recovery posture",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) {
      return null;
    }
    throw error;
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/architecture/109_artifact_studio.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir)) {
      response.writeHead(403);
      response.end("forbidden");
      return;
    }
    fs.readFile(filePath, (error, buffer) => {
      if (error) {
        response.writeHead(404);
        response.end("not found");
        return;
      }
      const extension = path.extname(filePath);
      const type =
        extension === ".html"
          ? "text/html; charset=utf-8"
          : extension === ".json"
            ? "application/json; charset=utf-8"
            : extension === ".csv"
              ? "text/csv; charset=utf-8"
              : extension === ".css"
                ? "text/css; charset=utf-8"
                : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind artifact-studio static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/109_artifact_studio.html`,
      });
    });
  });
}

function trackExternalRequests(page, baseOrigin, externalRequests) {
  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Artifact Studio HTML is missing.");
  assertCondition(MODE_EXAMPLES.task_id === "par_109", "Artifact mode example task drifted.");
  assertCondition(
    MODE_EXAMPLES.visual_mode === "Artifact_Studio",
    "Artifact studio visual mode drifted.",
  );
  assertCondition(
    JSON.stringify(MODE_EXAMPLES.summary) ===
      JSON.stringify({
        example_count: 6,
        preview_mode_count: 2,
        summary_mode_count: 2,
        placeholder_mode_count: 1,
        recovery_mode_count: 1,
      }),
    "Artifact mode example summary drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1540, height: 1200 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "artifact-studio-root",
      "artifact-studio-masthead",
      "artifact-type-selector",
      "artifact-mode-selector",
      "artifact-stage-shell",
      "artifact-right-rail",
      "artifact-action-list",
      "artifact-transfer-strip",
      "artifact-mode-diagram",
      "artifact-parity-diagram",
      "artifact-continuity-diagram",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const artifactButtons = page.locator("#artifact-buttons button");
    const modeButtons = page.locator("#mode-buttons button");
    assertCondition((await artifactButtons.count()) === 6, "Expected 6 artifact specimen buttons.");
    assertCondition((await modeButtons.count()) === 5, "Expected 5 mode shortcut buttons.");

    const stageShell = page.locator("[data-testid='artifact-stage-shell']");
    assertCondition(
      (await stageShell.getAttribute("data-artifact-mode")) === "governed_preview",
      "Default artifact specimen should begin in governed preview mode.",
    );
    assertCondition(
      (await stageShell.getAttribute("data-parity-state")) === "summary_verified",
      "Default artifact specimen lost verified parity.",
    );

    await page.locator("[data-specimen-id='record_result_provisional_preview']").click();
    assertCondition(
      (await stageShell.getAttribute("data-parity-state")) === "parity_stale",
      "Record result specimen lost provisional parity state.",
    );
    const parityText = await page.locator("[data-testid='artifact-right-rail']").innerText();
    assertCondition(
      parityText.includes("Provisional summary") && parityText.includes("Parity stale"),
      "Provisional parity messaging drifted away from the right rail.",
    );

    await page.locator("[data-mode-shortcut='summary']").click();
    assertCondition(
      (await stageShell.getAttribute("data-artifact-mode")) === "structured_summary",
      "Summary shortcut should load a summary-only specimen.",
    );
    const summaryText = await page.locator("[data-testid='artifact-stage-shell']").innerText();
    assertCondition(
      summaryText.includes("embedded") || summaryText.includes("embedded host"),
      "Summary shortcut should exercise embedded fallback language.",
    );

    await page.locator("[data-mode-shortcut='handoff']").click();
    assertCondition(
      (await stageShell.getAttribute("data-handoff-posture")) === "armed",
      "Handoff shortcut should arm the handoff posture.",
    );
    assertCondition(
      (await stageShell.getAttribute("data-return-truth-state")) === "return_safe",
      "Handoff shortcut lost return-safe continuity.",
    );
    const transferText = await page.locator("[data-testid='artifact-transfer-strip']").innerText();
    assertCondition(
      transferText.includes("pending authoritative settlement"),
      "Handoff shortcut lost pending settlement detail.",
    );

    await page.locator("[data-mode-shortcut='recovery']").click();
    assertCondition(
      (await stageShell.getAttribute("data-artifact-mode")) === "recovery_only",
      "Recovery shortcut should load recovery-only mode.",
    );
    assertCondition(
      (await stageShell.getAttribute("data-recovery-posture")) === "recovery_only",
      "Recovery shortcut lost recovery-only posture marker.",
    );
    assertCondition(
      (await stageShell.getAttribute("data-grant-state")) === "expired",
      "Recovery shortcut should exercise expired grant posture.",
    );

    await page.locator("[data-mode-shortcut='placeholder']").click();
    assertCondition(
      (await stageShell.getAttribute("data-artifact-mode")) === "placeholder_only",
      "Placeholder shortcut should load placeholder-only mode.",
    );
    const previewAction = page
      .locator("[data-testid='artifact-action-list'] .artifact-studio-action")
      .nth(0);
    const downloadAction = page
      .locator("[data-testid='artifact-action-list'] .artifact-studio-action")
      .nth(1);
    assertCondition(
      (await previewAction.getAttribute("data-allowed")) === "false",
      "Large placeholder specimen should suppress preview.",
    );
    assertCondition(
      (await downloadAction.getAttribute("data-allowed")) === "true",
      "Large placeholder specimen should still permit governed download.",
    );

    for (const marker of [
      "data-artifact-mode",
      "data-parity-state",
      "data-handoff-posture",
      "data-recovery-posture",
      "data-return-truth-state",
      "data-grant-state",
    ]) {
      const value = await stageShell.getAttribute(marker);
      assertCondition(Boolean(value), `Artifact stage shell lost required marker ${marker}.`);
    }

    assertCondition(
      externalRequests.size === 0,
      `Artifact studio should stay self-contained, but requested ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve(undefined)));
    });
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
