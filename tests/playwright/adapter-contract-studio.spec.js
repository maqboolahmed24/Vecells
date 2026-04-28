import http from "node:http";
import path from "node:path";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

async function createServer() {
  return await new Promise((resolve, reject) => {
    const server = http.createServer(async (request, response) => {
      try {
        const pathname =
          request.url === "/" ? "/docs/architecture/57_adapter_contract_studio.html" : request.url;
        const filePath = path.join(ROOT, pathname);
        const payload = await readFile(filePath);
        const contentType = pathname.endsWith(".html")
          ? "text/html; charset=utf-8"
          : "text/plain; charset=utf-8";
        response.writeHead(200, { "content-type": contentType });
        response.end(payload);
      } catch (error) {
        response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
        response.end(String(error));
      }
    });
    server.listen(0, "127.0.0.1", () => resolve(server));
    server.once("error", reject);
  });
}

async function run() {
  const server = await createServer();
  const address = server.address();
  const url = `http://127.0.0.1:${address.port}/docs/architecture/57_adapter_contract_studio.html`;
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });
    await page.goto(url, { waitUntil: "networkidle" });

    const adapterCount = await page.locator("[data-testid='metric-adapter-count']").textContent();
    assertCondition(adapterCount === "20", "Expected 20 adapter profiles in the masthead.");

    await page.selectOption("[data-testid='dependency-filter']", "dep_pharmacy_referral_transport");
    const pharmacyCards = await page.locator("[data-testid^='profile-card-']").count();
    assertCondition(
      pharmacyCards === 1,
      `Expected one pharmacy transport card, found ${pharmacyCards}.`,
    );

    await page.selectOption("[data-testid='dependency-filter']", "all");
    await page.selectOption("[data-testid='posture-filter']", "watch_only");
    const watchCards = await page.locator("[data-testid^='profile-card-']").count();
    assertCondition(watchCards === 2, `Expected two watch-only cards, found ${watchCards}.`);

    await page.selectOption("[data-testid='posture-filter']", "all");
    await page.locator("#compare-actual-later").click();
    const compareMode = await page.locator("#comparison-table").getAttribute("data-compare-mode");
    assertCondition(
      compareMode === "actual-later",
      "Simulator/live toggle failed to switch to actual-later mode.",
    );

    await page.locator("[data-testid='effect-row-fxf_mesh_secure_message_dispatch']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("adp_mesh_secure_message") &&
        inspectorText.includes("dep_cross_org_secure_messaging_mesh"),
      "Inspector failed to synchronize with the effect-family matrix selection.",
    );
    const linkedEffect = await page
      .locator("[data-testid='effect-row-fxf_mesh_secure_message_dispatch']")
      .getAttribute("data-linked");
    assertCondition(linkedEffect === "true", "Selected effect-family row did not stay linked.");

    const firstCard = page.locator("[data-testid^='profile-card-']").first();
    const firstProfileId = await firstCard.getAttribute("data-profile-id");
    await firstCard.focus();
    await firstCard.press("ArrowDown");
    const selectedCard = page
      .locator("[data-testid^='profile-card-'][data-selected='true']")
      .first();
    const secondProfileId = await selectedCard.getAttribute("data-profile-id");
    assertCondition(
      firstProfileId !== secondProfileId,
      "ArrowDown did not move selection to the next profile card.",
    );

    await page.setViewportSize({ width: 390, height: 844 });
    const inspectorVisible = await page.locator("[data-testid='inspector']").isVisible();
    assertCondition(inspectorVisible, "Inspector disappeared on mobile width.");

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
    assertCondition(landmarks >= 7, `Expected multiple landmarks, found ${landmarks}.`);
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

export const adapterContractStudioManifest = {
  adapterProfiles: 20,
  degradationProfiles: 20,
  coverage: [
    "dependency filtering",
    "simulator/live comparison toggle",
    "matrix and inspector synchronization",
    "keyboard navigation",
    "responsive layout",
    "reduced motion",
  ],
};
