import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {
  ROOT,
  allocatePort,
  assertCondition,
  importPlaywright,
  outputPath,
} from "./255_workspace_shell_helpers";

const ATLAS_PATH = "/docs/frontend/280_phase4_booking_flow_contract_atlas.html";
const CONTRACT_SPLIT_PATH = path.join(ROOT, "data", "analysis", "280_contract_split_matrix.csv");
const STATE_TABLE_PATH = path.join(ROOT, "data", "analysis", "280_revalidation_commit_and_manage_state_table.csv");

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  return "text/plain; charset=utf-8";
}

async function startAtlasServer(): Promise<{ atlasUrl: string; server: http.Server }> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? ATLAS_PATH : decodeURIComponent(requestUrl.pathname);
    const filePath = path.join(ROOT, pathname);

    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }

    response.writeHead(200, { "Content-Type": contentTypeFor(filePath) });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve());
  });

  return {
    atlasUrl: `http://127.0.0.1:${port}${ATLAS_PATH}`,
    server,
  };
}

async function stopAtlasServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
}

function parseCsv(text: string): Array<Record<string, string>> {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const result: Record<string, string> = {};
    const values: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
        continue;
      }
      if (char === '"') {
        inQuotes = !inQuotes;
        continue;
      }
      if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
        continue;
      }
      current += char;
    }
    values.push(current);
    headers.forEach((header, index) => {
      result[header] = values[index] ?? "";
    });
    return result;
  });
}

async function openAtlas(page: any, atlasUrl: string): Promise<void> {
  await page.goto(atlasUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='BookingFlowContractAtlas']").waitFor();
  await page.locator("[data-testid='FormulaLedgerTable']").waitFor();
}

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 24): Promise<void> {
  for (let step = 0; step < maxTabs; step += 1) {
    await page.keyboard.press("Tab");
    const matched = await page.evaluate((targetSelector: string) => {
      const active = document.activeElement;
      return active instanceof Element ? active.matches(targetSelector) : false;
    }, selector);
    if (matched) return;
  }
  throw new Error(`keyboard flow did not reach ${description}`);
}

async function captureAria(locator: any, page: any): Promise<unknown> {
  if (typeof locator.ariaSnapshot === "function") {
    return await locator.ariaSnapshot();
  }
  const handle = await locator.elementHandle();
  assertCondition(handle, "accessible root missing");
  const snapshot = await page.accessibility?.snapshot({ root: handle, interestingOnly: false });
  assertCondition(snapshot, "accessibility snapshot missing");
  return snapshot;
}

async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  assertCondition(!hasOverflow, `${label} overflowed horizontally`);
}

export async function run(): Promise<void> {
  const playwright = await importPlaywright();
  if (!playwright) {
    return;
  }

  const atlas = await startAtlasServer();
  const browser = await playwright.chromium.launch({ headless: true });
  const splitRows = parseCsv(fs.readFileSync(CONTRACT_SPLIT_PATH, "utf-8"));
  const stateRows = parseCsv(fs.readFileSync(STATE_TABLE_PATH, "utf-8"));

  try {
    const context = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
    const page = await context.newPage();
    await openAtlas(page, atlas.atlasUrl);

    const root = page.locator("[data-testid='BookingFlowContractAtlas']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Booking_Flow_Contract_Atlas",
      "atlas visual mode drifted",
    );

    const atlasData = await page.evaluate(() => {
      const script = document.querySelector("#atlas-data");
      if (!(script instanceof HTMLScriptElement) || !script.textContent) {
        throw new Error("atlas data script missing");
      }
      const decoder = document.createElement("textarea");
      decoder.innerHTML = script.textContent;
      return JSON.parse(decoder.value);
    });

    assertCondition(atlasData.contractSplitRows.length === splitRows.length, "contract split row count drifted");
    assertCondition(atlasData.stateTableRows.length === stateRows.length, "state table row count drifted");
    assertCondition(atlasData.stages.length >= 8, "stage count drifted");
    assertCondition(atlasData.formulas.length >= 8, "formula count drifted");

    await page.locator("#StageButton-commit_revalidation").click();
    assertCondition(
      (await root.getAttribute("data-active-stage")) === "commit_revalidation",
      "stage selection did not sync root state",
    );
    assertCondition(
      ((await page.locator("#inspector-stage-label").textContent()) || "").includes("Commit revalidation"),
      "commit stage label did not render",
    );

    await page.locator("#FormulaButton-Cancelable").click();
    assertCondition(
      (await root.getAttribute("data-active-stage")) === "manage_continuity",
      "formula selection did not sync owning stage",
    );
    assertCondition(
      (await root.getAttribute("data-active-formula")) === "Cancelable",
      "active formula attr drifted",
    );

    const scenarioCount = await page.locator("[data-testid='ScenarioParityTable'] tbody tr").count();
    assertCondition(scenarioCount >= 1, "scenario parity table must render at least one active-stage row");

    await page.screenshot({ path: outputPath("280-booking-flow-atlas-overview.png"), fullPage: true });

    await page.locator("#FormulaButton-RevalidationPass").click();
    await page.screenshot({ path: outputPath("280-booking-flow-atlas-commit.png"), fullPage: true });

    await tabUntilFocus(page, "#StageButton-search_snapshot", "search snapshot stage button");
    await page.keyboard.press("Enter");
    assertCondition(
      (await root.getAttribute("data-active-stage")) === "search_snapshot",
      "keyboard activation did not restore search stage",
    );
    await tabUntilFocus(page, "#FormulaButton-RouteWritable", "RouteWritable formula button");
    await page.keyboard.press("Enter");
    assertCondition(
      (await root.getAttribute("data-active-formula")) === "RouteWritable",
      "keyboard activation did not select RouteWritable",
    );

    const accessibility = await captureAria(root, page);
    fs.writeFileSync(
      outputPath("280-booking-flow-atlas-aria-snapshots.json"),
      JSON.stringify(accessibility, null, 2),
      "utf-8",
    );

    const reducedContext = await browser.newContext({
      viewport: { width: 430, height: 980 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, atlas.atlasUrl);
    await reducedPage.locator("#StageButton-waitlist_fallback").click();
    await assertNoHorizontalOverflow(reducedPage, "mobile reduced atlas");
    const reducedMotionDuration = await reducedPage.evaluate(() => {
      const button = document.querySelector("#StageButton-waitlist_fallback");
      return button ? window.getComputedStyle(button).transitionDuration : "";
    });
    assertCondition(
      reducedMotionDuration === "0s" || reducedMotionDuration === "0s, 0s",
      `reduced motion transition drifted: ${reducedMotionDuration}`,
    );
    await reducedPage.screenshot({ path: outputPath("280-booking-flow-atlas-mobile-reduced.png"), fullPage: true });
    await reducedContext.close();

    await context.close();
  } finally {
    await browser.close();
    await stopAtlasServer(atlas.server);
  }
}

if (import.meta.main) {
  run().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
