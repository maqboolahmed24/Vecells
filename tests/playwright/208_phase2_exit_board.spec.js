import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "208_phase2_exit_board.html");
const DECISION_PATH = path.join(ROOT, "data", "analysis", "208_phase2_exit_gate_decision.json");
const ROWS_PATH = path.join(ROOT, "data", "analysis", "208_phase2_conformance_rows.json");
const EVIDENCE_PATH = path.join(ROOT, "data", "analysis", "208_phase2_evidence_manifest.csv");
const OPEN_ITEMS_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "208_phase2_open_items_and_crosscutting_carry_forward.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const phase2ExitBoardCoverage = [
  "Identity_Echoes_Exit_Board",
  "VerdictBand",
  "PhaseBraid",
  "ConformanceLadder",
  "BoundaryMap",
  "RiskCarryForwardTable",
  "approved state screenshot",
  "go-with-constraints state screenshot",
  "withheld state screenshot",
  "ARIA snapshots for scorecard and boundary map",
  "keyboard accessibility and focus visibility",
  "reducedMotion equivalence",
  "zoom text scaling",
  "contrast checks",
  "diagram/table parity",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
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

function getExpected() {
  for (const filePath of [HTML_PATH, DECISION_PATH, ROWS_PATH, EVIDENCE_PATH, OPEN_ITEMS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_208 artifact ${filePath}`);
  }
  const decision = JSON.parse(fs.readFileSync(DECISION_PATH, "utf8"));
  const rows = JSON.parse(fs.readFileSync(ROWS_PATH, "utf8"));
  const evidence = parseCsv(fs.readFileSync(EVIDENCE_PATH, "utf8"));
  const openItems = JSON.parse(fs.readFileSync(OPEN_ITEMS_PATH, "utf8"));
  const constrainedRow = rows.find((row) => row.status === "go_with_constraints");
  const supportItem = openItems.find((item) => item.itemId === "CFI_208_SUPPORT_SURFACE_CONSUMPTION");
  assertCondition(constrainedRow, "Expected at least one constrained row.");
  assertCondition(supportItem, "Expected support carry-forward item.");
  return { decision, rows, evidence, openItems, constrainedRow, supportItem };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/208_phase2_exit_board.html";
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
              : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local seq_208 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/208_phase2_exit_board.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openBoard(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Identity_Echoes_Exit_Board']").waitFor();
}

async function screenshot(page, relativePath) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  await page.screenshot({ path: path.join(ROOT, relativePath), fullPage: true });
}

async function assertNoOverflow(page, allowance = 1) {
  const overflow = await page.evaluate(() => {
    const width = Math.max(document.body.scrollWidth, document.documentElement.scrollWidth);
    return width - window.innerWidth;
  });
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardAgreement(page, expected) {
  for (const testId of [
    "Identity_Echoes_Exit_Board",
    "VerdictBand",
    "PhaseBraid",
    "ConformanceLadder",
    "BoundaryMap",
    "EvidenceManifestPanel",
    "RiskCarryForwardTable",
    "phase-braid-table",
    "conformance-score-table",
    "parity-table",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor();
  }
  assertCondition(
    (await page.locator("[data-testid='decision-verdict']").innerText()).trim() ===
      expected.decision.gateVerdict,
    "Default board verdict does not match decision JSON.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='approved-count']").innerText()).trim()) ===
      expected.decision.summary.approvedRowCount,
    "Approved count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='constrained-count']").innerText()).trim()) ===
      expected.decision.summary.goWithConstraintsRowCount,
    "Constrained count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='family-list'] button").count()) === expected.rows.length,
    "Conformance ladder row count drifted.",
  );
}

async function assertFamilySelection(page, expected) {
  await page
    .locator(`[data-testid='family-button-${expected.constrainedRow.capabilityFamilyId}']`)
    .click();
  const inspector = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspector.includes(expected.constrainedRow.capabilityLabel),
    "Family selection did not update inspector.",
  );
  assertCondition(
    inspector.includes("go_with_constraints"),
    "Family selection did not expose constrained proof basis or carry-forward state.",
  );
  const expectedEvidenceCount = expected.evidence.filter(
    (row) => row.capability_family_id === expected.constrainedRow.capabilityFamilyId,
  ).length;
  assertCondition(
    Number((await page.locator("[data-testid='selected-evidence-count']").innerText()).trim()) ===
      expectedEvidenceCount,
    "Evidence manifest panel count drifted.",
  );
}

async function assertBoundarySelection(page, expected) {
  await page.locator(`[data-testid='open-item-button-${expected.supportItem.itemId}']`).click();
  const inspector = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspector.includes(expected.supportItem.title),
    "BoundaryMap selection did not update inspector.",
  );
  assertCondition(
    inspector.toLowerCase().includes("support"),
    "BoundaryMap selection lost support carry-forward context.",
  );
}

async function assertStateScreenshots(page) {
  const states = [
    ["Approved state", "208-approved-state.png", "approved"],
    ["Go-with-constraints state", "208-go-with-constraints-state.png", "go_with_constraints"],
    ["Withheld state", "208-withheld-state.png", "withheld"],
  ];
  for (const [buttonName, fileName, state] of states) {
    await page.getByRole("button", { name: buttonName }).click();
    assertCondition(
      (await page.locator("[data-testid='decision-verdict']").innerText()).trim() === state,
      `${state} preview did not render.`,
    );
    await screenshot(page, `output/playwright/${fileName}`);
  }
}

async function assertAriaSnapshots(page) {
  const ladderSnapshot = await page.locator("[data-testid='ConformanceLadder']").ariaSnapshot();
  for (const token of [
    "Trust contract",
    "Provider-configuration",
    "go_with_constraints",
    "Hardening",
  ]) {
    assertCondition(ladderSnapshot.includes(token), `Scorecard ariaSnapshot missing ${token}.`);
  }
  const boundarySnapshot = await page.locator("[data-testid='BoundaryMap']").ariaSnapshot();
  const normalizedBoundarySnapshot = boundarySnapshot.toLowerCase();
  for (const token of [
    "Live NHS login",
    "Support surfaces",
    "Clinical-safety",
    "crosscutting_ready",
  ]) {
    assertCondition(
      normalizedBoundarySnapshot.includes(token.toLowerCase()),
      `Boundary ariaSnapshot missing ${token}.`,
    );
  }
}

async function assertKeyboardAccessibility(page, expected) {
  const familyButton = page.locator(
    `[data-testid='family-button-${expected.constrainedRow.capabilityFamilyId}']`,
  );
  await familyButton.focus();
  const outline = await familyButton.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}`;
  });
  assertCondition(!outline.startsWith("none"), `Focus visibility missing: ${outline}`);
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("[data-testid='inspector']").innerText()).includes(
      expected.constrainedRow.capabilityLabel,
    ),
    "Keyboard accessibility activation did not select the constrained row.",
  );
}

function parseRgb(value) {
  const match = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  assertCondition(Boolean(match), `Unable to parse rgb color ${value}`);
  return [Number(match[1]), Number(match[2]), Number(match[3])].map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
}

function contrastRatio(foreground, background) {
  const fg = parseRgb(foreground);
  const bg = parseRgb(background);
  const luminance = ([red, green, blue]) => 0.2126 * red + 0.7152 * green + 0.0722 * blue;
  const a = luminance(fg);
  const b = luminance(bg);
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
}

async function assertContrast(page) {
  const bodyContrast = await page.locator("body").evaluate((element) => {
    const body = window.getComputedStyle(element);
    const panel = window.getComputedStyle(document.querySelector("[data-testid='VerdictBand']"));
    return { color: body.color, background: panel.backgroundColor };
  });
  assertCondition(
    contrastRatio(bodyContrast.color, bodyContrast.background) >= 4.5,
    "Default text contrast is below WCAG AA threshold.",
  );
  const verdictContrast = await page.locator("[data-testid='decision-verdict']").evaluate((el) => {
    const style = window.getComputedStyle(el);
    const panel = window.getComputedStyle(document.querySelector("[data-testid='VerdictBand']"));
    return { color: style.color, background: panel.backgroundColor };
  });
  assertCondition(
    contrastRatio(verdictContrast.color, verdictContrast.background) >= 3,
    "Large verdict contrast is below large-text threshold.",
  );
}

async function assertResponsiveReducedMotionAndZoom(browser, url) {
  const mobile = await browser.newPage({ viewport: { width: 390, height: 860 } });
  try {
    await openBoard(mobile, url);
    await assertNoOverflow(mobile, 2);
    await screenshot(mobile, "output/playwright/208-mobile.png");
  } finally {
    await mobile.close();
  }

  const reducedContext = await browser.newContext({
    viewport: { width: 1280, height: 920 },
    reducedMotion: "reduce",
  });
  const reducedPage = await reducedContext.newPage();
  try {
    await openBoard(reducedPage, url);
    const duration = await reducedPage
      .locator(".severity span")
      .first()
      .evaluate((element) => window.getComputedStyle(element).animationDuration);
    assertCondition(
      Number.parseFloat(duration) <= 0.01,
      `reducedMotion did not collapse animation duration: ${duration}`,
    );
    await screenshot(reducedPage, "output/playwright/208-reduced-motion.png");
  } finally {
    await reducedContext.close();
  }

  const zoomPage = await browser.newPage({ viewport: { width: 980, height: 900 } });
  try {
    await openBoard(zoomPage, url);
    await zoomPage.addStyleTag({ content: "html { font-size: 20px; }" });
    await assertNoOverflow(zoomPage, 2);
    await screenshot(zoomPage, "output/playwright/208-zoom.png");
  } finally {
    await zoomPage.close();
  }
}

async function assertDiagramTableParity(page) {
  const text = await page.locator("[data-testid='parity-table']").innerText();
  for (const token of [
    "VerdictBand",
    "PhaseBraid",
    "ConformanceLadder",
    "BoundaryMap",
    "EvidenceManifestPanel",
  ]) {
    assertCondition(text.includes(token), `Diagram/table parity missing ${token}.`);
  }
}

export async function run() {
  const expected = getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openBoard(page, url);
    await assertNoOverflow(page);
    await assertBoardAgreement(page, expected);
    await assertFamilySelection(page, expected);
    await assertBoundarySelection(page, expected);
    await assertAriaSnapshots(page);
    await assertKeyboardAccessibility(page, expected);
    await assertDiagramTableParity(page);
    await assertContrast(page);
    await assertStateScreenshots(page);
    await page.close();

    await assertResponsiveReducedMotionAndZoom(browser, url);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("208_phase2_exit_board.spec.js: syntax ok");
}
