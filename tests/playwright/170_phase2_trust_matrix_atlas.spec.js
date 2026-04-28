import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "frontend", "170_phase2_trust_matrix_atlas.html");
const ROUTE_PROFILES_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "170_route_capability_profiles.yaml",
);
const MATRIX_PATH = path.join(ROOT, "data", "analysis", "170_capability_matrix.csv");
const AUTHORITY_PATH = path.join(ROOT, "data", "contracts", "170_identity_authority_rules.json");
const PATIENT_LINK_PATH = path.join(
  ROOT,
  "data",
  "contracts",
  "170_patient_link_boundary_contract.json",
);
const GAP_LOG_PATH = path.join(ROOT, "data", "analysis", "170_trust_gap_log.json");

export const phase2TrustMatrixAtlasCoverage = [
  "filter synchronization",
  "row/node selection sync",
  "blocked/future profile rendering",
  "keyboard traversal and landmarks",
  "reducedMotion equivalence",
  "diagram/table parity",
  "Trust_Matrix_Atlas",
];

function assertCondition(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split(/\r?\n/);
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

function parseYamlValue(value) {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (
    (trimmed.startsWith("'") && trimmed.endsWith("'")) ||
    (trimmed.startsWith('"') && trimmed.endsWith('"'))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}

function parseRouteProfiles(text) {
  const result = { profiles: [] };
  let current = null;
  let activeArray = "";
  for (const original of text.split(/\r?\n/)) {
    if (!original.trim() || original.trim().startsWith("#")) continue;
    if (!original.startsWith(" ")) {
      const [key, ...rest] = original.split(":");
      const value = rest.join(":").trim();
      if (value) result[key] = parseYamlValue(value);
      current = null;
      activeArray = "";
      continue;
    }
    if (original.startsWith("  - profileId:")) {
      current = { profileId: parseYamlValue(original.split(":").slice(1).join(":")) };
      result.profiles.push(current);
      activeArray = "";
      continue;
    }
    if (!current || !original.startsWith("    ")) continue;
    const trimmed = original.trim();
    if (trimmed.startsWith("- ") && activeArray) {
      current[activeArray].push(parseYamlValue(trimmed.slice(2)));
      continue;
    }
    const [key, ...rest] = trimmed.split(":");
    const value = rest.join(":").trim();
    if (value) {
      current[key] = parseYamlValue(value);
      activeArray = "";
    } else {
      current[key] = [];
      activeArray = key;
    }
  }
  return result;
}

async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("This spec needs the `playwright` package when run with --run.");
  }
}

function getExpected() {
  for (const filePath of [
    HTML_PATH,
    ROUTE_PROFILES_PATH,
    MATRIX_PATH,
    AUTHORITY_PATH,
    PATIENT_LINK_PATH,
    GAP_LOG_PATH,
  ]) {
    assertCondition(fs.existsSync(filePath), `Missing seq_170 artifact ${filePath}`);
  }
  const registry = parseRouteProfiles(fs.readFileSync(ROUTE_PROFILES_PATH, "utf8"));
  const matrix = parseCsv(fs.readFileSync(MATRIX_PATH, "utf8"));
  const authority = JSON.parse(fs.readFileSync(AUTHORITY_PATH, "utf8"));
  const patientLink = JSON.parse(fs.readFileSync(PATIENT_LINK_PATH, "utf8"));
  const gaps = JSON.parse(fs.readFileSync(GAP_LOG_PATH, "utf8"));
  const smsRow = matrix.find(
    (row) => row.capability_id === "CAP_170_SMS_CONTINUATION_PHONE_SEEDED",
  );
  const futureRecords = registry.profiles.find(
    (profile) => profile.profileId === "RCP_170_FUTURE_PROTECTED_RECORDS",
  );
  const unknownFallback = registry.profiles.find(
    (profile) => profile.profileId === "RCP_170_UNKNOWN_PROTECTED_ROUTE_FALLBACK",
  );
  assertCondition(smsRow, "Missing SMS continuation matrix row.");
  assertCondition(futureRecords, "Missing future protected records profile.");
  assertCondition(unknownFallback, "Missing unknown protected route fallback.");
  return {
    registry,
    matrix,
    authority,
    patientLink,
    gaps,
    smsRow,
    futureRecords,
    unknownFallback,
    futureDeniedCount: matrix.filter(
      (row) => row.future_profile_pending === "true" && row.decision === "deny",
    ).length,
  };
}

function serve(rootDir) {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === "/") {
      pathname = "/docs/frontend/170_phase2_trust_matrix_atlas.html";
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
              : extension === ".yaml"
                ? "text/yaml; charset=utf-8"
                : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": type });
      response.end(buffer);
    });
  });

  return new Promise((resolve, reject) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        reject(new Error("Unable to bind local seq_170 server."));
        return;
      }
      resolve({
        server,
        url: `http://127.0.0.1:${address.port}/docs/frontend/170_phase2_trust_matrix_atlas.html`,
      });
    });
  });
}

async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve(undefined))),
  );
}

async function openAtlas(page, url) {
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.dataset.ready === "true");
  await page.locator("[data-testid='Trust_Matrix_Atlas']").waitFor();
}

async function assertNoOverflow(page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  );
  assertCondition(overflow <= 1, `Page has horizontal overflow of ${overflow}px.`);
}

async function assertAtlasShell(page, expected) {
  for (const testId of [
    "Trust_Matrix_Atlas",
    "board-masthead",
    "trust_lattice_mark",
    "filter-rail",
    "decision-filter",
    "route-filter",
    "capability-lattice",
    "capability-lattice-table",
    "route-profile-matrix",
    "route-profile-table",
    "authority-boundary-braid",
    "authority-boundary-table",
    "schema-table",
    "parity-table",
    "inspector",
    "future-profile-banner",
  ]) {
    await page.locator(`[data-testid='${testId}']`).waitFor({ state: "attached" });
  }
  assertCondition(
    Number((await page.locator("[data-testid='visible-capability-count']").innerText()).trim()) ===
      expected.matrix.length,
    "Visible capability count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='visible-route-count']").innerText()).trim()) ===
      expected.registry.profiles.length,
    "Visible route profile count drifted.",
  );
  assertCondition(
    Number((await page.locator("[data-testid='denied-future-count']").innerText()).trim()) ===
      expected.futureDeniedCount,
    "Future denied count drifted.",
  );
  assertCondition(
    (await page.locator("[data-testid='authority-boundary-table'] tbody tr").count()) ===
      expected.authority.components.length,
    "Authority table lost parity with rules.",
  );
}

async function assertFilterSynchronization(page, expected) {
  await page.locator("[data-testid='decision-filter']").selectOption("recover_only");
  const capabilityRows = page.locator("[data-testid='capability-lattice-table'] tbody tr");
  const count = await capabilityRows.count();
  assertCondition(count > 0, "Recover-only filter should show at least one row.");
  for (let index = 0; index < count; index += 1) {
    const text = await capabilityRows.nth(index).innerText();
    assertCondition(
      text.includes("recover_only"),
      "Decision filter did not sync capability table.",
    );
  }
  assertCondition(
    (await page.locator("[data-testid='route-profile-matrix'] button").count()) ===
      new Set(
        expected.matrix
          .filter((row) => row.decision === "recover_only")
          .map((row) => row.route_profile_ref),
      ).size,
    "Decision filter did not sync route profile cards.",
  );

  await page.locator("[data-testid='decision-filter']").selectOption("all");
  await page.locator("[data-testid='route-filter']").selectOption("future_protected_records");
  assertCondition(
    (await page.locator("[data-testid='capability-lattice-table'] tbody tr").count()) === 1,
    "Route filter did not narrow capability rows.",
  );
  const inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(expected.futureRecords.profileId),
    "Route filter did not sync inspector to future profile.",
  );
  assertCondition(
    await page.locator("[data-testid='future-profile-banner']").isVisible(),
    "Future route selection did not expose future profile banner.",
  );

  await page.locator("[data-testid='route-filter']").selectOption("all");
}

async function assertSelectionSync(page, expected) {
  await page.locator(`[data-testid='capability-node-${expected.smsRow.capability_id}']`).click();
  let inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(expected.smsRow.route_profile_ref),
    "Capability node selection did not sync inspector.",
  );
  assertCondition(
    inspectorText.includes("continuation_recovery_only"),
    "Capability node selection did not expose grant ceiling.",
  );

  await page
    .locator(`[data-testid='route-profile-row-${expected.unknownFallback.profileId}']`)
    .focus();
  await page.keyboard.press("Enter");
  inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(expected.unknownFallback.profileId),
    "Keyboard route row selection did not sync inspector.",
  );
  assertCondition(
    inspectorText.includes("deny"),
    "Unknown protected route fallback did not render deny posture.",
  );
}

async function assertKeyboardAndLandmarks(page) {
  const firstNode = page.locator("[data-testid='capability-lattice'] button").first();
  await firstNode.focus();
  const firstProfile = await firstNode.getAttribute("data-profile-ref");
  await page.keyboard.press("ArrowRight");
  const activeProfileAfterArrow = await page.evaluate(() =>
    document.activeElement?.getAttribute("data-profile-ref"),
  );
  assertCondition(
    activeProfileAfterArrow && activeProfileAfterArrow !== firstProfile,
    "Arrow-key traversal did not move between lattice nodes.",
  );
  await page.keyboard.press("Enter");
  const inspectorText = await page.locator("[data-testid='inspector']").innerText();
  assertCondition(
    inspectorText.includes(activeProfileAfterArrow),
    "Keyboard activation did not sync selected lattice node.",
  );
  await page.locator("#trust-main").focus();
  assertCondition(
    (await page.evaluate(() => document.activeElement?.id)) === "trust-main",
    "Main landmark did not accept focus.",
  );
}

async function assertDiagramTableParity(page) {
  const parityText = await page.locator("[data-testid='parity-table']").innerText();
  for (const [visual, table] of [
    ["capability-lattice", "capability-lattice-table"],
    ["route-profile-matrix", "route-profile-table"],
    ["authority-boundary-braid", "authority-boundary-table"],
    ["trust_lattice_mark", "schema-table"],
  ]) {
    assertCondition(parityText.includes(visual), `${visual} missing from parity table.`);
    assertCondition(parityText.includes(table), `${table} missing from parity table.`);
  }
}

async function assertReducedMotion(browser, url) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  try {
    await openAtlas(page, url);
    await assertDiagramTableParity(page);
    const duration = await page
      .locator(".route-line span")
      .first()
      .evaluate((element) => getComputedStyle(element).animationDuration);
    assertCondition(
      Number.parseFloat(duration) <= 0.01,
      `Reduced motion did not collapse route-line animation: ${duration}`,
    );
  } finally {
    await context.close();
  }
}

export async function run() {
  const expected = getExpected();
  const { chromium } = await importPlaywright();
  const { server, url } = await serve(ROOT);
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 1040 } });
    await openAtlas(page, url);
    await assertNoOverflow(page);
    await assertAtlasShell(page, expected);
    await assertFilterSynchronization(page, expected);
    await assertSelectionSync(page, expected);
    await assertKeyboardAndLandmarks(page);
    await assertDiagramTableParity(page);
    await page.close();

    const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
    await openAtlas(mobile, url);
    await assertNoOverflow(mobile);
    await mobile.close();

    await assertReducedMotion(browser, url);
  } finally {
    await browser.close();
    await closeServer(server);
  }
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
} else {
  console.log("170_phase2_trust_matrix_atlas.spec.js: syntax ok");
}
