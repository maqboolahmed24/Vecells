import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
export const ROOT = path.resolve(__dirname, "..", "..");
export const CONTROL_DECK_URL_PATH = "/docs/architecture/83_simulator_backplane_control_deck.html";

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    throw new Error("These specs need the `playwright` package when run with --run.");
  }
}

export function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForHttp(url, timeoutMs = 10_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch {
      // keep polling
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}`);
}

export async function startStaticServer(port = 4383) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((request, response) => {
      const rawUrl = request.url ?? "/";
      const urlPath = rawUrl === "/" ? CONTROL_DECK_URL_PATH : rawUrl.split("?")[0];
      const safePath = decodeURIComponent(urlPath).replace(/^\/+/, "");
      const filePath = path.join(ROOT, safePath);
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
      response.writeHead(200, { "content-type": contentType });
      response.end(fs.readFileSync(filePath));
    });
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => resolve(server));
  });
}

export async function closeServer(server) {
  await new Promise((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function startSimulatorService(port = 7104) {
  const child = spawn(
    "pnpm",
    ["exec", "tsx", path.join(ROOT, "services", "adapter-simulators", "src", "index.ts")],
    {
      cwd: ROOT,
      env: {
        ...process.env,
        HOST: "127.0.0.1",
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  const logs = [];
  child.stdout.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr.on("data", (chunk) => logs.push(String(chunk)));

  try {
    await waitForHttp(`http://127.0.0.1:${port}/health`);
  } catch (error) {
    child.kill("SIGTERM");
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Simulator service failed to start.\n${logs.join("")}\n${message}`, {
      cause: error,
    });
  }

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    child,
    logs,
  };
}

export async function stopSimulatorService(child) {
  child.kill("SIGTERM");
  await new Promise((resolve) => {
    child.once("exit", () => resolve(undefined));
    setTimeout(() => resolve(undefined), 2_000);
  });
}
