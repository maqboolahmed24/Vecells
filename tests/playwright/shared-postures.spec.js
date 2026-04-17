import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "110_posture_gallery.html");
const JSON_PATH = path.join(ROOT, "data", "analysis", "degraded_mode_examples.json");

const GALLERY_JSON = JSON.parse(fs.readFileSync(JSON_PATH, "utf8"));

export const sharedPostureCoverage = [
  "same-shell loading summary preserving context",
  "empty vs blocked vs partial posture separation",
  "preserved anchor remains visible under recovery",
  "reduced-motion equivalence",
  "breakpoint behavior and mission-stack fold compatibility",
  "DOM markers for posture class, preserved anchor, and dominant recovery action",
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
      pathname = "/docs/architecture/110_posture_gallery.html";
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
        reject(new Error("Unable to bind shared posture static server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/architecture/110_posture_gallery.html`,
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
  assertCondition(fs.existsSync(HTML_PATH), "Shared posture gallery HTML is missing.");
  assertCondition(GALLERY_JSON.task_id === "par_110", "Shared posture gallery task drifted.");
  assertCondition(
    JSON.stringify(GALLERY_JSON.summary) ===
      JSON.stringify({
        example_count: 10,
        posture_count: 10,
        audience_count: 6,
        preserved_anchor_count: 10,
        dominant_action_count: 10,
        comparison_profile_count: 3,
      }),
    "Shared posture gallery summary drifted.",
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1520, height: 1180 } });
    const page = await context.newPage();
    const baseOrigin = new URL(url).origin;
    const externalRequests = new Set();
    trackExternalRequests(page, baseOrigin, externalRequests);

    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "posture-gallery-root",
      "posture-category-rail",
      "posture-stage",
      "posture-inspector",
      "comparison-strip",
      "audience-controls",
      "posture-controls",
      "breakpoint-controls",
      "motion-controls",
      "taxonomy-diagram",
      "precedence-diagram",
      "visibility-matrix-diagram",
      "reduced-motion-equivalence",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    const stage = page.locator("[data-testid='posture-stage']");
    assertCondition(
      (await stage.getAttribute("data-posture-class")) === "loading_summary",
      "Gallery should open on loading_summary posture.",
    );
    for (const selector of ["stage-shell", "stage-status-strip", "stage-case-pulse", "stage-anchor"]) {
      await page.locator(`[data-testid='${selector}']`).waitFor();
    }
    assertCondition(
      (await stage.getAttribute("data-preserved-anchor")) === "17 Apr 2026, 09:40 appointment",
      "Loading summary should preserve the current anchor.",
    );

    await page.getByRole("button", { name: "partial visibility" }).click();
    assertCondition(
      (await stage.getAttribute("data-posture-class")) === "partial_visibility",
      "Partial visibility button should switch the stage posture.",
    );
    assertCondition(
      (await stage.getAttribute("data-visibility-state")) === "partial",
      "Partial visibility stage lost its visibility marker.",
    );
    const partialText = await page.locator("[data-testid='stage-note']").innerText();
    assertCondition(
      partialText.includes("partially visible and bounded"),
      "Partial visibility stage copy drifted.",
    );

    await page.getByRole("button", { name: "blocked recovery" }).click();
    assertCondition(
      (await stage.getAttribute("data-posture-class")) === "blocked_recovery",
      "Blocked recovery button should switch the stage posture.",
    );
    assertCondition(
      (await stage.getAttribute("data-dominant-recovery-action")) === "Reconcile the blocked line",
      "Blocked recovery stage lost its dominant recovery action marker.",
    );
    assertCondition(
      (await page.locator("[data-testid='stage-anchor']").innerText()).includes("Dispense line 14"),
      "Blocked recovery should preserve the current anchor.",
    );

    await page.getByRole("button", { name: "empty" }).click();
    assertCondition(
      (await stage.getAttribute("data-posture-class")) === "empty",
      "Empty button should switch the stage posture.",
    );
    const emptyText = await page.locator("[data-testid='stage-note']").innerText();
    assertCondition(
      emptyText.includes("No task needs action in this queue right now"),
      "Empty posture copy drifted.",
    );
    assertCondition(
      !emptyText.includes("Recovery is required before the dispense line can resume"),
      "Empty posture must stay distinct from blocked recovery.",
    );

    const summaryBeforeMotion = await page.locator("[data-testid='stage-note']").innerText();
    const anchorBeforeMotion = await stage.getAttribute("data-preserved-anchor");
    await page.getByRole("button", { name: "Reduced motion" }).click();
    assertCondition(
      (await stage.getAttribute("data-motion-profile")) === "reduced",
      "Reduced motion toggle drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='stage-note']").innerText()) === summaryBeforeMotion,
      "Reduced motion should not change the visible stage summary.",
    );
    assertCondition(
      (await stage.getAttribute("data-preserved-anchor")) === anchorBeforeMotion,
      "Reduced motion should preserve the same anchor.",
    );

    await page.getByRole("button", { name: "blocked recovery" }).click();
    const postureBeforeFold = await stage.getAttribute("data-posture-class");
    const actionBeforeFold = await stage.getAttribute("data-dominant-recovery-action");
    await page.getByRole("button", { name: "Mission stack" }).click();
    assertCondition(
      (await page.locator("[data-testid='posture-gallery-layout']").getAttribute("data-layout-mode")) ===
        "mission_stack",
      "Mission-stack layout toggle drifted.",
    );
    assertCondition(
      (await stage.getAttribute("data-posture-class")) === postureBeforeFold,
      "Mission-stack fold must preserve the current posture class.",
    );
    assertCondition(
      (await stage.getAttribute("data-dominant-recovery-action")) === actionBeforeFold,
      "Mission-stack fold must preserve the dominant recovery action.",
    );
    await page.locator("[data-testid='mission-stack-note']").waitFor();

    const comparisonCards = await page.locator("#comparison-strip .comparison-card").count();
    assertCondition(comparisonCards === 3, `Expected 3 comparison cards, found ${comparisonCards}.`);

    assertCondition(
      externalRequests.size === 0,
      `Shared posture gallery made unexpected external requests: ${Array.from(externalRequests).join(", ")}`,
    );
  } finally {
    await browser.close();
    await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === __filename;
if (isMain) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
