import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "mesh_execution_pack.json"), "utf8"),
);

export const meshMailroomCoverage = [
  "mailbox switching",
  "workflow validation",
  "message submission and delayed acknowledgement",
  "mailbox application pack gating",
  "keyboard navigation",
  "reduced motion",
  "responsive behavior",
];

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

async function run() {
  const { chromium } = await importPlaywright();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  const baseUrl = process.env.MOCK_MESH_MAILROOM_URL ?? "http://127.0.0.1:4179/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });

  await page.locator("[data-testid='mesh-shell']").waitFor();
  await page.locator("[data-testid='mailbox-button-MBX_VEC_SUPPORT']").click();
  await page.locator("text=Vecells support replay desk").waitFor();

  await page.locator("[data-testid='workflow-select']").selectOption("VEC_HUB_BOOKING_NOTICE");
  await page.locator("[data-testid='workflow-validation-banner']").waitFor();
  await page.locator("text=Workflow IDs are first-class registry objects").waitFor();

  await page.locator("[data-testid='mailbox-button-MBX_VEC_HUB']").click();
  await page.locator("[data-testid='workflow-select']").selectOption("VEC_HUB_BOOKING_NOTICE");
  await page.locator("[data-testid='scenario-select']").selectOption("delayed_ack");
  await page.locator("[data-testid='send-message-button']").click();

  await page.locator("[data-testid^='message-card-MSG-LIVE-']").first().waitFor();
  await page.locator("[data-testid='advance-lifecycle-button']").click();
  await page.locator("text=Proof still pending").waitFor();

  await page.locator("[data-testid='page-tab-Mailbox_Application_Pack']").click();
  await page.locator("[data-testid='actual-field-named-approver']").fill("dry-run approver");
  await page.locator("[data-testid='actual-field-environment-target']").fill("path_to_live_integration");
  await page.locator("[data-testid='actual-field-owner-ods']").fill("VEC01");
  await page.locator("[data-testid='actual-field-manager-mode']").selectOption("self_managed");
  await page.locator("[data-testid='actual-field-workflow-contact']").fill("Named MESH team contact");
  await page.locator("[data-testid='actual-field-allow-mutation']").selectOption("false");
  await page.locator("[data-testid='actual-field-allow-spend']").selectOption("false");
  const disabled = await page.locator("[data-testid='actual-submit-button']").isDisabled();
  if (!disabled) {
    throw new Error("Real mailbox submit should stay disabled in the blocked posture.");
  }

  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.locator("[data-testid='reduced-motion-indicator']").waitFor();

  await page.setViewportSize({ width: 1024, height: 1100 });
  await page.locator("[data-testid='proof-inspector']").waitFor();
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.locator("[data-testid='lineage-strip']").waitFor();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("[data-testid='mailbox-rail']").waitFor();

  const headings = await page.locator("h1, h2, h3").count();
  if (headings < 10) {
    throw new Error("Accessibility smoke failed: expected multiple headings in the mailroom.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const meshMailroomManifest = {
  task: PACK.task_id,
  visualMode: PACK.visual_mode,
  mailboxes: PACK.summary.mailbox_count,
  workflows: PACK.summary.workflow_row_count,
};
