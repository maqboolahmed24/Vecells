import fs from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { INTERNAL_SURFACES, type InternalEntrypointConfig } from "../src/config.js";
import { createInternalEntrypointServer } from "../src/server.js";
import { hashInternalPassword } from "../src/security.js";

let server: http.Server | undefined;
let baseUrl = "";
let repoRoot = "";

function listen(serverToStart: http.Server): Promise<number> {
  return new Promise((resolve, reject) => {
    serverToStart.once("error", reject);
    serverToStart.listen(0, "127.0.0.1", () => {
      serverToStart.removeListener("error", reject);
      const address = serverToStart.address();
      if (!address || typeof address === "string") {
        reject(new Error("Server address unavailable"));
        return;
      }
      resolve(address.port);
    });
  });
}

async function close(serverToClose: http.Server | undefined): Promise<void> {
  if (!serverToClose) {
    return;
  }
  await new Promise<void>((resolve, reject) => {
    serverToClose.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
}

function writeSurfaceBuild(surfaceId: string): void {
  const surface = INTERNAL_SURFACES.find((item) => item.id === surfaceId);
  if (!surface) {
    throw new Error(`Unknown surface ${surfaceId}`);
  }
  const dist = path.join(repoRoot, surface.distDir);
  fs.mkdirSync(path.join(dist, "assets"), { recursive: true });
  fs.writeFileSync(
    path.join(dist, "index.html"),
    '<!doctype html><html><head><script type="module" src="/assets/app.js"></script></head><body><div id="root">App shell</div></body></html>',
  );
  fs.writeFileSync(path.join(dist, "assets", "app.js"), 'document.body.dataset.loaded = "yes";');
}

beforeEach(async () => {
  repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), "vecells-entrypoint-"));
  writeSurfaceBuild("patient-web");
  const config: InternalEntrypointConfig = {
    host: "127.0.0.1",
    port: 0,
    environment: "test",
    repoRoot,
    passwordHash: hashInternalPassword("correct-password", Buffer.from("entrypoint-test-salt")),
    sessionSecret: "test-session-secret",
    cookieSecure: false,
    dataMode: "synthetic-disposable",
    surfaces: INTERNAL_SURFACES,
  };
  server = createInternalEntrypointServer(config);
  const port = await listen(server);
  baseUrl = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await close(server);
  fs.rmSync(repoRoot, { recursive: true, force: true });
});

describe("internal entrypoint", () => {
  it("shows only the password page to anonymous visitors", async () => {
    const response = await fetch(`${baseUrl}/`);
    const body = await response.text();

    expect(response.status).toBe(200);
    expect(body).toContain("Internal test access");
    expect(body).not.toContain("Patient web");
    expect(body).not.toContain("Clinical workspace");
  });

  it("rejects a wrong password without setting a session", async () => {
    const response = await fetch(`${baseUrl}/login`, {
      method: "POST",
      body: new URLSearchParams({ password: "wrong" }),
    });
    const body = await response.text();

    expect(response.status).toBe(401);
    expect(body).toContain("Access denied.");
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sets an HTTP-only session for the correct password and renders the internal menu", async () => {
    const login = await fetch(`${baseUrl}/login`, {
      method: "POST",
      body: new URLSearchParams({ password: "correct-password" }),
      redirect: "manual",
    });
    const cookie = login.headers.get("set-cookie");

    expect(login.status).toBe(303);
    expect(cookie).toContain("vecells_internal_session=");
    expect(cookie).toContain("HttpOnly");
    expect(cookie).toContain("SameSite=Lax");

    const menu = await fetch(`${baseUrl}/internal`, {
      headers: { cookie: cookie ?? "" },
    });
    const body = await menu.text();

    expect(menu.status).toBe(200);
    expect(body).toContain("Vecells internal test environment");
    expect(body).toContain("Patient web");
    expect(body).toContain("Governance console");
  });

  it("gates app routes and rewrites built app asset paths after login", async () => {
    const anonymous = await fetch(`${baseUrl}/apps/patient-web/`);
    const anonymousBody = await anonymous.text();
    expect(anonymousBody).toContain("Internal test access");
    expect(anonymousBody).not.toContain("App shell");

    const login = await fetch(`${baseUrl}/login`, {
      method: "POST",
      body: new URLSearchParams({ password: "correct-password" }),
      redirect: "manual",
    });
    const cookie = login.headers.get("set-cookie") ?? "";
    const app = await fetch(`${baseUrl}/apps/patient-web/`, { headers: { cookie } });
    const appBody = await app.text();

    expect(app.status).toBe(200);
    expect(appBody).toContain("App shell");
    expect(appBody).toContain("/apps/patient-web/assets/app.js");

    const asset = await fetch(`${baseUrl}/apps/patient-web/assets/app.js`, { headers: { cookie } });
    expect(asset.status).toBe(200);
    expect(await asset.text()).toContain("dataset.loaded");
  });

  it("clears the session on logout", async () => {
    const login = await fetch(`${baseUrl}/login`, {
      method: "POST",
      body: new URLSearchParams({ password: "correct-password" }),
      redirect: "manual",
    });
    const cookie = login.headers.get("set-cookie") ?? "";
    const logout = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { cookie },
      redirect: "manual",
    });

    expect(logout.status).toBe(303);
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
  });

  it("provides a gated synthetic browser-state reset page", async () => {
    const anonymous = await fetch(`${baseUrl}/reset-client-state`);
    expect(await anonymous.text()).toContain("Internal test access");

    const login = await fetch(`${baseUrl}/login`, {
      method: "POST",
      body: new URLSearchParams({ password: "correct-password" }),
      redirect: "manual",
    });
    const cookie = login.headers.get("set-cookie") ?? "";
    const reset = await fetch(`${baseUrl}/reset-client-state`, {
      method: "POST",
      headers: { cookie },
    });
    const body = await reset.text();

    expect(reset.status).toBe(200);
    expect(body).toContain("Browser state reset");
    expect(body).toContain("localStorage.clear");
    expect(body).toContain("sessionStorage.clear");
  });
});
