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

const ATLAS_PATH = "/docs/frontend/278_phase4_booking_case_state_atlas.html";
const STATE_MACHINE_PATH = path.join(ROOT, "data", "contracts", "278_booking_case_state_machine.json");
const ROUTE_REGISTRY_PATH = path.join(ROOT, "data", "contracts", "278_patient_booking_route_family_registry.yaml");
const PROJECTION_BUNDLE_PATH = path.join(ROOT, "data", "contracts", "278_patient_appointment_projection_bundle.json");

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".yaml") || filePath.endsWith(".yml")) return "text/yaml; charset=utf-8";
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
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

function parseYamlScalar(raw: string): string | boolean | null {
  const value = raw.trim();
  if (value === "true") return true;
  if (value === "false") return false;
  if (value === "null") return null;
  if (value.startsWith('"') && value.endsWith('"')) return JSON.parse(value);
  return value;
}

function parseRouteRegistry(text: string): Array<Record<string, unknown>> {
  const lines = text.split(/\r?\n/);
  const entries: Array<Record<string, unknown>> = [];
  let current: Record<string, unknown> | null = null;
  let currentListKey: string | null = null;
  let inRouteFamilies = false;

  for (const raw of lines) {
    if (raw.startsWith("routeFamilies:")) {
      inRouteFamilies = true;
      continue;
    }
    if (!inRouteFamilies) {
      continue;
    }
    if (raw.startsWith("  - routeId: ")) {
      if (current) entries.push(current);
      current = { routeId: parseYamlScalar(raw.split(":", 2)[1] ?? "") };
      currentListKey = null;
      continue;
    }
    if (!current) {
      continue;
    }
    if (currentListKey && raw.startsWith("    - ")) {
      const items = current[currentListKey] as Array<string | boolean | null>;
      items.push(parseYamlScalar(raw.split("-", 2)[1] ?? ""));
      continue;
    }
    if (raw.startsWith("    ")) {
      const trimmed = raw.trim();
      const splitIndex = trimmed.indexOf(":");
      if (splitIndex === -1) continue;
      const key = trimmed.slice(0, splitIndex);
      const value = trimmed.slice(splitIndex + 1).trimStart();
      if (value === "") {
        current[key] = [];
        currentListKey = key;
      } else {
        current[key] = parseYamlScalar(value);
        currentListKey = null;
      }
    }
  }

  if (current) {
    entries.push(current);
  }
  return entries;
}

async function openAtlas(page: any, atlasUrl: string): Promise<void> {
  await page.goto(atlasUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='BookingCaseStateAtlas']").waitFor();
  await page.locator("[data-testid='StateButton-handoff_received']").waitFor();
  await page.locator("[data-testid='RouteButton-patient_appointments_list']").waitFor();
  await page.locator("[data-testid='StateNode-handoff_received']").waitFor();
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

async function tabUntilFocus(page: any, selector: string, description: string, maxTabs = 18): Promise<void> {
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

  const stateMachine = JSON.parse(fs.readFileSync(STATE_MACHINE_PATH, "utf-8"));
  const projectionBundle = JSON.parse(fs.readFileSync(PROJECTION_BUNDLE_PATH, "utf-8"));
  const routeRegistry = parseRouteRegistry(fs.readFileSync(ROUTE_REGISTRY_PATH, "utf-8"));
  const waitlistedTransitionCount = stateMachine.transitions.filter(
    (transition: any) => transition.from === "waitlisted" || transition.to === "waitlisted",
  ).length;
  const routeManagePath = "/appointments/:appointmentId/manage";

  try {
    const desktopContext = await browser.newContext({ viewport: { width: 1600, height: 1200 } });
    await desktopContext.tracing.start({ screenshots: true, snapshots: true });
    const page = await desktopContext.newPage();

    const externalRequests = new Set<string>();
    const baseOrigin = new URL(atlas.atlasUrl).origin;
    page.on("request", (request: any) => {
      const requestUrl = request.url();
      if (
        !requestUrl.startsWith(baseOrigin) &&
        !requestUrl.startsWith("data:") &&
        !requestUrl.startsWith("about:")
      ) {
        externalRequests.add(requestUrl);
      }
    });

    await openAtlas(page, atlas.atlasUrl);

    const root = page.locator("[data-testid='BookingCaseStateAtlas']");
    assertCondition(
      (await root.getAttribute("data-visual-mode")) === "Booking_Case_State_Atlas",
      "root visual mode drifted",
    );
    assertCondition(
      (await root.getAttribute("data-active-state")) === "handoff_received",
      "initial active state drifted",
    );
    assertCondition(
      (await root.getAttribute("data-active-route")) === "/bookings/:bookingCaseId",
      "initial active route drifted",
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

    assertCondition(
      Object.keys(atlasData.stateDetails).length === stateMachine.states.length,
      "atlas state count must match state machine",
    );
    assertCondition(
      atlasData.transitions.length === stateMachine.transitions.length,
      "atlas transition count must match state machine",
    );
    assertCondition(
      atlasData.routes.length === routeRegistry.length,
      "atlas route count must match route registry",
    );
    assertCondition(
      atlasData.projections.length === projectionBundle.projections.length,
      "atlas projection count must match projection bundle",
    );
    assertCondition(
      atlasData.routes.map((route: any) => route.path).join("|") ===
        routeRegistry.map((route) => route.path).join("|"),
      "atlas route order must match route registry",
    );

    const stateButtonCount = await page.locator("[data-testid='StateFamilyRail'] .state-button").count();
    const stateNodeCount = await page.locator("[data-testid='CaseStateLattice'] .state-node").count();
    const routeButtonCount = await page.locator("[data-testid='RouteFamilyButtons'] .route-button").count();
    const routeTableRowCount = await page.locator("[data-testid='RouteFamilyTable'] tbody tr").count();
    const projectionCardCount = await page.locator("[data-testid='ProjectionCards'] .projection-card").count();
    const projectionTableRowCount = await page.locator("[data-testid='ProjectionTable'] tbody tr").count();
    const apiRowCount = await page.locator("[data-testid='ApiSurfaceTable'] tbody tr").count();

    assertCondition(stateButtonCount === 16, "state rail must render sixteen state buttons");
    assertCondition(stateNodeCount === 16, "lattice must render sixteen state nodes");
    assertCondition(routeButtonCount === 8, "route ladder must render eight route buttons");
    assertCondition(routeTableRowCount === 8, "route table must render eight rows");
    assertCondition(projectionCardCount === 4, "projection map must render four projection cards");
    assertCondition(projectionTableRowCount === 4, "projection table must render four rows");
    assertCondition(
      apiRowCount === atlasData.apiSurface.length + atlasData.events.length,
      "api surface table must include API routes and event rows",
    );

    await page.locator("[data-testid='StateButton-waitlisted']").click();
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='BookingCaseStateAtlas']")
          ?.getAttribute("data-active-state") === "waitlisted",
    );
    assertCondition(
      (await root.getAttribute("data-active-state")) === "waitlisted",
      "state selection should sync the root attribute",
    );
    assertCondition(
      (await page.locator("[data-testid='TransitionTable'] tbody tr").count()) === waitlistedTransitionCount,
      "transition table must stay in parity with the selected state",
    );
    assertCondition(
      ((await page.locator("#inspector-state-label").textContent()) || "").includes("waitlisted"),
      "inspector must reflect the selected state",
    );
    await page.screenshot({
      path: outputPath("278-booking-case-atlas-overview.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='RouteButton-patient_appointment_manage']").click();
    await page.waitForFunction(
      (expectedRoute: string) =>
        document
          .querySelector("[data-testid='BookingCaseStateAtlas']")
          ?.getAttribute("data-active-route") === expectedRoute,
      routeManagePath,
    );
    assertCondition(
      (await root.getAttribute("data-active-route")) === routeManagePath,
      "route selection should sync the root attribute",
    );
    assertCondition(
      ((await page.locator("#inspector-route-label").textContent()) || "").includes(routeManagePath),
      "inspector must reflect the selected route",
    );
    const manageProjectionActive = await page.evaluate(() => {
      const card = document.querySelector("[data-testid='ProjectionCard-PatientAppointmentManageProjection']");
      return card?.classList.contains("active") ?? false;
    });
    assertCondition(manageProjectionActive, "manage projection card should become active");
    const managedNodeRelated = await page.evaluate(() => {
      const node = document.querySelector("[data-testid='StateNode-managed']");
      return node?.classList.contains("related") ?? false;
    });
    assertCondition(managedNodeRelated, "managed state should be marked related for the manage route");
    await page.screenshot({
      path: outputPath("278-booking-case-atlas-manage-route.png"),
      fullPage: true,
    });

    await page.locator("[data-testid='StateButton-handoff_received']").focus();
    await page.keyboard.press("ArrowDown");
    const capabilityFocused = await page.evaluate(
      () =>
        document.activeElement instanceof Element &&
        document.activeElement.matches("[data-testid='StateButton-capability_checked']"),
    );
    assertCondition(capabilityFocused, "arrow navigation should move through the state rail");

    await page.locator("[data-testid='RouteButton-patient_appointments_list']").focus();
    await page.keyboard.press("ArrowDown");
    const bookingWorkspaceFocused = await page.evaluate(
      () =>
        document.activeElement instanceof Element &&
        document.activeElement.matches("[data-testid='RouteButton-patient_booking_workspace']"),
    );
    assertCondition(bookingWorkspaceFocused, "arrow navigation should move through the route ladder");
    await page.keyboard.press("Enter");
    await page.waitForFunction(
      () =>
        document
          .querySelector("[data-testid='BookingCaseStateAtlas']")
          ?.getAttribute("data-active-route") === "/bookings/:bookingCaseId",
    );

    await assertNoHorizontalOverflow(page, "278 booking case atlas desktop");

    const ariaSnapshots = {
      CaseStateLatticeRegion: await captureAria(page.locator("[data-testid='CaseStateLatticeRegion']"), page),
      CaseStateLattice: await captureAria(page.locator("[data-testid='CaseStateLattice']"), page),
      LineageFenceBraid: await captureAria(page.locator("[data-testid='LineageFenceBraid']"), page),
      RouteFamilyLadder: await captureAria(page.locator("[data-testid='RouteFamilyLadder']"), page),
      PatientProjectionMap: await captureAria(page.locator("[data-testid='PatientProjectionMap']"), page),
      InspectorPanel: await captureAria(page.locator("[data-testid='InspectorPanel']"), page),
    };
    fs.writeFileSync(
      outputPath("278-booking-case-atlas-aria-snapshots.json"),
      `${JSON.stringify(ariaSnapshots, null, 2)}\n`,
    );

    assertCondition(
      externalRequests.size === 0,
      `atlas should not emit external requests: ${Array.from(externalRequests).join(", ")}`,
    );
    await desktopContext.tracing.stop({ path: outputPath("278-booking-case-atlas-trace.zip") });

    const mobileContext = await browser.newContext({
      viewport: { width: 412, height: 915 },
      reducedMotion: "reduce",
    });
    await mobileContext.tracing.start({ screenshots: true, snapshots: true });
    const mobile = await mobileContext.newPage();
    await openAtlas(mobile, atlas.atlasUrl);
    assertCondition(
      (await mobile.locator("[data-testid='BookingCaseStateAtlas']").getAttribute("data-reduced-motion")) ===
        "reduce",
      "reduced-motion posture must be reflected on the atlas root",
    );
    await assertNoHorizontalOverflow(mobile, "278 booking case atlas mobile reduced");
    await mobile.screenshot({
      path: outputPath("278-booking-case-atlas-mobile-reduced.png"),
      fullPage: true,
    });
    await mobileContext.tracing.stop({ path: outputPath("278-booking-case-atlas-mobile-trace.zip") });
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
