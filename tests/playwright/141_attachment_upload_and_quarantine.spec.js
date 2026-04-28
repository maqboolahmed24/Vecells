import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "141_attachment_evidence_lab.html");
const PROJECTION_MODES_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "141_attachment_projection_and_artifact_modes.json",
);
const CLASSIFICATION_MATRIX_PATH = path.join(
  ROOT,
  "data",
  "analysis",
  "141_attachment_classification_matrix.csv",
);

export const attachmentUploadCoverage = [
  "drag/drop and file-picker upload flows",
  "mobile capture affordance behavior",
  "retry/remove/replace interactions",
  "accessibility announcements for progress and failure",
  "responsive layout",
  "reduced-motion equivalence",
  "scan-state ladder and matrix parity",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
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
    return Object.fromEntries(headers.map((header, headerIndex) => [header, values[headerIndex] ?? ""]));
  });
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/141_attachment_evidence_lab.html";
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
      const contentType =
        extension === ".html"
          ? "text/html"
          : extension === ".json"
            ? "application/json"
            : extension === ".csv"
              ? "text/csv"
              : "text/plain";
      response.writeHead(200, { "Content-Type": contentType });
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
        url: `http://127.0.0.1:${address.port}/docs/frontend/141_attachment_evidence_lab.html`,
      });
    });
  });
}

function loadExpected() {
  const projectionModes = JSON.parse(fs.readFileSync(PROJECTION_MODES_PATH, "utf8"));
  const classificationRows = parseCsv(fs.readFileSync(CLASSIFICATION_MATRIX_PATH, "utf8"));
  return {
    ladderCount: projectionModes.scanStateLadder.length,
    modeCount: projectionModes.artifactModes.length,
    classificationCount: classificationRows.length,
  };
}

async function waitForOutcome(page, fileName, outcome) {
  await page.waitForFunction(
    ([expectedName, expectedOutcome]) => {
      const cards = [...document.querySelectorAll(".attachment-card")];
      return cards.some((card) => {
        const title = card.querySelector(".card-title strong")?.textContent ?? "";
        return (
          title.includes(expectedName) &&
          card.getAttribute("data-outcome") === expectedOutcome &&
          card.getAttribute("data-status-phase") === "settled"
        );
      });
    },
    [fileName, outcome],
  );
}

async function cardCount(page) {
  return await page.locator(".attachment-card").count();
}

async function cardLocatorByName(page, fileName) {
  return page.locator(".attachment-card").filter({
    has: page.locator(".card-title strong", { hasText: fileName }),
  });
}

async function dropFile(page, fileName, mimeType, content = [1, 2, 3, 4]) {
  const dataTransfer = await page.evaluateHandle(
    ({ browserFileName, browserMimeType, bytes }) => {
      const transfer = new DataTransfer();
      const file = new File([new Uint8Array(bytes)], browserFileName, { type: browserMimeType });
      transfer.items.add(file);
      return transfer;
    },
    { browserFileName: fileName, browserMimeType: mimeType, bytes: content },
  );
  await page.dispatchEvent("[data-testid='drop-zone']", "drop", { dataTransfer });
}

export async function run() {
  assertCondition(fs.existsSync(HTML_PATH), "seq_141 attachment evidence lab HTML is missing.");
  const expected = loadExpected();

  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      viewport: { width: 1480, height: 1220 },
    });
    const page = await context.newPage();
    await page.goto(url, { waitUntil: "networkidle" });

    await page.locator("[data-testid='attachment-evidence-lab']").waitFor();
    await page.locator("[data-testid='drop-zone']").waitFor();
    await page.locator("[data-testid='scan-state-ladder']").waitFor();

    assertCondition(
      (await page.locator("[data-testid^='scan-step-']").count()) === expected.ladderCount,
      "Scan-state ladder count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='scan-state-table'] tbody tr").count()) === expected.ladderCount,
      "Scan-state ladder table parity drifted.",
    );
    assertCondition(
      (await page.locator(".mode-tile").count()) === expected.modeCount,
      "Artifact mode visual count drifted.",
    );
    assertCondition(
      (await page.locator("[data-testid='artifact-mode-matrix'] tbody tr").count()) === expected.modeCount,
      "Artifact mode matrix count drifted.",
    );
    assertCondition(expected.classificationCount >= 8, "Classification matrix coverage is unexpectedly small.");

    const originalStepAnchor = (await page.locator("[data-testid='current-step-anchor']").innerText()).trim();
    assertCondition(originalStepAnchor === "Step 4 of 6 · Supporting files", "Current step anchor drifted.");

    await page.setInputFiles("[data-testid='file-picker-input']", {
      name: "scan-safe.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("safe-pdf"),
    });
    await waitForOutcome(page, "scan-safe.pdf", "accepted_safe");
    assertCondition((await cardCount(page)) === 1, "Safe file picker flow should create one card.");
    assertCondition(
      (await page.locator("[data-testid='upload-live-region']").innerText()).includes("accepted safely"),
      "Live region did not announce safe acceptance.",
    );
    assertCondition(
      (await page.locator("[data-testid='current-step-anchor']").innerText()).trim() === originalStepAnchor,
      "Safe file picker flow changed the current step anchor.",
    );

    await dropFile(page, "retry-transfer.jpg", "image/jpeg");
    await waitForOutcome(page, "retry-transfer.jpg", "retryable_transfer_failure");
    assertCondition((await cardCount(page)) === 2, "Drag/drop retry flow should create a second card.");
    const retryCard = await cardLocatorByName(page, "retry-transfer.jpg");
    assertCondition(
      await retryCard.locator("button", { hasText: "Retry" }).isVisible(),
      "Retry button is missing for retryable transfer failure.",
    );
    assertCondition(
      (await page.locator("[data-testid='current-step-anchor']").innerText()).trim() === originalStepAnchor,
      "Retryable transfer failure changed the current step anchor.",
    );
    await retryCard.locator("button", { hasText: "Retry" }).click();
    await waitForOutcome(page, "retry-transfer.jpg", "accepted_safe");
    assertCondition(
      (await page.locator("[data-testid='upload-live-region']").innerText()).includes("after retry"),
      "Live region did not announce retry settlement.",
    );

    const safeCard = await cardLocatorByName(page, "scan-safe.pdf");
    await safeCard.locator("button", { hasText: "Replace" }).click();
    await page.setInputFiles("[data-testid='replace-input']", {
      name: "scan-no-preview.heic",
      mimeType: "image/heic",
      buffer: Buffer.alloc(4096, 7),
    });
    await waitForOutcome(page, "scan-no-preview.heic", "preview_unavailable_but_file_kept");
    assertCondition(
      (await page.locator("[data-testid='attachment-card-grid']").locator("button", { hasText: "Download" }).count()) >=
        1,
      "Preview-unavailable card should expose governed download.",
    );
    assertCondition(
      (await page.locator("[data-testid='current-step-anchor']").innerText()).trim() === originalStepAnchor,
      "Replace flow changed the current step anchor.",
    );

    await retryCard.locator("button", { hasText: "Remove" }).click();
    assertCondition((await cardCount(page)) === 1, "Remove should delete the retry card only.");

    await page.setInputFiles("[data-testid='file-picker-input']", {
      name: "malware-sample.jpg",
      mimeType: "image/jpeg",
      buffer: Buffer.from("malware-fixture"),
    });
    await waitForOutcome(page, "malware-sample.jpg", "quarantined_malware");
    const malwareCard = await cardLocatorByName(page, "malware-sample.jpg");
    assertCondition(
      (await malwareCard.getAttribute("data-state-tone")) === "quarantine",
      "Malware card is not visually distinct as quarantined.",
    );
    assertCondition(
      (await malwareCard.locator("button", { hasText: "Replace" }).count()) === 1 &&
        (await malwareCard.locator("button", { hasText: "Open" }).count()) === 0,
      "Quarantined card should offer replace/remove only.",
    );
    assertCondition(
      (await page.locator("[data-testid='upload-live-region']").innerText()).includes("quarantined"),
      "Live region did not announce quarantine.",
    );

    await page.setInputFiles("[data-testid='file-picker-input']", {
      name: "scan-no-preview.heic",
      mimeType: "image/heic",
      buffer: Buffer.alloc(4096, 7),
    });
    assertCondition(
      (await page.locator("[data-testid='duplicate-notice']").innerText()).includes("Duplicate upload replayed"),
      "Duplicate upload notice did not appear.",
    );
    assertCondition((await cardCount(page)) === 2, "Duplicate upload should not create a new card.");

    await page.setViewportSize({ width: 390, height: 900 });
    await page.waitForFunction(() => document.body.dataset.layout === "stacked");
    assertCondition(
      await page.locator("[data-testid='camera-capture-trigger']").isVisible(),
      "Mobile capture affordance should be visible in stacked mobile layout.",
    );
    const widthSafe = await page.evaluate(() => document.documentElement.scrollWidth <= 406);
    assertCondition(widthSafe, "Responsive attachment lab overflowed horizontally on mobile.");

    await page.setInputFiles("[data-testid='camera-capture-input']", {
      name: "mobile-capture.heic",
      mimeType: "image/heic",
      buffer: Buffer.from("mobile-capture"),
    });
    await waitForOutcome(page, "mobile-capture.heic", "accepted_safe");
    assertCondition((await cardCount(page)) === 3, "Mobile capture flow should add a new card.");

    await context.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 1200, height: 960 },
      reducedMotion: "reduce",
    });
    const reducedPage = await reducedContext.newPage();
    await reducedPage.goto(url, { waitUntil: "networkidle" });
    assertCondition(
      (await reducedPage.evaluate(() => document.body.dataset.motion)) === "reduce",
      "Reduced-motion mode did not activate.",
    );
    await reducedPage.setInputFiles("[data-testid='file-picker-input']", {
      name: "reduced-safe.pdf",
      mimeType: "application/pdf",
      buffer: Buffer.from("reduced-safe"),
    });
    await waitForOutcome(reducedPage, "reduced-safe.pdf", "accepted_safe");
    assertCondition(
      (await reducedPage.locator("[data-testid='scan-state-table'] tbody tr").count()) === expected.ladderCount,
      "Reduced-motion mode changed ladder parity.",
    );

    await reducedContext.close();
  } finally {
    await browser.close();
    server.close();
  }
}

const shouldRun = process.argv.includes("--run");

if (shouldRun) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
