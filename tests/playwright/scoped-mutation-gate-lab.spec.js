import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "56_scoped_mutation_gate_lab.html");
const DECISION_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "scoped_mutation_gate_decision_table.csv",
);
const SETTLEMENT_PATH = path.join(ROOT, "data", "analysis", "command_settlement_result_matrix.csv");

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
      pathname = "/docs/architecture/56_scoped_mutation_gate_lab.html";
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
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": type });
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
        url: `http://127.0.0.1:${address.port}/docs/architecture/56_scoped_mutation_gate_lab.html`,
      });
    });
  });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "Scoped mutation gate lab HTML is missing.");
  const decisionRows = parseCsv(fs.readFileSync(DECISION_PATH, "utf8"));
  const settlementRows = parseCsv(fs.readFileSync(SETTLEMENT_PATH, "utf8"));
  assertCondition(
    decisionRows.length === 16,
    `Expected 16 decision rows, found ${decisionRows.length}.`,
  );
  assertCondition(
    settlementRows.length === 10,
    `Expected 10 settlement rows, found ${settlementRows.length}.`,
  );

  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const { server, url } = await serve(ROOT);
  const browser = await playwright.chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1100 } });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='filter-audience']").waitFor();
    await page.locator("[data-testid='authority-braid']").waitFor();
    await page.locator("[data-testid='settlement-ladder']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialCards = await page.locator("[data-testid^='decision-card-']").count();
    assertCondition(
      initialCards === decisionRows.length,
      `Initial decision-card parity drifted: ${initialCards}`,
    );

    await page.locator("[data-testid='filter-binding-state']").selectOption("recovery_only");
    const recoveryOnlyCards = await page.locator("[data-testid^='decision-card-']").count();
    assertCondition(
      recoveryOnlyCards === 2,
      `Recovery-only filter expected 2 cards, found ${recoveryOnlyCards}.`,
    );

    await page.locator("[data-testid='filter-binding-state']").selectOption("all");
    await page.locator("[data-testid='filter-action-scope']").selectOption("claim");
    const claimCards = await page.locator("[data-testid^='decision-card-']").count();
    assertCondition(claimCards === 2, `Claim filter expected 2 cards, found ${claimCards}.`);

    await page.locator("[data-testid='filter-action-scope']").selectOption("all");
    await page
      .locator("[data-testid='filter-route-family']")
      .selectOption("rf_patient_appointments");
    const appointmentCards = await page.locator("[data-testid^='decision-card-']").count();
    assertCondition(
      appointmentCards === 3,
      `Appointment route filter expected 3 cards, found ${appointmentCards}.`,
    );

    const firstCard = page.locator(
      "[data-testid='decision-card-rib-056-patient-manage-booking-v1']",
    );
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const secondSelected = await page
      .locator("[data-testid='decision-card-rib-056-patient-waitlist-accept-v1']")
      .getAttribute("data-selected");
    assertCondition(
      secondSelected === "true",
      "ArrowDown did not advance decision-card selection.",
    );

    await page.locator("[data-testid='filter-route-family']").selectOption("all");
    const supportCard = page.locator(
      "[data-testid='decision-card-rib-056-support-repair-action-v1']",
    );
    await supportCard.scrollIntoViewIfNeeded();
    await supportCard.click({ force: true });
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("ASTR_056_SUPPORT_WORKSPACE_V1") &&
        inspectorText.includes("AST_054_SUPPORT_WORKSPACE_V1") &&
        inspectorText.includes("supportMutationAttempt://current"),
      "Inspector lost support repair tuple detail.",
    );

    const linkedSettlement = await page
      .locator("[data-testid='settlement-row-review-required']")
      .getAttribute("data-linked");
    assertCondition(
      linkedSettlement === "true",
      "Support repair row failed to link settlement ladder.",
    );

    const linkedRecovery = await page
      .locator("[data-testid='recovery-row-contact-repair-required']")
      .getAttribute("data-linked");
    assertCondition(
      linkedRecovery !== null,
      "Recovery matrix failed to render contact repair row.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(inspectorVisible, "Inspector disappeared at mobile width.");

    const reducedContext = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    try {
      await reducedPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await reducedPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await reducedContext.close();
    }

    const landmarks = await page.locator("header, main, aside, section").count();
    assertCondition(landmarks >= 6, `Expected multiple landmarks, found ${landmarks}.`);
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

export const scopedMutationGateLabManifest = {
  decisionRows: 16,
  settlementRows: 10,
  coverage: [
    "binding-state filtering",
    "action-scope filtering",
    "same-shell recovery parity",
    "inspector rendering",
    "keyboard navigation",
    "responsive behavior",
    "reduced motion",
  ],
};
