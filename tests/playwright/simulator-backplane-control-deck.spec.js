import {
  CONTROL_DECK_URL_PATH,
  closeServer,
  importPlaywright,
  startSimulatorService,
  startStaticServer,
  stopSimulatorService,
} from "./simulator-backplane-test-helpers.js";

export const simulatorBackplaneControlDeckCoverage = [
  "stack startup and reset",
  "selected-family failure-mode application",
  "scenario reseed",
  "topology and inspector sync",
  "keyboard row navigation",
  "reduced motion",
  "responsive layout",
  "accessibility smoke checks",
];

async function run() {
  const { chromium } = await importPlaywright();
  const service = await startSimulatorService(7104);
  const staticServer = await startStaticServer(4383);
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1180 } });
  const url = `http://127.0.0.1:4383${CONTROL_DECK_URL_PATH}?apiBaseUrl=${encodeURIComponent(service.baseUrl)}`;

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='control-deck-shell']").waitFor();
    await page.locator("[data-testid='topology-diagram']").waitFor();
    await page.locator("[data-testid='seed-strip']").waitFor();
    const timeline = page.locator("[data-testid='event-timeline']");
    await timeline.waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    await page.locator("[data-testid='family-filter']").selectOption("telephony");
    await page.locator("[data-testid='seed-card-seed_phone_continuation']").waitFor();
    await page.locator("[data-testid='failure-filter']").selectOption("drift");
    await page.locator("[data-testid='seed-card-seed_phone_continuation']").waitFor();
    await page.locator("[data-testid='seed-card-seed_phone_continuation']").click();
    await page
      .locator("[data-testid='seed-card-seed_phone_continuation'][data-selected='true']")
      .waitFor();
    await page
      .locator("[data-testid='inspector']")
      .getByText("Telephony / IVR / transcript")
      .waitFor();
    await page.locator("[data-testid='apply-failure-mode-button']").click();
    await page.locator("[data-testid='simulator-row-telephony']").waitFor();
    await page.locator("[data-testid='reseed-button']").click();
    await page.locator("[data-testid='seed-card-seed_phone_continuation']").waitFor();
    await page.locator("[data-testid='seed-card-seed_phone_continuation']").click();
    await page
      .locator("[data-testid='inspector']")
      .getByText("Telephony / IVR / transcript")
      .waitFor();
    await timeline.getByText("Webhook recovered").first().waitFor();

    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    if (
      !inspectorText.includes("Telephony / IVR / transcript") ||
      !inspectorText.includes("seed_phone_continuation")
    ) {
      throw new Error("Inspector lost telephony selection sync.");
    }

    await page.locator("[data-testid='failure-filter']").selectOption("all");
    await page.locator("[data-testid='simulator-row-telephony']").waitFor();
    await page.locator("[data-testid='family-filter']").selectOption("all");
    await page.locator("[data-testid='simulator-row-nhs_login']").waitFor();
    await page.locator("[data-testid='simulator-row-nhs_login']").focus();
    await page.keyboard.press("ArrowDown");
    const selected = await page
      .locator("[data-testid='simulator-row-im1_gp']")
      .getAttribute("data-selected");
    if (selected !== "true") {
      throw new Error("Arrow navigation no longer advances simulator row selection.");
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("[data-testid='scenario-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1320, height: 980 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reduced = await motionPage.locator("body").getAttribute("data-reduced-motion");
      if (reduced !== "true") {
        throw new Error("Reduced-motion posture did not activate.");
      }
    } finally {
      await motionPage.close();
    }

    const landmarks = await page.locator("header, main, aside, section, article").count();
    if (landmarks < 10) {
      throw new Error(`Expected multiple accessibility landmarks, found ${landmarks}.`);
    }
  } finally {
    await browser.close();
    await closeServer(staticServer);
    await stopSimulatorService(service.child);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
