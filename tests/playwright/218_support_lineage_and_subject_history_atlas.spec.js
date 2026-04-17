import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const ATLAS_PATH = path.join(
  ROOT,
  "docs",
  "frontend",
  "218_support_lineage_and_subject_history_atlas.html",
);
const CONTRACT_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "218_support_lineage_ticket_subject_history_contract.json",
);
const MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "218_support_scope_member_and_subject_history_matrix.csv",
);
const ALIAS_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "218_support_lineage_alias_and_gap_resolution.json",
);
const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const supportLineageAtlasCoverage = [
  "Support_Lineage_Atlas",
  "TicketAnatomyBoard",
  "LineageBindingBoard",
  "ScopeMemberBoard",
  "Subject360Board",
  "SubjectHistoryDisclosureBoard",
  "ProvenanceArtifactBindingBoard",
  "ReadOnlyFallbackBoard",
  "SupportTicketWorkspaceProjection",
  "SupportTicket",
  "SupportLineageBinding",
  "SupportLineageScopeMember",
  "SupportLineageArtifactBinding",
  "SupportSubject360Projection",
  "SupportSubjectContextBinding",
  "SupportContextDisclosureRecord",
  "SupportSubjectHistoryQuery",
  "SupportSubjectHistoryProjection",
  "SupportReadOnlyFallbackProjection",
  "ARIA snapshots",
  "keyboard tablist",
  "mobile viewport",
  "reduced motion",
];

function assertCondition(condition, message) {
  if (!condition) throw new Error(message);
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
  for (const filePath of [ATLAS_PATH, CONTRACT_PATH, MATRIX_PATH, ALIAS_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing task 218 artifact ${filePath}`);
  }
  const html = fs.readFileSync(ATLAS_PATH, "utf8");
  const contract = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const alias = JSON.parse(fs.readFileSync(ALIAS_PATH, "utf8"));
  assertCondition(html.includes("window.__supportLineageAtlasData"), "Atlas data missing.");
  assertCondition(contract.visualMode === "Support_Lineage_Atlas", "Contract mode drifted.");
  assertCondition(matrix.length >= 12, "Support scope matrix needs critical rows.");
  assertCondition(alias.parallelGaps.length >= 2, "Alias and gap resolution missing.");
  for (const marker of [
    "SupportLineageBinding",
    "SupportLineageScopeMember",
    "SupportLineageArtifactBinding",
    "SupportTicketWorkspaceProjection",
    "SupportSubject360Projection",
    "SupportSubjectContextBinding",
    "SupportContextDisclosureRecord",
    "SupportReadOnlyFallbackProjection",
  ]) {
    assertCondition(html.includes(marker), `Atlas missing ${marker}`);
    assertCondition(JSON.stringify(contract).includes(marker), `Contract missing ${marker}`);
  }
  return { contract, matrix, alias };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/218_support_lineage_and_subject_history_atlas.html";
    }
    const filePath = path.join(rootDir, pathname);
    if (!filePath.startsWith(rootDir) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const extension = path.extname(filePath);
    const contentType =
      extension === ".html"
        ? "text/html; charset=utf-8"
        : extension === ".json"
          ? "application/json; charset=utf-8"
          : extension === ".csv"
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });
  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local task 218 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/218_support_lineage_and_subject_history_atlas.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openAtlas(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Support_Lineage_Atlas']").waitFor();
}

async function screenshot(page, relativePath) {
  const outputPath = path.join(ROOT, relativePath);
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  await page.screenshot({ path: outputPath, fullPage: true });
}

async function assertNoOverflow(page, allowance = 2) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= allowance, `Page has horizontal overflow of ${overflow}px.`);
}

async function selectBoard(page, boardId) {
  await page.locator(`[data-scenario-button='${boardId}']`).click();
  await page.waitForFunction((id) => document.documentElement.dataset.scenario === id, boardId);
}

async function assertBoards(page) {
  const boardPairs = [
    ["ticket", "TicketAnatomyBoard"],
    ["lineage", "LineageBindingBoard"],
    ["scope", "ScopeMemberBoard"],
    ["subject360", "Subject360Board"],
    ["history", "SubjectHistoryDisclosureBoard"],
    ["provenance", "ProvenanceArtifactBindingBoard"],
    ["fallback", "ReadOnlyFallbackBoard"],
  ];
  for (const [boardId, testId] of boardPairs) {
    await selectBoard(page, boardId);
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).count()) === 1,
      `Missing ${testId}`,
    );
    assertCondition(
      (await page.locator(`[data-testid='${testId}']`).isVisible()) === true,
      `${testId} is not visible`,
    );
  }
}

async function assertScreenshots(page) {
  const shots = [
    ["ticket", "output/playwright/218-atlas-ticket-anatomy.png"],
    ["lineage", "output/playwright/218-atlas-lineage-binding.png"],
    ["scope", "output/playwright/218-atlas-scope-members.png"],
    ["subject360", "output/playwright/218-atlas-subject-360.png"],
    ["history", "output/playwright/218-atlas-subject-history.png"],
    ["provenance", "output/playwright/218-atlas-provenance.png"],
    ["fallback", "output/playwright/218-atlas-read-only-fallback.png"],
  ];
  for (const [boardId, outputPath] of shots) {
    await selectBoard(page, boardId);
    await assertNoOverflow(page);
    await screenshot(page, outputPath);
  }
  await selectBoard(page, "ticket");
  await screenshot(page, "output/playwright/218-atlas.png");
}

async function assertAriaSnapshots(page) {
  await selectBoard(page, "lineage");
  const lineage = await page.locator("[data-testid='LineageBindingBoard']").ariaSnapshot();
  for (const token of [
    "SupportLineageBinding",
    "Canonical join",
    "lineage_214_a",
    "mask_scope_218_support_summary",
  ]) {
    assertCondition(lineage.includes(token), `Lineage ARIA missing ${token}`);
  }

  await selectBoard(page, "history");
  const history = await page
    .locator("[data-testid='SubjectHistoryDisclosureBoard']")
    .ariaSnapshot();
  for (const token of [
    "SupportSubjectHistoryQuery",
    "SupportContextDisclosureRecord",
    "SUPPORT_218_SUBJECT_HISTORY_DISCLOSURE_GATED",
  ]) {
    assertCondition(history.includes(token), `History ARIA missing ${token}`);
  }

  await selectBoard(page, "fallback");
  const fallback = await page.locator("[data-testid='ReadOnlyFallbackBoard']").ariaSnapshot();
  for (const token of ["SupportReadOnlyFallbackProjection", "same-shell reacquire"]) {
    assertCondition(fallback.includes(token), `Fallback ARIA missing ${token}`);
  }
}

async function assertKeyboardAndData(page) {
  await page.locator("[data-scenario-button='ticket']").focus();
  await page.keyboard.press("ArrowRight");
  assertCondition(
    (await page.locator("[data-scenario-button='lineage']").getAttribute("aria-selected")) ===
      "true",
    "ArrowRight did not move board selection.",
  );
  await page.keyboard.press("ArrowLeft");
  assertCondition(
    (await page.locator("[data-scenario-button='ticket']").getAttribute("aria-selected")) ===
      "true",
    "ArrowLeft did not move board selection.",
  );
  const data = await page.evaluate(() => window.__supportLineageAtlasData);
  assertCondition(data.visualMode === "Support_Lineage_Atlas", "Atlas data visual mode drifted.");
  assertCondition(
    data.projections.includes("SupportContextDisclosureRecord"),
    "Atlas data missing disclosure record.",
  );
}

async function assertAccessibility(page) {
  assertCondition((await page.locator("main").count()) === 1, "Expected one main landmark.");
  for (const label of [
    "Support lineage atlas",
    "Support lineage boards",
    "Ticket anatomy board",
    "Support lineage binding fields",
    "Subject history slices",
  ]) {
    assertCondition(
      (await page.locator(`[aria-label='${label}']`).count()) >= 1,
      `Missing aria-label ${label}`,
    );
  }
  await selectBoard(page, "subject360");
  assertCondition((await page.locator("time[datetime]").count()) >= 3, "Missing timestamps.");
  await selectBoard(page, "lineage");
  assertCondition((await page.locator("table th").count()) >= 2, "Missing table headers.");
  await selectBoard(page, "ticket");
  assertCondition((await page.locator("dl dt").count()) >= 5, "Missing description-list terms.");
}

async function assertReducedMotionAndMobile(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 390, height: 840 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  await openAtlas(page, url);
  await selectBoard(page, "history");
  await assertNoOverflow(page);
  await screenshot(page, "output/playwright/218-atlas-mobile.png");
  await page.emulateMedia({ reducedMotion: "reduce" });
  await selectBoard(page, "fallback");
  await screenshot(page, "output/playwright/218-atlas-reduced-motion.png");
  await context.close();
}

export async function run() {
  getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1360, height: 940 } });
    await openAtlas(page, url);
    await assertBoards(page);
    await assertScreenshots(page);
    await assertAriaSnapshots(page);
    await assertKeyboardAndData(page);
    await assertAccessibility(page);
    await assertReducedMotionAndMobile(browser, url);
    await page.close();
  } finally {
    await browser.close();
    await closeServer(server);
  }
  return true;
}

if (process.argv.includes("--run")) {
  run()
    .then(() => {
      console.log("[218-support-lineage-atlas] validation passed");
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  getExpected();
  console.log(supportLineageAtlasCoverage.join("\n"));
}
