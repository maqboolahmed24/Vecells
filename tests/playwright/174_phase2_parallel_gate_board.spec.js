import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "programme", "174_phase2_parallel_gate_board.html");
const GATE_PATH = path.join(ROOT, "data", "analysis", "174_phase2_parallel_gate.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "174_phase2_track_matrix.csv");
const SEAMS_PATH = path.join(ROOT, "data", "analysis", "174_phase2_shared_interface_seams.json");
const MOCK_LIVE_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "174_phase2_mock_now_vs_live_provider_matrix.csv",
);

export const phase2ParallelGateCoverage = [
  "filter behavior",
  "task selection synchronization",
  "keyboard navigation and landmarks",
  "responsive layout",
  "reduced-motion equivalence",
  "diagram/table parity",
  "Phase2_DualTrack_Gate_Board",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
  const headers = parseCsvLine(headerLine);
  return lines.filter(Boolean).map((line) => {
    const values = parseCsvLine(line);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function parseCsvLine(line) {
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
  return values;
}

function getExpected() {
  for (const filePath of [HTML_PATH, GATE_PATH, MATRIX_PATH, SEAMS_PATH, MOCK_LIVE_PATH]) {
    assertCondition(fs.existsSync(filePath), `Missing seq174 artifact: ${filePath}`);
  }
  const gate = JSON.parse(fs.readFileSync(GATE_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const seams = JSON.parse(fs.readFileSync(SEAMS_PATH, "utf8")).seams;
  const providers = parseCsv(fs.readFileSync(MOCK_LIVE_PATH, "utf8"));
  assertCondition(gate.visualMode === "Phase2_DualTrack_Gate_Board", "Gate mode drifted.");
  assertCondition(matrix.length === 20, "Expected twenty Phase 2 parallel tracks.");
  assertCondition(seams.length >= 12, "Expected a broad seam registry.");
  assertCondition(providers.length === 6, "Expected six mock/live provider families.");
  return { gate, matrix, seams, providers };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/programme/174_phase2_parallel_gate_board.html";
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
        reject(new Error("Unable to bind local seq174 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/programme/174_phase2_parallel_gate_board.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function openBoard(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Phase2_DualTrack_Gate_Board']").waitFor();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertBoardShell(page, expected) {
  for (const testId of [
    "Phase2_DualTrack_Gate_Board",
    "board-masthead",
    "dual_track_gate_mark",
    "track-filter",
    "merge-gate-filter",
    "state-filter",
    "dual-lane-dependency-lattice",
    "shared-seam-ribbon",
    "merge-gate-strip",
    "track-matrix-table",
    "shared-interface-seams-table",
    "mock-live-provider-table",
    "parity-table",
    "inspector",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor({ state: "attached" });
  }
  assertCondition(
    (await page.locator("[data-testid='gate-verdict']").innerText()).includes(
      "parallel_block_open",
    ),
    "Gate verdict did not render.",
  );
  assertCondition(
    Number(await page.locator("[data-testid='open-track-count']").innerText()) ===
      expected.gate.openTrackCount,
    "Open track count drifted.",
  );
  assertCondition(
    Number(await page.locator("[data-testid='blocked-track-count']").innerText()) ===
      expected.gate.blockedTrackCount,
    "Blocked track count drifted.",
  );
}

async function assertFilterBehavior(page, expected) {
  await page.locator("[data-testid='track-filter']").selectOption("telephony");
  assertCondition(
    (await page.locator("[data-testid='track-matrix-table'] tbody tr").count()) ===
      expected.matrix.filter((row) => row.track_family === "telephony").length,
    "Track filter did not narrow table rows.",
  );

  await page.locator("[data-testid='track-filter']").selectOption("all");
  await page
    .locator("[data-testid='merge-gate-filter']")
    .selectOption("MG_174_REQUEST_CONVERGENCE");
  assertCondition(
    (await page.locator("[data-testid='track-matrix-table'] tbody tr").count()) ===
      expected.matrix.filter((row) =>
        row.blocking_merge_dependencies.includes("MG_174_REQUEST_CONVERGENCE"),
      ).length,
    "Merge-gate filter did not narrow table rows.",
  );

  await page.locator("[data-testid='merge-gate-filter']").selectOption("all");
  await page.locator("[data-testid='state-filter']").selectOption("blocked");
  assertCondition(
    (await page.locator("[data-testid='track-matrix-table']").innerText()).includes(
      "No matrix rows",
    ),
    "Blocked filter should expose the zero-blocked state.",
  );

  await page.locator("[data-testid='state-filter']").selectOption("open");
}

async function assertTaskSelectionSynchronization(page) {
  await page.locator("[data-testid='state-filter']").selectOption("open");
  await page.locator("[data-testid='task-row-par_187']").click();
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(inspectorText.includes("par_187"), "Table row selection did not sync inspector.");
  assertCondition(
    inspectorText.includes("provider webhook"),
    "Inspector did not expose selected task capability.",
  );
  assertCondition(
    (await page
      .locator("[data-testid='seam-chip-SEAM_174_TELEPHONY_NORMALIZED_EVENT_ENVELOPE']")
      .getAttribute("data-active")) === "true",
    "Seam ribbon did not highlight selected telephony seam.",
  );

  await page.locator("[data-testid='task-node-par_175']").click();
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(inspectorText.includes("par_175"), "Lattice selection did not sync inspector.");
  assertCondition(
    (await page
      .locator("[data-testid='merge-gate-chip-MG_174_SHARED_CONTRACT']")
      .getAttribute("data-active")) === "true",
    "Merge gate strip did not highlight selected task gate.",
  );
}

async function assertKeyboardAndLandmarks(page) {
  assertCondition((await page.locator("header[role='banner']").count()) === 1, "Missing banner.");
  assertCondition((await page.locator("main[role='main']").count()) === 1, "Missing main.");
  assertCondition(
    (await page.locator("[role='complementary'][data-testid='inspector']").count()) === 1,
    "Missing inspector complementary landmark.",
  );
  await page.locator("[data-testid='task-node-par_175']").focus();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Enter");
  assertCondition(
    (await page.locator("[data-testid='inspector-task-id']").innerText()).includes("par_176"),
    "Keyboard traversal did not move and select the next lattice task.",
  );
}

async function assertResponsiveLayout(browser, url) {
  const context = await browser.newContext({ viewport: { width: 390, height: 900 } });
  const page = await context.newPage();
  await openBoard(page, url);
  await assertNoOverflow(page);
  const columns = await page
    .locator("[data-testid='Phase2_DualTrack_Gate_Board']")
    .evaluate((node) => getComputedStyle(node).paddingLeft);
  assertCondition(Boolean(columns), "Responsive layout did not compute.");
  await context.close();
}

async function assertReducedMotion(browser, url) {
  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  await openBoard(page, url);
  const transitionDuration = await page
    .locator("[data-testid='task-node-par_175']")
    .evaluate((node) => getComputedStyle(node).transitionDuration);
  assertCondition(
    transitionDuration.includes("0.01ms") || transitionDuration.includes("1e-05s"),
    `Reduced-motion equivalence did not clamp transitions: ${transitionDuration}`,
  );
  assertCondition(
    Number(await page.locator("[data-testid='parity-lattice-count']").innerText()) === 20,
    "Reduced-motion rendering lost diagram/table parity.",
  );
  await context.close();
}

async function assertDiagramTableParity(page, expected) {
  await page.locator("[data-testid='track-filter']").selectOption("all");
  await page.locator("[data-testid='merge-gate-filter']").selectOption("all");
  await page.locator("[data-testid='state-filter']").selectOption("open");
  assertCondition(
    (await page.locator("[data-testid^='task-node-par_']").count()) === expected.matrix.length,
    "Lattice node count drifted from matrix.",
  );
  assertCondition(
    (await page.locator("[data-testid='track-matrix-table'] tbody tr").count()) ===
      expected.matrix.length,
    "Track matrix table count drifted from matrix.",
  );
  assertCondition(
    Number(await page.locator("[data-testid='parity-seam-count']").innerText()) ===
      expected.seams.length,
    "Seam ribbon count drifted from registry.",
  );
  assertCondition(
    Number(await page.locator("[data-testid='parity-provider-count']").innerText()) ===
      expected.providers.length,
    "Mock/live provider parity count drifted.",
  );
}

async function runBrowserProof(expected) {
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
    await openBoard(page, url);
    await assertBoardShell(page, expected);
    await assertFilterBehavior(page, expected);
    await assertTaskSelectionSynchronization(page);
    await assertKeyboardAndLandmarks(page);
    await assertNoOverflow(page);
    await assertDiagramTableParity(page, expected);
    await page.close();
    await assertResponsiveLayout(browser, url);
    await assertReducedMotion(browser, url);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

async function main() {
  const expected = getExpected();
  if (process.argv.includes("--run")) {
    await runBrowserProof(expected);
  }
  console.log("Phase 2 parallel gate board checks passed.");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
