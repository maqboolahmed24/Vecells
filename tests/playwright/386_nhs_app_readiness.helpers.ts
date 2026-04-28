import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

export const ROOT = "/Users/test/Code/V";

export function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.warn("Playwright is not installed; skipping 386 NHS App readiness browser proof.");
    return null;
  }
}

export function outputPath(fileName: string): string {
  const outputDir = path.join(ROOT, "output", "playwright");
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, fileName);
}

function canUsePort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => {
      server.close(() => resolve(true));
    });
    server.listen(port, "127.0.0.1");
  });
}

export async function allocatePort(start = 4760): Promise<number> {
  for (let port = start; port < start + 80; port += 1) {
    if (await canUsePort(port)) {
      return port;
    }
  }
  throw new Error("No free localhost port found for 386 ops-console Playwright test.");
}

async function waitForHttp(url: string, timeoutMs = 20_000): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

export async function startOpsConsole(): Promise<{
  readonly baseUrl: string;
  readonly port: number;
  readonly process: ChildProcessWithoutNullStreams;
}> {
  const port = await allocatePort();
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: path.join(ROOT, "apps", "ops-console"),
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: "pipe",
    },
  );
  child.stdout.on("data", () => undefined);
  child.stderr.on("data", () => undefined);
  child.once("exit", (code) => {
    if (code && code !== 0) {
      console.warn(`386 ops-console dev server exited with code ${code}`);
    }
  });
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForHttp(`${baseUrl}/ops/release/nhs-app/routes`);
  return { baseUrl, port, process: child };
}

export async function stopOpsConsole(child: ChildProcessWithoutNullStreams): Promise<void> {
  if (child.killed) {
    return;
  }
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    child.kill("SIGTERM");
    setTimeout(() => {
      if (!child.killed) {
        child.kill("SIGKILL");
      }
      resolve();
    }, 1_000);
  });
}

export async function assertNoHorizontalOverflow(page: {
  evaluate: <T>(fn: () => T | Promise<T>) => Promise<T>;
}): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assertCondition(
    metrics.scrollWidth <= metrics.clientWidth + 2 && metrics.bodyScrollWidth <= metrics.clientWidth + 2,
    `Horizontal overflow: ${JSON.stringify(metrics)}`,
  );
}
