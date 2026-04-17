import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "tests", "166_replay_collision_lab.html");
const SUBMIT_CASES_PATH = path.join(ROOT, "data", "test", "166_submit_replay_cases.csv");
const COLLISION_CASES_PATH = path.join(ROOT, "data", "test", "166_collision_review_cases.csv");
const STALE_CASES_PATH = path.join(
  ROOT,
  "data",
  "test",
  "166_stale_resume_and_promotion_cases.csv",
);

export const replayCollisionLabCoverage = [
  "double submit and refresh-before-settlement cases",
  "stale-tab and stale-token post-promotion cases",
  "collision-review visibility and bounded recovery rendering",
  "side-effect count assertions and same-shell continuity markers",
  "mobile/tablet/desktop layouts",
  "reduced-motion equivalence",
  "diagram and table parity",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/tests/166_replay_collision_lab.html";
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
      response.writeHead(200, {
        "Content-Type": filePath.endsWith(".html")
          ? "text/html; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8",
      });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/tests/166_replay_collision_lab.html`,
      });
    });
  });
}

async function rowCount(page, testId) {
  return await page.locator(`[data-testid='${testId}'] tbody tr`).count();
}

async function locatorText(page, testId) {
  return (await page.locator(`[data-testid='${testId}']`).textContent()).trim();
}

async function counterValue(page, key) {
  return Number((await page.locator(`[data-testid='counter-${key}'] b`).innerText()).trim());
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Replay collision lab HTML is missing.");
  const submitRows = parseCsv(fs.readFileSync(SUBMIT_CASES_PATH, "utf8"));
  const collisionRows = parseCsv(fs.readFileSync(COLLISION_CASES_PATH, "utf8"));
  const staleRows = parseCsv(fs.readFileSync(STALE_CASES_PATH, "utf8"));
  const totalRows = submitRows.length + collisionRows.length + staleRows.length;
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1120 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='replay-collision-lab']").waitFor();
    assertCondition(
      (await locatorText(page, "surface-mode")) === "Replay_Collision_Lab",
      "Surface mode drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='lineage_braid_mark']").count()) === 1,
      "Lineage braid Vecells mark is missing.",
    );
    assertCondition(
      (await page.locator("[data-testid^='case-button-']").count()) === totalRows,
      "Case rail count does not match machine-readable rows.",
    );

    await page.locator("[data-testid='case-button-SUB166_CONCURRENT_DOUBLE_TAP']").click();
    assertCondition(
      (await locatorText(page, "inspector-decision")) === "new_lineage+exact_replay",
      "Double submit case did not render the combined decision.",
    );
    assertCondition(
      (await counterValue(page, "request")) === 1 &&
        (await counterValue(page, "promotion")) === 1 &&
        (await counterValue(page, "notification")) === 1,
      "Double submit side-effect counters lost exactly-once totals.",
    );
    assertCondition(
      (await locatorText(page, "inspector-shell-lineage")) === "patient.portal.requests",
      "Double submit lost same-shell continuity.",
    );

    await page.locator("[data-testid='case-button-SUB166_REFRESH_BEFORE_SETTLEMENT']").click();
    assertCondition(
      (await locatorText(page, "inspector-explanation")) ===
        "one_inflight_path_one_visible_outcome",
      "Refresh-before-settlement did not preserve one visible outcome.",
    );

    await page
      .locator("[data-testid='case-button-COL166_SOURCE_COMMAND_CHANGED_ATTACHMENT']")
      .click();
    assertCondition(
      (await locatorText(page, "inspector-decision")) === "collision_review",
      "Collision review decision is not browser-visible.",
    );
    assertCondition(
      (await locatorText(page, "inspector-settlement")) === "collision_review_open",
      "Collision review did not render the open settlement.",
    );
    assertCondition(
      (await counterValue(page, "request")) === 0 &&
        (await counterValue(page, "notification")) === 0,
      "Collision review created duplicate request or notification counters.",
    );

    await page
      .locator("[data-testid='case-button-STALE166_BACKGROUND_AUTOSAVE_AFTER_PROMOTION']")
      .click();
    assertCondition(
      (await locatorText(page, "inspector-posture")) === "resume_recovery",
      "Stale-tab recovery posture is not rendered.",
    );
    assertCondition(
      (await locatorText(page, "inspector-calm-saved")) === "false",
      "Stale post-promotion tab emitted a calm saved cue.",
    );

    await page.locator("[data-testid='case-button-STALE166_STALE_RESUME_TOKEN_REDIRECT']").click();
    assertCondition(
      (await locatorText(page, "inspector-posture")) === "open_request_receipt",
      "Stale token did not map to the authoritative request receipt.",
    );

    await page.locator("[data-testid='case-button-SUB166_EXACT_REPLAY_SAME_TAB']").focus();
    await page.keyboard.press("End");
    assertCondition(
      (await page
        .locator("[data-testid='case-button-STALE166_PRE_PROMOTION_MISSING_LEASE_RECOVERY']")
        .getAttribute("data-selected")) === "true",
      "End key did not traverse to the last case.",
    );
    await page.keyboard.press("Home");
    assertCondition(
      (await page
        .locator("[data-testid='case-button-SUB166_EXACT_REPLAY_SAME_TAB']")
        .getAttribute("data-selected")) === "true",
      "Home key did not traverse to the first case.",
    );

    assertCondition((await page.locator("header").count()) === 1, "Header landmark is missing.");
    assertCondition((await page.locator("nav").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside").count()) === 1, "Aside landmark is missing.");

    assertCondition(
      (await page.locator("[data-testid^='lineage-node-']").count()) ===
        (await rowCount(page, "lineage-braid-table")),
      "Lineage braid visual/table parity drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid^='settlement-step-']").count()) ===
        (await rowCount(page, "settlement-ladder-table")),
      "Settlement ladder visual/table parity drifted.",
    );
    assertCondition(
      (await rowCount(page, "case-parity-table")) === totalRows,
      "Case parity table does not cover every machine-readable row.",
    );

    const secondContext = await browser.newContext({ viewport: { width: 900, height: 1024 } });
    const secondTab = await secondContext.newPage();
    await secondTab.goto(url, { waitUntil: "networkidle" });
    await secondTab.locator("[data-testid='case-button-SUB166_REFRESH_BEFORE_SETTLEMENT']").click();
    assertCondition(
      (await locatorText(secondTab, "inspector-shell-lineage")) === "patient.portal.requests",
      "Isolated second browser context lost same-shell continuity markers.",
    );
    await secondContext.close();

    for (const viewport of [
      { width: 390, height: 900 },
      { width: 900, height: 1024 },
      { width: 1440, height: 1120 },
    ]) {
      await page.setViewportSize(viewport);
      await page.waitForTimeout(50);
      const overflowSafe = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth + 2,
      );
      assertCondition(overflowSafe, `Replay collision lab overflowed at ${viewport.width}px.`);
    }

    const motionContext = await browser.newContext({ viewport: { width: 1280, height: 960 } });
    const motionPage = await motionContext.newPage();
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body.reduced-motion").count()) === 1,
        "Reduced-motion class did not activate.",
      );
      assertCondition(
        (await rowCount(motionPage, "case-parity-table")) === totalRows,
        "Reduced-motion rendering broke case parity.",
      );
    } finally {
      await motionContext.close();
    }

    await context.close();
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
