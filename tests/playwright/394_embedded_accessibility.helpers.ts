import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";

import {
  EMBEDDED_ACCESSIBILITY_VISUAL_MODE,
  embeddedAccessibilityRouteFamilies,
  embeddedA11yPathForFamily,
  resolveEmbeddedA11yCoverageProfile,
  type EmbeddedAccessibilityRouteFamily,
} from "../../apps/patient-web/src/embedded-accessibility-responsive.model.ts";

export const ROOT = "/Users/test/Code/V";
export const APP_DIR = path.join(ROOT, "apps", "patient-web");
export const OUTPUT_DIR = path.join(ROOT, "output", "playwright");

export const embeddedA11yRouteFamilies = embeddedAccessibilityRouteFamilies;

export function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch (error) {
    if (!process.argv.includes("--run")) return null;
    throw error;
  }
}

function canUsePort(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.listen(port, "127.0.0.1", () => {
      server.close(() => resolve(true));
    });
  });
}

async function allocatePort(start = 5494 + (process.pid % 500)): Promise<number> {
  for (let port = start; port < start + 240; port += 1) {
    if (await canUsePort(port)) return port;
  }
  throw new Error("No free localhost port found for 394 patient-web Playwright test.");
}

async function wait(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForHttp(url: string, timeoutMs = 20_000): Promise<void> {
  const startedAt = Date.now();
  let lastError: unknown = null;
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    await wait(150);
  }
  throw new Error(`Timed out waiting for ${url}: ${String(lastError)}`);
}

export async function startPatientWeb(): Promise<{ child: ChildProcess; baseUrl: string }> {
  const port = await allocatePort();
  const logs: string[] = [];
  const child = spawn(
    "pnpm",
    ["exec", "vite", "--host", "127.0.0.1", "--port", String(port), "--strictPort"],
    {
      cwd: APP_DIR,
      env: { ...process.env, BROWSER: "none", FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  child.stdout?.on("data", (chunk) => logs.push(String(chunk)));
  child.stderr?.on("data", (chunk) => logs.push(String(chunk)));
  const baseUrl = `http://127.0.0.1:${port}`;
  try {
    await waitForHttp(`${baseUrl}${embeddedA11yPathForFamily("entry_corridor")}`);
    return { child, baseUrl };
  } catch (error) {
    child.kill("SIGTERM");
    throw new Error(`patient-web failed to start for 394.\n${logs.join("")}`, { cause: error });
  }
}

export async function stopPatientWeb(child: ChildProcess): Promise<void> {
  child.kill("SIGTERM");
  await new Promise<void>((resolve) => {
    child.once("exit", () => resolve());
    setTimeout(() => resolve(), 2_000);
  });
}

export function outputPath(fileName: string): string {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  return path.join(OUTPUT_DIR, fileName);
}

export function embeddedA11yUrl(baseUrl: string, routeFamily: EmbeddedAccessibilityRouteFamily): string {
  return `${baseUrl}${embeddedA11yPathForFamily(routeFamily)}`;
}

export async function openEmbeddedA11yRoute(
  page: any,
  baseUrl: string,
  routeFamily: EmbeddedAccessibilityRouteFamily,
): Promise<void> {
  const profile = resolveEmbeddedA11yCoverageProfile(routeFamily);
  await page.goto(embeddedA11yUrl(baseUrl, routeFamily), { waitUntil: "load" });
  await page.getByTestId(profile.rootTestId).waitFor();
  await page.getByTestId("EmbeddedAccessibilityResponsiveLayer").waitFor();
  await page.waitForFunction(
    ({ expectedRouteFamily, expectedRootTestId, visualMode }) => {
      const layer = document.querySelector("[data-testid='EmbeddedAccessibilityResponsiveLayer']");
      return (
        layer?.getAttribute("data-route-family") === expectedRouteFamily &&
        layer?.getAttribute("data-root-testid") === expectedRootTestId &&
        layer?.getAttribute("data-visual-mode") === visualMode
      );
    },
    {
      expectedRouteFamily: routeFamily,
      expectedRootTestId: profile.rootTestId,
      visualMode: EMBEDDED_ACCESSIBILITY_VISUAL_MODE,
    },
  );
}

export async function assertNoHorizontalOverflow(page: any, label: string): Promise<void> {
  const metrics = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));
  assertCondition(
    metrics.scrollWidth <= metrics.clientWidth + 2 &&
      metrics.bodyScrollWidth <= metrics.clientWidth + 2,
    `${label} overflowed horizontally: ${JSON.stringify(metrics)}`,
  );
}

export async function assertFocusedElementNotObscured(page: any, label: string): Promise<void> {
  const result = await page.evaluate(() => {
    const layer = document.querySelector<HTMLElement>("[data-testid='EmbeddedAccessibilityResponsiveLayer']");
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!layer || !active || !layer.contains(active)) {
      return { ok: false, reason: "active element outside embedded layer" };
    }
    const actionTestId = layer.dataset.actionTestid ?? layer.getAttribute("data-action-testid");
    const action = actionTestId
      ? layer.querySelector<HTMLElement>(`[data-testid='${actionTestId}']`)
      : null;
    const activeRect = active.getBoundingClientRect();
    const actionRect = action?.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const insideAction = Boolean(action?.contains(active));
    const visibleInViewport = activeRect.bottom > 0 && activeRect.top < viewportHeight;
    const clearOfAction =
      insideAction || !actionRect || activeRect.bottom <= Math.min(actionRect.top, viewportHeight) + 2;
    return {
      ok: visibleInViewport && clearOfAction,
      reason: JSON.stringify({
        activeText: active.textContent?.trim().slice(0, 80),
        activeTop: Math.round(activeRect.top),
        activeBottom: Math.round(activeRect.bottom),
        actionTop: actionRect ? Math.round(actionRect.top) : null,
        viewportHeight: Math.round(viewportHeight),
        insideAction,
      }),
    };
  });
  assertCondition(result.ok, `${label} focused element was obscured: ${result.reason}`);
}

export async function runEmbeddedA11yEquivalentAssertions(page: any, label: string): Promise<void> {
  const layer = page.getByTestId("EmbeddedAccessibilityResponsiveLayer");
  assertCondition((await layer.count()) === 1, `${label} missing shared accessibility layer`);
  assertCondition(
    (await layer.getAttribute("data-visual-mode")) === EMBEDDED_ACCESSIBILITY_VISUAL_MODE,
    `${label} visual mode missing`,
  );
  assertCondition((await page.locator("main").count()) === 1, `${label} should expose one main landmark`);
  assertCondition((await page.getByTestId("EmbeddedRouteSemanticBoundary").count()) === 1, `${label} missing semantic boundary`);
  assertCondition((await page.getByTestId("EmbeddedFocusGuard").count()) === 1, `${label} missing focus guard`);
  assertCondition(
    (await page.getByTestId("AssistiveAnnouncementDedupeBus").getAttribute("aria-live")) === "polite",
    `${label} shared live region is not polite`,
  );
  const contracts = (await page.getByTestId("EmbeddedA11yCoverageReporter").getAttribute("data-covered-contracts")) ?? "";
  for (const contract of [
    "EmbeddedFocusGuard",
    "EmbeddedFocusRestoreBoundary",
    "StickyActionObscurationGuard",
    "HostResizeResilienceLayer",
    "EmbeddedTargetSizeUtilities",
  ]) {
    assertCondition(contracts.includes(contract), `${label} coverage reporter missing ${contract}`);
  }

  const failures = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll<HTMLElement>(
        ".embedded-a11y button, .embedded-a11y a[href], .embedded-a11y input, .embedded-a11y select, .embedded-a11y textarea, .embedded-a11y [role='button']",
      ),
    )
      .filter((target) => !target.closest(".embedded-a11y__instrument"))
      .filter((target) => target.getClientRects().length > 0)
      .filter((target) => !target.matches("input[type='checkbox'], input[type='radio']"))
      .map((target) => {
        const rect = target.getBoundingClientRect();
        return {
          label: target.textContent?.trim() || target.getAttribute("aria-label") || target.getAttribute("name") || target.tagName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
        };
      })
      .filter((target) => target.width < 24 || target.height < 24),
  );
  assertCondition(failures.length === 0, `${label} has undersized targets: ${JSON.stringify(failures)}`);

  const unlabeledButtons = await page.evaluate(() =>
    Array.from(document.querySelectorAll<HTMLButtonElement>(".embedded-a11y button"))
      .filter((button) => !button.textContent?.trim() && !button.getAttribute("aria-label"))
      .map((button) => button.outerHTML.slice(0, 120)),
  );
  assertCondition(unlabeledButtons.length === 0, `${label} has unlabeled buttons: ${JSON.stringify(unlabeledButtons)}`);

  const firstButton = page.locator(".embedded-a11y button:not([disabled])").first();
  if ((await firstButton.count()) > 0) {
    await firstButton.focus();
    const focusStyle = await firstButton.evaluate((node: HTMLElement) => {
      const style = window.getComputedStyle(node);
      return { outlineStyle: style.outlineStyle, boxShadow: style.boxShadow };
    });
    assertCondition(
      focusStyle.outlineStyle !== "none" || focusStyle.boxShadow !== "none",
      `${label} focused button has no visible focus style`,
    );
    await assertFocusedElementNotObscured(page, label);
  }

  await assertNoHorizontalOverflow(page, label);
}

export async function writeAriaSnapshot(locator: any, fileName: string): Promise<string> {
  const snapshot =
    typeof locator.ariaSnapshot === "function"
      ? await locator.ariaSnapshot()
      : JSON.stringify(await locator.page().accessibility.snapshot({ root: await locator.elementHandle() }));
  fs.writeFileSync(outputPath(fileName), String(snapshot), "utf8");
  return String(snapshot);
}

