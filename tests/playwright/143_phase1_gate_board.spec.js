import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "143_phase1_gate_board.html");
const GATE_JSON_PATH = path.join(ROOT, "data", "analysis", "143_phase1_parallel_gate.json");
const SEAMS_JSON_PATH = path.join(ROOT, "data", "analysis", "143_phase1_shared_interface_seams.json");
const TRACK_MATRIX_PATH = path.join(ROOT, "data", "analysis", "143_phase1_parallel_track_matrix.csv");

export const phase1GateBoardCoverage = [
  "filter behavior",
  "task selection synchronization",
  "keyboard navigation and landmarks",
  "responsive layout",
  "reduced-motion equivalence",
  "diagram/table parity",
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
    const values = line.split(",");
    return Object.fromEntries(headers.map((header, index) => [header, values[index] || ""]));
  });
}

function extractEmbeddedJson(html, scriptId) {
  const match = html.match(
    new RegExp(`<script id="${scriptId}" type="application/json">([\\s\\S]*?)<\\/script>`),
  );
  assertCondition(match, `Missing embedded JSON script: ${scriptId}`);
  return JSON.parse(match[1]);
}

function getExpected() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_143 gate board HTML is missing.");
  assertCondition(fs.existsSync(GATE_JSON_PATH), "seq_143 gate JSON is missing.");
  assertCondition(fs.existsSync(SEAMS_JSON_PATH), "seq_143 seam JSON is missing.");
  assertCondition(fs.existsSync(TRACK_MATRIX_PATH), "seq_143 track matrix CSV is missing.");

  const html = fs.readFileSync(HTML_PATH, "utf8");
  const gate = JSON.parse(fs.readFileSync(GATE_JSON_PATH, "utf8"));
  const seams = JSON.parse(fs.readFileSync(SEAMS_JSON_PATH, "utf8"));
  const matrixRows = parseCsv(fs.readFileSync(TRACK_MATRIX_PATH, "utf8"));

  const embeddedGate = extractEmbeddedJson(html, "gate-json");
  const embeddedSeams = extractEmbeddedJson(html, "seams-json");

  const backendFoundationTracks = gate.tracks.filter((track) => track.trackFamily === "backend_foundation");
  const patientShellGate = gate.mergeGates.find(
    (mergeGate) => mergeGate.mergeGateId === "MG_143_PATIENT_SHELL_INTEGRATION",
  );
  const par150 = gate.tracks.find((track) => track.taskId === "par_150");
  const par149 = gate.tracks.find((track) => track.taskId === "par_149");
  const par156 = gate.tracks.find((track) => track.taskId === "par_156");
  const visibleEdgeCountBackendFoundation = gate.dependencyEdges.filter(
    (edge) =>
      backendFoundationTracks.some((track) => track.taskId === edge.fromTaskId) &&
      backendFoundationTracks.some((track) => track.taskId === edge.toTaskId),
  ).length;

  assertCondition(patientShellGate, "Missing patient-shell merge gate.");
  assertCondition(par150, "Missing par_150 track.");
  assertCondition(par149, "Missing par_149 track.");
  assertCondition(par156, "Missing par_156 track.");

  return {
    html,
    gate,
    seams,
    matrixRows,
    embeddedGate,
    embeddedSeams,
    backendFoundationTracks,
    patientShellGate,
    par150,
    par149,
    par156,
    visibleEdgeCountBackendFoundation,
  };
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
      pathname = "/docs/frontend/143_phase1_gate_board.html";
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
        reject(new Error("Unable to bind local seq_143 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/143_phase1_gate_board.html`,
      });
    });
  });
}

export async function run() {
  const expected = getExpected();

  assertCondition(
    JSON.stringify(expected.gate) === JSON.stringify(expected.embeddedGate),
    "Board embedded gate JSON drifted from the machine-readable payload.",
  );
  assertCondition(
    JSON.stringify(expected.seams) === JSON.stringify(expected.embeddedSeams),
    "Board embedded seam JSON drifted from the machine-readable payload.",
  );

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1520, height: 1180 } });
    await page.goto(url, { waitUntil: "networkidle" });

    for (const testId of [
      "phase1-parallel-gate-board",
      "board-masthead",
      "track-family-filter",
      "gate-filter",
      "state-filter",
      "dependency-lattice",
      "merge-gate-strip",
      "inspector",
      "track-matrix-table",
      "shared-seam-table",
      "dependency-edge-table",
      "merge-gate-table",
    ]) {
      await page.locator(`[data-testid='${testId}']`).waitFor();
    }

    assertCondition(
      (await page.locator("[data-testid='gate-verdict']").innerText()).trim() ===
        expected.gate.gateVerdict,
      "Gate verdict drifted.",
    );
    assertCondition(
      Number((await page.locator("[data-testid='open-track-count']").innerText()).trim()) ===
        expected.gate.openTrackCount,
      "Open-track count drifted.",
    );
    assertCondition(
      Number((await page.locator("[data-testid='blocked-track-count']").innerText()).trim()) ===
        expected.gate.blockedTrackCount,
      "Blocked-track count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='contract-bundle-hash']").innerText()).trim() ===
        expected.gate.contractBundleHash,
      "Contract bundle hash drifted.",
    );

    assertCondition(
      (await page.locator("[data-testid='dependency-lattice'] .task-card").count()) ===
        expected.gate.openTrackCount,
      "Dependency lattice should render every open track by default.",
    );
    assertCondition(
      (await page.locator("[data-testid='track-matrix-table'] tbody tr").count()) ===
        expected.matrixRows.length,
      "Track matrix row count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='merge-gate-strip'] .gate-card").count()) ===
        expected.gate.mergeGates.length,
      "Merge-gate strip count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='merge-gate-table'] tbody tr").count()) ===
        expected.gate.mergeGates.length,
      "Merge-gate table parity drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='dependency-edge-visual'] line").count()) ===
        expected.gate.dependencyEdges.length,
      "Visual dependency edge count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='dependency-edge-table'] tbody tr").count()) ===
        expected.gate.dependencyEdges.length,
      "Dependency edge table parity drifted.",
    );

    await page.locator("[data-testid='track-family-filter']").selectOption("backend_foundation");
    await page.waitForFunction(
      (expectedCount) =>
        document.querySelectorAll("[data-testid='dependency-edge-visual'] line").length === expectedCount,
      expected.visibleEdgeCountBackendFoundation,
    );
    assertCondition(
      (await page.locator("[data-testid='dependency-lattice'] .task-card").count()) ===
        expected.backendFoundationTracks.length,
      "Family filtering no longer narrows the lattice to backend_foundation rows.",
    );
    assertCondition(
      (await page.locator("[data-testid='track-matrix-table'] tbody tr").count()) ===
        expected.backendFoundationTracks.length,
      "Track matrix lost parity after family filtering.",
    );
    assertCondition(
      (await page.locator("[data-testid='dependency-edge-visual'] line").count()) ===
        expected.visibleEdgeCountBackendFoundation,
      "Filtered visual edge count drifted for backend_foundation.",
    );
    assertCondition(
      (await page.locator("[data-testid='dependency-edge-table'] tbody tr").count()) ===
        expected.visibleEdgeCountBackendFoundation,
      "Filtered dependency edge table parity drifted for backend_foundation.",
    );

    await page.locator("[data-testid='gate-filter']").selectOption("MG_143_PATIENT_SHELL_INTEGRATION");
    const expectedGateFilteredCount = expected.backendFoundationTracks.filter((track) =>
      track.blockingMergeDependencies.includes("MG_143_PATIENT_SHELL_INTEGRATION"),
    ).length;
    assertCondition(
      (await page.locator("[data-testid='dependency-lattice'] .task-card").count()) ===
        expectedGateFilteredCount,
      "Gate filtering no longer respects merge-gate membership.",
    );

    await page.locator("[data-testid='track-family-filter']").selectOption("all");
    await page.locator("[data-testid='gate-filter']").selectOption("all");

    await page.locator("[data-testid='state-filter']").selectOption("blocked");
    await page.locator("[data-testid='empty-state']").waitFor();
    assertCondition(
      (await page.locator("[data-testid='dependency-lattice'] .task-card").count()) === 0,
      "Blocked-state filter should hide all task cards for seq_143.",
    );
    assertCondition(
      (await page.locator("[data-testid='track-matrix-table'] tbody tr").count()) === 0,
      "Blocked-state filter should empty the matrix table.",
    );

    await page.locator("[data-testid='state-filter']").selectOption("all");
    await page.locator("[data-testid='track-row-par_150'] .row-button").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("par_150 Rule-based synchronous safety engine") &&
        inspectorText.includes("SafetyDecisionRecord") &&
        inspectorText.includes("MG_143_PATIENT_SHELL_INTEGRATION"),
      "Task selection synchronization no longer updates the inspector for par_150.",
    );
    assertCondition(
      (await page.locator("[data-testid='task-card-par_150']").getAttribute("data-selected")) ===
        "true",
      "Lattice selection did not stay synchronized after table selection.",
    );
    assertCondition(
      (await page.locator("[data-testid='merge-gate-card-MG_143_PATIENT_SHELL_INTEGRATION']").getAttribute("data-highlighted")) ===
        "true",
      "Merge-gate highlight drifted after selecting par_150.",
    );
    const par150SeamRefs = [
      ...expected.par150.ownedInterfaceSeamRefs,
      ...expected.par150.consumedInterfaceSeamRefs,
    ];
    assertCondition(
      (await page.locator("[data-testid='shared-seam-table'] tbody tr").count()) ===
        par150SeamRefs.length,
      "Shared seam table no longer tracks the selected task seams.",
    );

    await page.locator("[data-testid='task-card-par_149']").focus();
    await page.keyboard.press("ArrowRight");
    assertCondition(
      (await page.locator("[data-testid='task-card-par_156']").getAttribute("data-selected")) ===
        "true",
      "Arrow-key traversal no longer advances selection across task buttons.",
    );
    const inspectorAfterKeyboard = await page
      .locator("[data-testid='inspector']")
      .innerText();
    assertCondition(
      inspectorAfterKeyboard.includes("par_156 Request-type selection and progressive question flow"),
      "Keyboard navigation did not synchronize the inspector.",
    );

    assertCondition(
      (await page.locator("header[data-testid='board-masthead']").count()) === 1,
      "Header landmark is missing.",
    );
    assertCondition(
      (await page.locator("nav[data-testid='filter-rail']").count()) === 1,
      "Filter rail landmark is missing.",
    );
    assertCondition(
      (await page.locator("main[data-testid='board-canvas']").count()) === 1,
      "Main canvas landmark is missing.",
    );
    assertCondition(
      (await page.locator("aside[data-testid='inspector']").count()) === 1,
      "Inspector landmark is missing.",
    );

    await page.setViewportSize({ width: 900, height: 1120 });
    assertCondition(
      await page.locator("[data-testid='filter-rail']").isVisible(),
      "Filter rail disappeared on narrow layout.",
    );
    assertCondition(
      await page.locator("[data-testid='inspector']").isVisible(),
      "Inspector disappeared on narrow layout.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 920);
    assertCondition(widthSafe, "Responsive layout overflowed horizontally.");

    const motionPage = await browser.newPage({ viewport: { width: 1320, height: 960 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      assertCondition(
        (await motionPage.locator("body").getAttribute("data-reduced-motion")) === "true",
        "Reduced-motion posture did not activate.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid='dependency-lattice'] .task-card").count()) ===
          expected.gate.openTrackCount,
        "Reduced-motion rendering changed lattice parity.",
      );
      assertCondition(
        (await motionPage.locator("[data-testid='merge-gate-table'] tbody tr").count()) ===
          expected.gate.mergeGates.length,
        "Reduced-motion rendering changed merge-gate parity.",
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
