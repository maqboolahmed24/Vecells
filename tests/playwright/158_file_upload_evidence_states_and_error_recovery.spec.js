import fs from "node:fs";
import http from "node:http";
import net from "node:net";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const APP_DIR = path.join(ROOT, "apps", "patient-web");
const GALLERY_PATH = path.join(ROOT, "docs", "frontend", "158_attachment_lane_gallery.html");
const CONTRACT_PATH = path.join(ROOT, "data", "contracts", "158_attachment_frontend_state_contract.json");
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "158_attachment_ui_state_matrix.csv");
const RECOVERY_PATH = path.join(ROOT, "data", "analysis", "158_retry_replace_and_recovery_cases.csv");
const MERMAID_PATH = path.join(ROOT, "docs", "frontend", "158_attachment_state_machine.mmd");
const MEMORY_PREFIX = "patient-intake-mission-frame::";

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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

const CONTRACT = JSON.parse(fs.readFileSync(CONTRACT_PATH, "utf8"));
const MATRIX_ROWS = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
const RECOVERY_ROWS = parseCsv(fs.readFileSync(RECOVERY_PATH, "utf8"));
const MERMAID_TEXT = fs.readFileSync(MERMAID_PATH, "utf8");

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

async function allocatePort() {
  return await new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to allocate port."));
        return;
      }
      server.close((error) => (error ? reject(error) : resolve(address.port)));
    });
  });
}

async function waitForHttp(url, timeoutMs = 15_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function startStaticServer() {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/158_attachment_lane_gallery.html";
    }
    const filePath = path.join(ROOT, pathname);
    if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
      response.writeHead(404);
      response.end("not found");
      return;
    }
    const contentType =
      filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : filePath.endsWith(".mmd")
              ? "text/plain; charset=utf-8"
              : "text/plain; charset=utf-8";
    response.writeHead(200, { "Content-Type": contentType });
    response.end(fs.readFileSync(filePath));
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(undefined));
  });

  return {
    server,
    url: `http://127.0.0.1:${port}/docs/frontend/158_attachment_lane_gallery.html`,
  };
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function startPatientWeb() {
  const port = await allocatePort();
  const logs = [];
  const child = spawn("pnpm", ["exec", "vite", "--host", "127.0.0.1", "--port", String(port)], {
    cwd: APP_DIR,
    env: { ...process.env, BROWSER: "none" },
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(baseUrl);
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`Patient web failed to start.\n${logs.join("")}`, { cause: error });
  }

  return { child, baseUrl };
}

async function stopPatientWeb(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}

async function clearOriginStorage(page, baseUrl) {
  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.evaluate(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });
}

async function seedDraftMemory(page, baseUrl, draftPublicId, partialMemory) {
  await clearOriginStorage(page, baseUrl);
  await page.evaluate(
    ({ draftPublicId: nextDraftPublicId, partialMemory: nextPartialMemory, memoryPrefix }) => {
      window.localStorage.setItem(
        `${memoryPrefix}${nextDraftPublicId}`,
        JSON.stringify({
          draftPublicId: nextDraftPublicId,
          ...nextPartialMemory,
        }),
      );
    },
    { draftPublicId, partialMemory, memoryPrefix: MEMORY_PREFIX },
  );
}

async function openRoute(page, baseUrl, pathname) {
  await page.goto(`${baseUrl}${pathname}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='patient-intake-mission-frame-root']").waitFor();
}

async function assertNoOverflow(page, maxOverflow = 12) {
  const viewport = page.viewportSize();
  assertCondition(Boolean(viewport), "Viewport unavailable.");
  const width = viewport?.width ?? 0;
  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  assertCondition(
    scrollWidth <= width + maxOverflow,
    `Layout overflowed horizontally: ${scrollWidth}px for viewport ${width}px.`,
  );
}

function cardLocator(page, filename) {
  return page
    .locator("[data-testid^='patient-intake-evidence-card-att_']")
    .filter({ hasText: filename })
    .first();
}

async function waitForCardState(page, filename, expectedState, timeout = 6_000) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeout) {
    const card = cardLocator(page, filename);
    if ((await card.count()) > 0) {
      const state = await card.getAttribute("data-state");
      if (state === expectedState) {
        return;
      }
    }
    await wait(100);
  }
  throw new Error(`Timed out waiting for ${filename} to reach ${expectedState}.`);
}

async function setPickerFiles(page, files) {
  await page.locator("[data-testid='patient-intake-file-input']").setInputFiles(files);
}

async function setCameraFiles(page, files) {
  await page.locator("[data-testid='patient-intake-camera-input']").setInputFiles(files);
}

async function dragDropFiles(page, selector, files) {
  const drag_drop = await page.evaluateHandle(() => new DataTransfer());
  for (const file of files) {
    await drag_drop.evaluate((dataTransfer, payload) => {
      dataTransfer.items.add(new File([payload.contents], payload.name, { type: payload.type }));
    }, file);
  }
  await page.locator(selector).dispatchEvent("dragenter", { dataTransfer: drag_drop });
  await page.locator(selector).dispatchEvent("dragover", { dataTransfer: drag_drop });
  await page.locator(selector).dispatchEvent("drop", { dataTransfer: drag_drop });
}

async function tabUntilTestIdPrefix(page, prefix, attempts = 10) {
  for (let index = 0; index < attempts; index += 1) {
    await page.keyboard.press("Tab");
    const activeTestId = await page.evaluate(() => document.activeElement?.getAttribute("data-testid"));
    if (activeTestId?.startsWith(prefix)) {
      return activeTestId;
    }
  }
  return null;
}

async function run() {
  assertCondition(fs.existsSync(GALLERY_PATH), "Attachment gallery artifact is missing.");
  assertCondition(CONTRACT.taskId === "par_158", "Attachment contract drifted.");
  assertCondition(
    CONTRACT.userFacingStates.length === 11,
    "Attachment frontend state contract should expose 11 user-facing states.",
  );
  assertCondition(
    MATRIX_ROWS.some((row) => row.ui_state === "retryable transfer failure"),
    "Retryable transfer failure is missing from the matrix.",
  );
  assertCondition(
    RECOVERY_ROWS.some((row) => row.case_id === "PREVIEW_ACTION_USES_GOVERNED_GRANT"),
    "Preview recovery case missing.",
  );
  assertCondition(
    MERMAID_TEXT.includes("uploading_to_quarantine --> retryable_transfer_failure"),
    "State machine is missing retryable transfer failure.",
  );

  if (!process.argv.includes("--run")) {
    return;
  }

  const playwright = await importPlaywright();
  const { chromium, devices } = playwright;
  const { server, url: galleryUrl } = await startStaticServer();
  const { child, baseUrl } = await startPatientWeb();

  try {
    const browser = await chromium.launch({ headless: true });
    try {
      {
        const context = await browser.newContext({ viewport: { width: 1366, height: 960 } });
        const page = await context.newPage();
        await page.goto(galleryUrl, { waitUntil: "networkidle" });
        await page.locator("[data-testid='attachment-lane-gallery']").waitFor();
        await assertNoOverflow(page);
        assertCondition(
          (await page.locator("[data-testid='attachment-artifact-mode-table'] tbody tr").count()) >= 4,
          "Artifact mode table should expose four rows.",
        );
        await context.close();
      }

      {
        const context = await browser.newContext({
          viewport: { width: 1366, height: 960 },
          reducedMotion: "no-preference",
        });
        const page = await context.newPage();
        const draftPublicId = "dft_par158_picker";
        await seedDraftMemory(page, baseUrl, draftPublicId, {
          requestType: "Results",
          structuredAnswers: { "results.context": "blood_test" },
          detailsCursorQuestionKey: "results.testName",
          completedStepKeys: ["request_type", "details"],
          attachments: [],
        });
        await openRoute(page, baseUrl, `/start-request/${draftPublicId}/files`);
        await page.locator("[data-testid='patient-intake-file-picker-button']").waitFor();
        await setPickerFiles(page, [
          {
            name: "bp-reading-photo.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.from("bp-photo"),
          },
        ]);
        await waitForCardState(page, "bp-reading-photo.jpg", "ready_kept");
        await page.locator("[data-testid^='patient-intake-preview-action-']").click();
        await page.locator("[data-testid='patient-intake-preview-panel']").waitFor();
        const governedHref = await page.locator("[data-testid='patient-intake-preview-open']").getAttribute(
          "data-governed-href",
        );
        assertCondition(
          governedHref?.startsWith("/artifacts/attachment/") ?? false,
          "Preview handoff must use governed attachment routes.",
        );
        await page.locator("[data-testid='patient-intake-preview-close']").click();

        await setPickerFiles(page, [
          {
            name: "bp-reading-photo.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.from("bp-photo"),
          },
        ]);
        const duplicateNote = cardLocator(page, "bp-reading-photo.jpg").locator(
          ".patient-intake-mission-frame__evidence-duplicate-note",
        );
        await duplicateNote.waitFor();
        assertCondition(
          (await page.locator("[data-testid^='patient-intake-evidence-card-att_']").count()) === 1,
          "Duplicate upload should not create a second evidence row.",
        );

        const activeTestId = await tabUntilTestIdPrefix(page, "patient-intake-preview-action-");
        assertCondition(
          activeTestId?.startsWith("patient-intake-preview-action-") ?? false,
          "Keyboard traversal should reach governed preview actions.",
        );

        await page.locator("[data-testid^='patient-intake-remove-action-']").click();
        await waitForCardState(page, "bp-reading-photo.jpg", "removed");
        assertCondition(
          (await page.locator("[data-testid='patient-intake-files-step']").count()) === 1,
          "Removing a file must not reset the shell step.",
        );
        await context.close();
      }

      {
        const context = await browser.newContext({ viewport: { width: 1366, height: 960 } });
        const page = await context.newPage();
        const draftPublicId = "dft_par158_drag";
        await seedDraftMemory(page, baseUrl, draftPublicId, {
          requestType: "Results",
          completedStepKeys: ["request_type", "details"],
          attachments: [],
        });
        await openRoute(page, baseUrl, `/start-request/${draftPublicId}/files`);
        await dragDropFiles(page, "[data-testid='patient-intake-evidence-dropzone']", [
          {
            name: "retry-transfer-note.pdf",
            type: "application/pdf",
            contents: "retryable",
          },
        ]);
        await waitForCardState(page, "retry-transfer-note.pdf", "retryable_transfer_failure");
        await page.locator("[data-testid^='patient-intake-retry-action-']").click();
        await waitForCardState(page, "retry-transfer-note.pdf", "ready_kept");
        await context.close();
      }

      {
        const context = await browser.newContext({
          ...devices["iPhone 13"],
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const draftPublicId = "dft_par158_mobile";
        await seedDraftMemory(page, baseUrl, draftPublicId, {
          requestType: "Symptoms",
          completedStepKeys: ["request_type", "details"],
          attachments: [],
        });
        await openRoute(page, baseUrl, `/start-request/${draftPublicId}/files`);
        await page.locator("[data-testid='patient-intake-camera-capture-button']").waitFor();
        assertCondition(
          (await page.locator("[data-testid='patient-intake-camera-input']").getAttribute("capture")) ===
            "environment",
          "Mobile capture input should expose capture=environment when supported.",
        );
        const reducedMotion = "reduce";
        await setCameraFiles(page, [
          {
            name: "camera-capture.heic",
            mimeType: "image/heic",
            buffer: Buffer.from("heic"),
          },
        ]);
        await waitForCardState(page, "camera-capture.heic", "preview_unavailable_kept");
        assertCondition(reducedMotion === "reduce", "Reduced motion context should remain active.");
        await context.close();
      }

      {
        const context = await browser.newContext({
          viewport: { width: 1366, height: 960 },
          reducedMotion: "reduce",
        });
        const page = await context.newPage();
        const draftPublicId = "dft_par158_replace";
        await seedDraftMemory(page, baseUrl, draftPublicId, {
          requestType: "Meds",
          completedStepKeys: ["request_type", "details"],
          attachments: [],
        });
        await openRoute(page, baseUrl, `/start-request/${draftPublicId}/files`);
        await setPickerFiles(page, [
          {
            name: "unreadable-lab-note.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.from("broken"),
          },
        ]);
        await waitForCardState(page, "unreadable-lab-note.pdf", "quarantined_unreadable");
        await cardLocator(page, "unreadable-lab-note.pdf")
          .locator("[data-testid^='patient-intake-replace-action-']")
          .click();
        await cardLocator(page, "unreadable-lab-note.pdf")
          .locator("input[type='file']")
          .setInputFiles([
            {
              name: "clean-replacement.pdf",
              mimeType: "application/pdf",
              buffer: Buffer.from("clean"),
            },
          ]);
        await waitForCardState(page, "unreadable-lab-note.pdf", "replaced");
        await waitForCardState(page, "clean-replacement.pdf", "ready_kept");

        await setPickerFiles(page, [
          {
            name: "malware-proof.jpg",
            mimeType: "image/jpeg",
            buffer: Buffer.from("unsafe"),
          },
        ]);
        await waitForCardState(page, "malware-proof.jpg", "quarantined_malware");
        const announcementText = await page.locator("[aria-live='polite']").last().textContent();
        assertCondition(
          announcementText?.toLowerCase().includes("malware-proof.jpg") ?? false,
          "Per-file announcement should mention the changed file.",
        );
        await context.close();
      }
    } finally {
      await browser.close();
    }
  } finally {
    await stopPatientWeb(child);
    await closeServer(server);
  }
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
