import fs from "node:fs";
import { performance } from "node:perf_hooks";

import {
  importPlaywright,
  openBookingRoute,
  openStaffBookingRoute,
  outputPath,
  patientPathUrl,
  startLocalBookingApps,
  stopLocalBookingApps,
} from "../playwright/309_phase4_local_booking.helpers.ts";

interface WebMetrics {
  readonly domContentLoadedMs: number;
  readonly loadMs: number;
  readonly lcpMs: number | null;
  readonly cls: number;
}

interface ScenarioRun {
  readonly actorClass: "patient" | "staff";
  readonly deviceClass: "desktop" | "tablet" | "mobile";
  readonly interactionMs: number;
  readonly metrics: WebMetrics;
}

interface ScenarioAggregate {
  readonly scenarioId: string;
  readonly label: string;
  readonly concurrency: number;
  readonly status: "passed" | "failed";
  readonly p75: {
    readonly domContentLoadedMs: number;
    readonly loadMs: number;
    readonly interactionMs: number;
    readonly cls: number;
    readonly lcpMs: number | null;
  };
  readonly runs: readonly ScenarioRun[];
}

export interface LocalBookingLoadProbeResult {
  readonly status: "passed" | "failed";
  readonly generatedAt: string;
  readonly budgets: {
    readonly lcpMs: number;
    readonly interactionMs: number;
    readonly cls: number;
  };
  readonly scenarios: readonly ScenarioAggregate[];
}

async function instrumentContext(context: any): Promise<void> {
  await context.addInitScript(() => {
    const state = {
      cls: 0,
      lcpMs: null as number | null,
    };
    (window as any).__perf309 = state;
    try {
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!shift.hadRecentInput) {
            state.cls += shift.value ?? 0;
          }
        }
      }).observe({ type: "layout-shift", buffered: true });
    } catch {
      // layout-shift not supported in this environment
    }
    try {
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1];
        if (last) {
          state.lcpMs = Math.round(last.startTime);
        }
      }).observe({ type: "largest-contentful-paint", buffered: true });
    } catch {
      // largest-contentful-paint not supported in this environment
    }
  });
}

async function readWebMetrics(page: any): Promise<WebMetrics> {
  return await page.evaluate(() => {
    const nav = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    const state = (window as any).__perf309 ?? {};
    return {
      domContentLoadedMs: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      loadMs: Math.round(nav?.loadEventEnd ?? 0),
      lcpMs: typeof state.lcpMs === "number" ? Math.round(state.lcpMs) : null,
      cls: Number((state.cls ?? 0).toFixed(4)),
    };
  });
}

function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.ceil((p / 100) * sorted.length) - 1));
  return Number(sorted[index]!.toFixed(2));
}

function percentileNullable(values: readonly Array<number | null>, p: number): number | null {
  const numbers = values.filter((value): value is number => typeof value === "number");
  return numbers.length > 0 ? percentile(numbers, p) : null;
}

function aggregateScenario(
  scenarioId: string,
  label: string,
  concurrency: number,
  runs: readonly ScenarioRun[],
  budgets: LocalBookingLoadProbeResult["budgets"],
): ScenarioAggregate {
  const p75 = {
    domContentLoadedMs: percentile(
      runs.map((run) => run.metrics.domContentLoadedMs),
      75,
    ),
    loadMs: percentile(
      runs.map((run) => run.metrics.loadMs),
      75,
    ),
    interactionMs: percentile(
      runs.map((run) => run.interactionMs),
      75,
    ),
    cls: percentile(
      runs.map((run) => run.metrics.cls),
      75,
    ),
    lcpMs: percentileNullable(
      runs.map((run) => run.metrics.lcpMs),
      75,
    ),
  };
  const status =
    p75.interactionMs <= budgets.interactionMs &&
    p75.cls <= budgets.cls &&
    (p75.lcpMs === null || p75.lcpMs <= budgets.lcpMs)
      ? "passed"
      : "failed";
  return { scenarioId, label, concurrency, status, p75, runs };
}

async function runSlotSearchBurst(
  browser: any,
  patientBaseUrl: string,
): Promise<readonly ScenarioRun[]> {
  const devices = [
    {
      actorClass: "patient" as const,
      deviceClass: "desktop" as const,
      viewport: { width: 1440, height: 1080 },
    },
    {
      actorClass: "patient" as const,
      deviceClass: "desktop" as const,
      viewport: { width: 1366, height: 960 },
    },
    {
      actorClass: "patient" as const,
      deviceClass: "tablet" as const,
      viewport: { width: 1024, height: 1180 },
    },
    {
      actorClass: "patient" as const,
      deviceClass: "tablet" as const,
      viewport: { width: 900, height: 1100 },
    },
    {
      actorClass: "patient" as const,
      deviceClass: "mobile" as const,
      viewport: { width: 430, height: 932 },
    },
    {
      actorClass: "patient" as const,
      deviceClass: "mobile" as const,
      viewport: { width: 390, height: 844 },
    },
  ];

  return await Promise.all(
    devices.map(async (device, index) => {
      const context = await browser.newContext({ viewport: device.viewport });
      await instrumentContext(context);
      const page = await context.newPage();
      await openBookingRoute(page, patientPathUrl(patientBaseUrl, "appointmentsWorkspace"));
      const startedAt = performance.now();
      await page.getByTestId("booking-primary-action").click();
      await page.waitForFunction(() => {
        return (
          document
            .querySelector("[data-testid='Patient_Booking_Workspace_Route']")
            ?.getAttribute("data-route-key") === "select"
        );
      });
      await page.getByTestId("offer-selection-responsive-stage").waitFor();
      const interactionMs = performance.now() - startedAt;
      const metrics = await readWebMetrics(page);
      await context.close();
      return {
        actorClass: device.actorClass,
        deviceClass: device.deviceClass,
        interactionMs: Number(interactionMs.toFixed(2)),
        metrics,
        runId: index,
      } as ScenarioRun & { readonly runId: number };
    }),
  );
}

async function runConfirmationChurn(
  browser: any,
  patientBaseUrl: string,
): Promise<readonly ScenarioRun[]> {
  const journeys = [
    { deviceClass: "desktop" as const, viewport: { width: 1440, height: 1080 } },
    { deviceClass: "desktop" as const, viewport: { width: 1280, height: 960 } },
    { deviceClass: "tablet" as const, viewport: { width: 1024, height: 1180 } },
    { deviceClass: "tablet" as const, viewport: { width: 900, height: 1100 } },
    { deviceClass: "mobile" as const, viewport: { width: 430, height: 932 } },
    { deviceClass: "mobile" as const, viewport: { width: 390, height: 844 } },
  ];

  return await Promise.all(
    journeys.map(async (journey) => {
      const context = await browser.newContext({ viewport: journey.viewport });
      await instrumentContext(context);
      const page = await context.newPage();
      await openBookingRoute(page, patientPathUrl(patientBaseUrl, "confirmationPending"));
      const startedAt = performance.now();
      await openBookingRoute(page, patientPathUrl(patientBaseUrl, "confirmationConfirmed"));
      await page.getByTestId("booking-confirmation-stage").waitFor();
      const interactionMs = performance.now() - startedAt;
      const metrics = await readWebMetrics(page);
      await context.close();
      return {
        actorClass: "patient",
        deviceClass: journey.deviceClass,
        interactionMs: Number(interactionMs.toFixed(2)),
        metrics,
      } as ScenarioRun;
    }),
  );
}

async function runMultiUserActivity(
  browser: any,
  patientBaseUrl: string,
  staffBaseUrl: string,
): Promise<readonly ScenarioRun[]> {
  const patientRuns = Array.from({ length: 4 }, async (_, index) => {
    const viewport = index % 2 === 0 ? { width: 1440, height: 1080 } : { width: 430, height: 932 };
    const deviceClass = index % 2 === 0 ? "desktop" : "mobile";
    const context = await browser.newContext({ viewport });
    await instrumentContext(context);
    const page = await context.newPage();
    await openBookingRoute(page, patientPathUrl(patientBaseUrl, "selection"));
    const startedAt = performance.now();
    if ((await page.getByTestId("booking-slot-continue").count()) > 0) {
      await page.getByTestId("booking-slot-continue").click();
    } else {
      await page.getByTestId("sticky-confirm-continue").click();
    }
    await page.waitForFunction(() => {
      return (
        document
          .querySelector("[data-testid='Patient_Booking_Workspace_Route']")
          ?.getAttribute("data-route-key") === "confirm"
      );
    });
    await page.getByTestId("booking-confirmation-stage").waitFor();
    const interactionMs = performance.now() - startedAt;
    const metrics = await readWebMetrics(page);
    await context.close();
    return {
      actorClass: "patient" as const,
      deviceClass,
      interactionMs: Number(interactionMs.toFixed(2)),
      metrics,
    };
  });

  const staffRuns = Array.from({ length: 4 }, async (_, index) => {
    const viewport = index % 2 === 0 ? { width: 1440, height: 1080 } : { width: 1280, height: 900 };
    const deviceClass = index % 2 === 0 ? "desktop" : "tablet";
    const context = await browser.newContext({ viewport });
    await instrumentContext(context);
    const page = await context.newPage();
    await openStaffBookingRoute(page, staffBaseUrl, "/workspace/bookings");
    const startedAt = performance.now();
    await page.getByTestId("booking-compare-slot-slot_299_compare_1530").click();
    await page.getByTestId("AssistedSlotCompareStage").waitFor();
    const interactionMs = performance.now() - startedAt;
    const metrics = await readWebMetrics(page);
    await context.close();
    return {
      actorClass: "staff" as const,
      deviceClass,
      interactionMs: Number(interactionMs.toFixed(2)),
      metrics,
    };
  });

  return await Promise.all([...patientRuns, ...staffRuns]);
}

export async function runLocalBookingLoadProbe(): Promise<LocalBookingLoadProbeResult> {
  const playwright = await importPlaywright();
  if (!playwright) {
    throw new Error("Playwright is required for the 309 load probe");
  }

  const apps = await startLocalBookingApps();
  const browser = await playwright.chromium.launch({ headless: true });
  const budgets = { lcpMs: 2500, interactionMs: 200, cls: 0.1 };

  try {
    const slotSearchBurst = aggregateScenario(
      "slot_search_burst",
      "Concurrent patient launch-to-selection transitions",
      6,
      await runSlotSearchBurst(browser, apps.patientBaseUrl),
      budgets,
    );
    const confirmationChurn = aggregateScenario(
      "confirmation_churn",
      "Concurrent patient confirmation-state transitions",
      6,
      await runConfirmationChurn(browser, apps.patientBaseUrl),
      budgets,
    );
    const multiUserActivity = aggregateScenario(
      "multi_user_activity",
      "Concurrent patient and staff booking activity",
      8,
      await runMultiUserActivity(browser, apps.patientBaseUrl, apps.staffBaseUrl),
      budgets,
    );

    const result: LocalBookingLoadProbeResult = {
      status: [slotSearchBurst, confirmationChurn, multiUserActivity].every(
        (scenario) => scenario.status === "passed",
      )
        ? "passed"
        : "failed",
      generatedAt: new Date().toISOString(),
      budgets,
      scenarios: [slotSearchBurst, confirmationChurn, multiUserActivity],
    };

    fs.writeFileSync(
      outputPath("309-phase4-local-booking-load-probe.json"),
      `${JSON.stringify(result, null, 2)}\n`,
      "utf-8",
    );
    return result;
  } finally {
    await browser.close();
    await stopLocalBookingApps(apps);
  }
}

if (process.argv.includes("--run")) {
  runLocalBookingLoadProbe()
    .then((result) => {
      console.log(JSON.stringify(result, null, 2));
    })
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
