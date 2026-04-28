import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "tests", "165_red_flag_and_upload_lab.html");
const RED_FLAG_CASES_PATH = path.join(ROOT, "data", "test", "165_red_flag_decision_cases.csv");
const UPLOAD_CASES_PATH = path.join(ROOT, "data", "test", "165_malicious_upload_cases.csv");

export const redFlagUploadLabCoverage = [
  "decision-table case rendering and row synchronization",
  "urgent-required versus urgent-issued surface differences",
  "failed-safe upload continuity rendering",
  "keyboard traversal and landmark structure",
  "mobile, tablet, and desktop rendering",
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
      pathname = "/docs/tests/165_red_flag_and_upload_lab.html";
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
        url: `http://127.0.0.1:${address.port}/docs/tests/165_red_flag_and_upload_lab.html`,
      });
    });
  });
}

async function rowCount(page, testId) {
  return await page.locator(`[data-testid='${testId}'] tbody tr`).count();
}

async function count(page, selector) {
  return await page.locator(selector).count();
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Safety gate lab HTML is missing.");
  const redFlagRows = parseCsv(fs.readFileSync(RED_FLAG_CASES_PATH, "utf8"));
  const uploadRows = parseCsv(fs.readFileSync(UPLOAD_CASES_PATH, "utf8"));
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1120 } });
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='safety-gate-lab']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='surface-mode']").innerText()).trim() === "Safety_Gate_Lab",
      "Surface mode drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='safety_vector_mark']").count()) === 1,
      "Vecells safety vector mark is missing.",
    );
    assertCondition(
      (await count(
        page,
        "[data-testid^='case-button-RF142'], [data-testid^='case-button-165_']",
      )) === redFlagRows.length,
      "Decision case button count does not match CSV rows.",
    );
    assertCondition(
      (await count(page, "[data-testid^='case-button-UP165_']")) === uploadRows.length,
      "Upload case button count does not match CSV rows.",
    );

    await page.locator("[data-testid='case-button-RF142_HS_ACUTE_CHEST_BREATHING']").click();
    assertCondition(
      (await page.locator("[data-testid='inspector-case-id']").innerText()).trim() ===
        "RF142_HS_ACUTE_CHEST_BREATHING",
      "Decision selection did not sync inspector case ID.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-decision']").innerText()).trim() ===
        "urgent_required",
      "Decision selection did not sync outcome.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-state']").innerText()).trim() ===
        "urgent_diversion_required",
      "Decision selection did not sync requested state.",
    );
    assertCondition(
      (
        await page
          .locator("[data-testid='case-parity-table'] tr[data-selected='true'] td")
          .first()
          .innerText()
      ).trim() === "RF142_HS_ACUTE_CHEST_BREATHING",
      "Decision selection did not sync parity table row.",
    );

    await page.locator("[data-testid='urgent-settlement-button-URGENT_REQUIRED_PENDING']").click();
    assertCondition(
      (await page.locator("[data-testid='inspector-settlement']").innerText()).trim() === "pending",
      "Urgent-required pending settlement is not visible.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-urgent-visible']").innerText()).trim() ===
        "false",
      "Urgent-required pending collapsed into urgent-diverted visible.",
    );
    await page.locator("[data-testid='urgent-settlement-button-URGENT_ISSUED']").click();
    assertCondition(
      (await page.locator("[data-testid='inspector-settlement']").innerText()).trim() === "issued",
      "Urgent-issued settlement is not visible.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-urgent-visible']").innerText()).trim() ===
        "true",
      "Urgent-issued settlement did not expose urgent_diverted visible.",
    );

    await page.locator("[data-testid='case-button-UP165_MALWARE_POSITIVE']").click();
    assertCondition(
      (await page.locator("[data-testid='inspector-decision']").innerText()).trim() ===
        "quarantined_malware",
      "Malware upload did not render quarantine outcome.",
    );
    assertCondition(
      (await page.locator("[data-testid='summary-continuity']").innerText()).trim() ===
        "quarantine_visible_same_shell",
      "Malware upload did not preserve same-shell review continuity.",
    );
    assertCondition(
      (await page.locator("[data-testid='inspector-trust']").innerText()).trim() ===
        "hidden_forbidden_no_grant",
      "Malware upload appeared trusted.",
    );

    await page.locator("[data-testid='case-button-UP165_SCAN_TIMEOUT_RETRY']").click();
    assertCondition(
      (await page.locator("[data-testid='summary-continuity']").innerText()).trim() ===
        "review_required_same_shell",
      "Retryable scanner timeout collapsed into a calm receipt.",
    );

    await page.locator("[data-testid='case-button-RF142_HS_ACUTE_CHEST_BREATHING']").focus();
    await page.keyboard.press("End");
    assertCondition(
      (await page
        .locator("[data-testid='case-button-UP165_MIXED_BATCH_UNSAFE']")
        .getAttribute("data-selected")) === "true",
      "End key did not traverse to the last case.",
    );
    await page.keyboard.press("Home");
    assertCondition(
      (await page
        .locator("[data-testid='case-button-RF142_HS_ACUTE_CHEST_BREATHING']")
        .getAttribute("data-selected")) === "true",
      "Home key did not traverse back to the first case.",
    );

    assertCondition((await page.locator("header").count()) === 1, "Header landmark is missing.");
    assertCondition((await page.locator("nav").count()) === 1, "Navigation landmark is missing.");
    assertCondition((await page.locator("main").count()) === 1, "Main landmark is missing.");
    assertCondition((await page.locator("aside").count()) === 1, "Aside landmark is missing.");

    assertCondition(
      (await count(page, "[data-testid^='decision-step-']")) ===
        (await rowCount(page, "decision-ladder-table")),
      "Decision ladder visual/table parity drifted.",
    );
    assertCondition(
      (await count(page, "[data-testid^='evidence-lane-']")) ===
        (await rowCount(page, "evidence-ribbon-table")),
      "Evidence ribbon visual/table parity drifted.",
    );
    assertCondition(
      (await count(page, "[data-testid^='urgent-settlement-step-']")) ===
        (await rowCount(page, "urgent-settlement-table")),
      "Urgent settlement ladder visual/table parity drifted.",
    );
    assertCondition(
      (await rowCount(page, "case-parity-table")) === redFlagRows.length + uploadRows.length,
      "Case parity table does not cover every machine-readable row.",
    );

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
      assertCondition(overflowSafe, `Safety gate lab overflowed at ${viewport.width}px.`);
    }

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 960 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body.reduced-motion").count()) === 1,
        "Reduced-motion class did not activate.",
      );
      assertCondition(
        (await rowCount(motionPage, "case-parity-table")) ===
          redFlagRows.length + uploadRows.length,
        "Reduced-motion rendering broke case parity.",
      );
    } finally {
      await motionPage.close();
    }
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
