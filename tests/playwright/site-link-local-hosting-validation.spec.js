import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..", "..");
const PACK = JSON.parse(
  fs.readFileSync(path.join(ROOT, "data", "analysis", "site_link_environment_matrix.json"), "utf8"),
);

export const siteLinkHostingCoverage = [
  "local .well-known file reachability",
  "hosted assetlinks validation",
  "hosted AASA validation",
  "local-hosting panel parity",
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
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const baseUrl = process.env.MOCK_SITE_LINK_STUDIO_URL ?? "http://127.0.0.1:4181/";

  await page.goto(baseUrl, { waitUntil: "networkidle" });
  await page.locator("[data-testid='page-tab-Local_Hosting_Validator']").click();
  await page.locator("[data-testid='hosting-check-assetlinks']").waitFor();
  await page.locator("[data-testid='hosting-check-aasa']").waitFor();

  const assetlinksResponse = await page.evaluate(async () => {
    const response = await fetch("/.well-known/assetlinks.json");
    return {
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      payload: await response.json(),
    };
  });
  const aasaResponse = await page.evaluate(async () => {
    const response = await fetch("/.well-known/apple-app-site-association");
    return {
      ok: response.ok,
      contentType: response.headers.get("content-type"),
      payload: await response.json(),
    };
  });

  if (!assetlinksResponse.ok || !aasaResponse.ok) {
    throw new Error("Expected both hosted .well-known files to be reachable.");
  }
  if (!String(assetlinksResponse.contentType).includes("application/json")) {
    throw new Error("assetlinks.json should be served with application/json.");
  }
  if (!String(aasaResponse.contentType).includes("application/json")) {
    throw new Error("apple-app-site-association should be served with application/json.");
  }

  const hostedPreview = PACK.local_hosting_profile;
  if (JSON.stringify(assetlinksResponse.payload) !== JSON.stringify(hostedPreview.generated_assetlinks)) {
    throw new Error("Hosted assetlinks payload drifted from the generated local baseline.");
  }
  if (JSON.stringify(aasaResponse.payload) !== JSON.stringify(hostedPreview.generated_aasa)) {
    throw new Error("Hosted AASA payload drifted from the generated local baseline.");
  }

  await browser.close();
}

if (process.argv.includes("--run")) {
  run().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

export const siteLinkHostingManifest = {
  task: PACK.task_id,
  hostedEnvironment: PACK.local_hosting_profile.hosted_environment_id,
};
