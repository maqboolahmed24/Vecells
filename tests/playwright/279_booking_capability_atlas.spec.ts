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

const ATLAS_PATH = "/docs/frontend/279_phase4_booking_capability_atlas.html";
const TUPLE_MATRIX_PATH = path.join(ROOT, "data", "analysis", "279_capability_tuple_matrix.csv");
const MATRIX_SCHEMA_PATH = path.join(ROOT, "data", "contracts", "279_provider_capability_matrix.schema.json");
const POLICY_REGISTRY_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "279_authoritative_read_and_confirmation_gate_policy_registry.json",
);

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
  await page.locator("[data-testid='BookingCapabilityAtlas']").waitFor();
  await page.locator("[data-testid='CapabilityMatrixCanvas']").waitFor();
}

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 20): Promise<void> {
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

  const tupleRows = parseCsv(fs.readFileSync(TUPLE_MATRIX_PATH, "utf-8"));
  const matrixSchema = JSON.parse(fs.readFileSync(MATRIX_SCHEMA_PATH, "utf-8"));
  const policyRegistry = JSON.parse(fs.readFileSync(POLICY_REGISTRY_PATH, "utf-8"));

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
    const page = await desktopContext.newPage();
    const baseOrigin = new URL(atlas.atlasUrl).origin;
    const externalRequests = new Set<string>();
    page.on("request", (request: any) => {
      const url = request.url();
      if (!url.startsWith(baseOrigin) && !url.startsWith("data:") && !url.startsWith("about:")) {
        externalRequests.add(url);
      }
    });

    await openAtlas(page, atlas.atlasUrl);

    const root = page.locator("[data-testid='BookingCapabilityAtlas']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Booking_Capability_Atlas",
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

    assertCondition(atlasData.matrixRows.length === 6, "atlas matrix row count drifted");
    assertCondition(
      atlasData.scenarios.length === tupleRows.length,
      "atlas scenario count must match tuple matrix rows",
    );
    assertCondition(
      atlasData.integrationModes.join("|") ===
        matrixSchema.properties.rows.items.properties.integrationMode.enum.join("|"),
      "integration modes drifted between schema and atlas",
    );
    assertCondition(
      atlasData.policies.length === policyRegistry.policies.length,
      "policy registry count drifted between contract and atlas",
    );

    await page.locator("#SupplierButton-gp_connect_existing").click();
    await page.locator("#ModeButton-gp_connect_existing").click();
    await page.locator("#AudienceButton-patient").click();
    await page.locator("#ActionButton-reschedule_appointment").click();
    assertCondition(
      (await root.getAttribute("data-active-capability-state")) === "assisted_only",
      "patient gp-connect manage should be assisted_only",
    );
    assertCondition(
      (await root.getAttribute("data-active-surface-state")) === "assisted_only",
      "patient gp-connect projection drifted",
    );
    await page.screenshot({ path: outputPath("279-booking-capability-atlas-assisted-only.png"), fullPage: true });

    await page.locator("#AudienceButton-staff").click();
    assertCondition(
      (await root.getAttribute("data-active-capability-state")) === "live_staff_assist",
      "staff gp-connect manage should be live_staff_assist",
    );
    assertCondition(
      (await page.locator("[data-testid='AudienceProjectionTable'] tbody tr").count()) >= 2,
      "audience projection parity table should show both audiences",
    );

    const tupleNodeCount = await page.locator("#tuple-braid .tuple-node").count();
    const tupleTableCount = await page.locator("[data-testid='TupleBraidTable'] tbody tr").count();
    assertCondition(tupleNodeCount === tupleTableCount, "tuple braid and table drifted");

    const confirmationStepCount = await page.locator("#confirmation-strip .confirmation-step").count();
    const confirmationTableCount = await page.locator("[data-testid='ConfirmationGateTable'] tbody tr").count();
    assertCondition(confirmationStepCount === confirmationTableCount, "confirmation strip and table drifted");

    await tabUntilFocus(page, "#SupplierButton-optum_emis_web", "supplier rail");
    await page.keyboard.press("Enter");
    await tabUntilFocus(page, "#ModeButton-im1_patient_api", "mode rail");
    await page.keyboard.press("Enter");
    await tabUntilFocus(page, "#AudienceButton-patient", "audience rail");
    await page.keyboard.press("Enter");
    await tabUntilFocus(page, "#ActionButton-book_slot", "action rail");
    await page.keyboard.press("Enter");
    assertCondition(
      (await root.getAttribute("data-active-capability-state")) === "live_self_service",
      "keyboard selection should resolve optum patient booking live",
    );

    await assertNoHorizontalOverflow(page, "desktop atlas");
    await desktopContext.close();

    const reducedContext = await browser.newContext({
      viewport: { width: 393, height: 1100 },
      reducedMotion: "reduce",
      colorScheme: "light",
    });
    const reducedPage = await reducedContext.newPage();
    await openAtlas(reducedPage, atlas.atlasUrl);
    assertCondition(
      (await reducedPage.locator("[data-testid='BookingCapabilityAtlas']").getAttribute("data-reduced-motion")) ===
        "true",
      "reduced motion posture drifted",
    );
    await reducedPage.locator("#SupplierButton-manual_assist_network").click();
    await reducedPage.locator("#ModeButton-manual_assist_only").click();
    await reducedPage.locator("#AudienceButton-patient").click();
    await reducedPage.locator("#ActionButton-cancel_appointment").click();
    assertCondition(
      (await reducedPage.locator("[data-testid='BookingCapabilityAtlas']").getAttribute("data-active-capability-state")) ===
        "blocked",
      "manual assist blocked scenario drifted",
    );
    await assertNoHorizontalOverflow(reducedPage, "mobile reduced atlas");
    await reducedPage.screenshot({
      path: outputPath("279-booking-capability-atlas-mobile-reduced.png"),
      fullPage: true,
    });
    await reducedContext.close();

    assertCondition(externalRequests.size === 0, `atlas should not fetch external resources: ${[...externalRequests].join(", ")}`);
  } finally {
    await browser.close();
    await stopAtlasServer(atlas.server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
