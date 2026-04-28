import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const HTML_PATH = path.join(ROOT, "docs", "architecture", "89_secret_and_key_rotation_atlas.html");
const MANIFEST_PATH = path.join(ROOT, "data", "analysis", "secret_class_manifest.json");
const KEY_HIERARCHY_PATH = path.join(ROOT, "data", "analysis", "key_hierarchy_manifest.json");
const ROTATION_PATH = path.join(ROOT, "data", "analysis", "rotation_policy_matrix.csv");

const MANIFEST = JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf8"));
const KEY_HIERARCHY = JSON.parse(fs.readFileSync(KEY_HIERARCHY_PATH, "utf8"));
const ROTATION_ROWS = parseCsv(fs.readFileSync(ROTATION_PATH, "utf8"));

export const secretAndKeyRotationAtlasCoverage = [
  "filter behavior and synchronized selection",
  "keyboard navigation and focus management",
  "reduced-motion handling",
  "responsive layout at desktop and tablet widths",
  "accessibility smoke checks and landmark verification",
  "verified, overdue, revoked, and break-glass states stay distinct",
];

function parseCsv(text) {
  const rows = [];
  let field = "";
  let row = [];
  let inQuotes = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];
    if (character === '"') {
      if (inQuotes && nextCharacter === '"') {
        field += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (character === "," && !inQuotes) {
      row.push(field);
      field = "";
      continue;
    }
    if ((character === "\n" || character === "\r") && !inQuotes) {
      if (character === "\r" && nextCharacter === "\n") {
        index += 1;
      }
      if (field.length > 0 || row.length > 0) {
        row.push(field);
        rows.push(row);
        row = [];
        field = "";
      }
      continue;
    }
    field += character;
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  const [header, ...body] = rows;
  return body.map((values) =>
    Object.fromEntries(header.map((column, index) => [column, values[index] ?? ""])),
  );
}

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

function visibleSecrets({ environment, workloadFamily = "all", accessState = "all" }) {
  return MANIFEST.secret_classes.filter((row) => {
    if (!row.allowed_environment_rings.includes(environment)) {
      return false;
    }
    if (workloadFamily !== "all" && row.owning_workload_family_ref !== workloadFamily) {
      return false;
    }
    if (accessState !== "all" && row.access_state !== accessState) {
      return false;
    }
    return true;
  });
}

function startStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const rawUrl = request.url ?? "/";
      const urlPath =
        rawUrl === "/"
          ? "/docs/architecture/89_secret_and_key_rotation_atlas.html"
          : rawUrl.split("?")[0];
      const filePath = path.join(ROOT, decodeURIComponent(urlPath).replace(/^\/+/, ""));
      if (!filePath.startsWith(ROOT) || !fs.existsSync(filePath)) {
        response.writeHead(404);
        response.end("Not found");
        return;
      }
      const contentType = filePath.endsWith(".html")
        ? "text/html; charset=utf-8"
        : filePath.endsWith(".json")
          ? "application/json; charset=utf-8"
          : filePath.endsWith(".csv")
            ? "text/csv; charset=utf-8"
            : "text/plain; charset=utf-8";
      response.writeHead(200, { "Content-Type": contentType });
      response.end(fs.readFileSync(filePath));
    });
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => resolve(server));
  });
}

async function run() {
  assertCondition(fs.existsSync(HTML_PATH), `Missing atlas HTML: ${HTML_PATH}`);
  const { chromium } = await importPlaywright();
  const server = await startStaticServer();
  const address = server.address();
  assertCondition(
    typeof address === "object" && address !== null && typeof address.port === "number",
    "Static server did not return a usable port.",
  );
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1160 } });
  const url =
    process.env.SECRET_KEY_ROTATION_ATLAS_URL ??
    `http://127.0.0.1:${address.port}/docs/architecture/89_secret_and_key_rotation_atlas.html`;

  try {
    await page.goto(url, { waitUntil: "networkidle" });
    await page.locator("[data-testid='hierarchy-diagram']").waitFor();
    await page.locator("[data-testid='access-matrix']").waitFor();
    await page.locator("[data-testid='rotation-timeline']").waitFor();
    await page.locator("[data-testid='manifest-table']").waitFor();
    await page.locator("[data-testid='policy-table']").waitFor();
    await page.locator("[data-testid='inspector']").waitFor();

    const initialSecrets = visibleSecrets({ environment: "local" }).length;
    const initialCards = await page.locator("[data-testid^='secret-card-']").count();
    const initialRows = await page.locator("[data-testid^='manifest-row-']").count();
    assertCondition(
      initialCards === initialSecrets,
      `Initial secret-card count drifted: expected ${initialSecrets}, found ${initialCards}`,
    );
    assertCondition(
      initialRows === initialSecrets,
      `Initial manifest-row count drifted: expected ${initialSecrets}, found ${initialRows}`,
    );

    await page.locator("[data-testid='filter-environment']").selectOption("preprod");
    await page.locator("[data-testid='filter-access-state']").selectOption("overdue_rotation");
    const overdueSecrets = visibleSecrets({
      environment: "preprod",
      accessState: "overdue_rotation",
    }).length;
    const overdueCards = await page.locator("[data-testid^='secret-card-']").count();
    const overdueTimeline = await page.locator("[data-testid^='rotation-row-']").count();
    assertCondition(
      overdueCards === overdueSecrets && overdueTimeline === overdueSecrets,
      `Overdue filter drifted: expected ${overdueSecrets}, found cards=${overdueCards}, timeline=${overdueTimeline}`,
    );

    await page.locator("[data-testid='filter-access-state']").selectOption("all");
    await page
      .locator("[data-testid='filter-workload-family']")
      .selectOption("wf_integration_simulation_lab");
    const simulatorSecrets = visibleSecrets({
      environment: "preprod",
      workloadFamily: "wf_integration_simulation_lab",
    }).length;
    assertCondition(simulatorSecrets === 0, "Preprod should not expose simulator secret classes.");

    await page.locator("[data-testid='filter-environment']").selectOption("local");
    await page
      .locator("[data-testid='filter-workload-family']")
      .selectOption("wf_integration_simulation_lab");
    const localSimulatorSecrets = visibleSecrets({
      environment: "local",
      workloadFamily: "wf_integration_simulation_lab",
    }).length;
    const localSimulatorCards = await page.locator("[data-testid^='secret-card-']").count();
    assertCondition(
      localSimulatorCards === localSimulatorSecrets,
      `Local simulator filter drifted: expected ${localSimulatorSecrets}, found ${localSimulatorCards}`,
    );

    await page.locator("[data-testid='filter-workload-family']").selectOption("all");
    await page.locator("[data-testid='manifest-row-NOTIFICATION_WEBHOOK_SECRET_REF']").click();
    const inspectorText = await page.locator("[data-testid='inspector']").innerText();
    assertCondition(
      inspectorText.includes("KMS_PROVIDER_CREDENTIAL_WRAP"),
      "Inspector lost provider credential key linkage.",
    );
    assertCondition(
      inspectorText.includes("ap_notification_runtime"),
      "Inspector lost notification access policy linkage.",
    );
    const keySelected = await page
      .locator("[data-testid='key-node-KMS_PROVIDER_CREDENTIAL_WRAP']")
      .getAttribute("data-selected");
    assertCondition(keySelected === "true", "Key hierarchy no longer synchronizes selection.");
    const policySelected = await page
      .locator("[data-testid='policy-row-ap_notification_runtime']")
      .getAttribute("data-selected");
    assertCondition(policySelected === "true", "Policy table no longer synchronizes selection.");

    await page.locator("[data-testid='manifest-row-AUTH_EDGE_SESSION_SECRET_REF']").focus();
    await page.keyboard.press("ArrowDown");
    const selectedRows = page.locator("[data-testid^='manifest-row-'][data-selected='true']");
    assertCondition(
      (await selectedRows.count()) === 1,
      "Arrow navigation should keep exactly one manifest row selected.",
    );

    await page.locator("[data-testid='filter-access-state']").selectOption("revoked_ready");
    const revokedCards = await page.locator("[data-testid^='secret-card-']").count();
    assertCondition(
      revokedCards === 1,
      `Expected exactly one revoked-ready secret class, found ${revokedCards}`,
    );
    const revokedState = await page
      .locator("[data-testid='secret-card-SIMULATOR_MESH_MAILBOX_SECRET_REF']")
      .getAttribute("data-access-state");
    assertCondition(revokedState === "revoked_ready", "Revoked-ready state lost semantic marker.");

    await page.locator("[data-testid='filter-access-state']").selectOption("break_glass_only");
    const breakGlassRows = await page.locator("[data-testid^='rotation-row-']").count();
    assertCondition(
      breakGlassRows === 1,
      `Expected one break-glass-only rotation row, found ${breakGlassRows}`,
    );

    await page.setViewportSize({ width: 980, height: 1100 });
    await page.locator("[data-testid='inspector']").waitFor();

    const motionPage = await browser.newPage({ viewport: { width: 1280, height: 920 } });
    try {
      await motionPage.emulateMedia({ reducedMotion: "reduce" });
      await motionPage.goto(url, { waitUntil: "networkidle" });
      const reducedMotion = await motionPage.locator("body").getAttribute("data-reduced-motion");
      assertCondition(reducedMotion === "true", "Reduced-motion posture did not activate.");
    } finally {
      await motionPage.close();
    }

    const landmarks = await page.locator("header, main, aside, section, article").count();
    assertCondition(landmarks >= 8, `Expected multiple landmarks, found ${landmarks}`);

    assertCondition(
      KEY_HIERARCHY.branch_keys.length === 6,
      "Expected six branch keys in the hierarchy manifest.",
    );
    assertCondition(
      ROTATION_ROWS.filter((row) => row.access_state === "overdue_rotation").length === 2,
      "Expected two overdue rotation rows in the rotation matrix.",
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
