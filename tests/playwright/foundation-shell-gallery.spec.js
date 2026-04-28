import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "42_foundation_shell_gallery.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "monorepo_scaffold_manifest.json");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const SHELLS = MANIFEST.shell_gallery.shells;

export const foundationShellGalleryCoverage = [
  "gallery load and shell rail rendering",
  "shell-card selection and preview updates",
  "unique root landmarks per shell preview",
  "keyboard navigation between shell cards",
  "responsive mobile layout retention",
  "reduced-motion handling",
  "table parity rows and accessibility smoke",
  "offline local-only asset posture",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const requestUrl = req.url ?? "/";
      const urlPath =
        requestUrl === "/"
          ? "/docs/architecture/42_foundation_shell_gallery.html"
          : requestUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      const body = fs.readFileSync(filePath);
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : "text/plain; charset=utf-8";
      res.writeHead(200, { "Content-Type": contentType });
      res.end(body);
    });
    server.once("error", reject);
    server.listen(4342, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing foundation gallery HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const url =
    process.env.FOUNDATION_SHELL_GALLERY_URL ??
    "http://127.0.0.1:4342/docs/architecture/42_foundation_shell_gallery.html";
  const baseOrigin = new URL(url).origin;
  const externalRequests = new Set();

  page.on("request", (request) => {
    const requestUrl = request.url();
    if (
      !requestUrl.startsWith(baseOrigin) &&
      !requestUrl.startsWith("data:") &&
      !requestUrl.startsWith("about:")
    ) {
      externalRequests.add(requestUrl);
    }
  });

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='gallery-shell']").waitFor();
    await page.locator("[data-testid='shell-rail']").waitFor();
    await page.locator("[data-testid='shell-preview']").waitFor();

    const shellCards = page.locator("[data-testid^='shell-card-']");
    const cardCount = await shellCards.count();
    assertCondition(
      cardCount === SHELLS.length,
      `Expected ${SHELLS.length} shell cards, found ${cardCount}`,
    );

    for (const shell of SHELLS) {
      await page.locator(`[data-testid='shell-card-${shell.slug}']`).click();
      await page.locator(`[data-testid='${shell.slug}-shell-root']`).waitFor();
      const ownershipText = await page.locator("[data-testid='ownership-strip']").innerText();
      assertCondition(
        ownershipText.includes(shell.contract.artifactId),
        `Ownership strip lost artifact id for ${shell.slug}`,
      );
      const previewText = await page
        .locator(`[data-testid='${shell.slug}-shell-root']`)
        .innerText();
      assertCondition(
        previewText.includes(shell.displayName),
        `Preview lost display name for ${shell.slug}`,
      );
      assertCondition(
        previewText.includes(shell.visualTitle),
        `Preview lost visual title for ${shell.slug}`,
      );
    }

    const firstCard = page.locator(`[data-testid='shell-card-${SHELLS[0].slug}']`);
    const secondCard = page.locator(`[data-testid='shell-card-${SHELLS[1].slug}']`);
    await firstCard.focus();
    await page.keyboard.press("ArrowDown");
    const selectedSecond = await secondCard.getAttribute("data-selected");
    assertCondition(
      selectedSecond === "true",
      "Arrow-down navigation did not move selection to the next shell card.",
    );

    await secondCard.click();
    const parityRows = await page.locator("[data-testid='parity-table'] tbody tr").count();
    assertCondition(
      parityRows === SHELLS[1].parityRows.length + 2,
      `Parity table drifted for ${SHELLS[1].slug}: expected ${SHELLS[1].parityRows.length + 2}, found ${parityRows}`,
    );

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator(`[data-testid='${SHELLS[1].slug}-shell-root']`).waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedFlag = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedFlag === "true", "Reduced-motion flag did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarkCount = await page.locator("main, section, aside, header").count();
    assertCondition(
      landmarkCount >= 8,
      `Accessibility smoke failed: expected multiple landmarks, found ${landmarkCount}.`,
    );
    assertCondition(
      externalRequests.size === 0,
      `Gallery should be offline-complete, found external requests: ${[...externalRequests].join(", ")}`,
    );
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

export const foundationShellGalleryManifest = {
  task: MANIFEST.task_id,
  workspaceCount: MANIFEST.summary.workspace_enabled_count,
  shellCount: MANIFEST.summary.shell_gallery_count,
};
