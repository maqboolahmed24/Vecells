import fs from "node:fs";
import http from "node:http";
import path from "node:path";

import {
  ROOT,
  allocatePort,
  assertCondition,
  assertNoHorizontalOverflow,
  importPlaywright,
  outputPath,
  startClinicalWorkspace,
  stopClinicalWorkspace,
  trackExternalRequests,
  wait,
  writeAccessibilitySnapshot,
} from "./255_workspace_shell_helpers.ts";
import {
  captureAriaTree,
  startTracedContext,
  stopTrace,
  writeWorkspaceAriaSnapshots,
} from "./276_workspace_hardening.helpers.ts";

export const WORKSPACE_BOOKINGS_ROUTE_SELECTOR =
  "[data-testid='WorkspaceBookingsRoute'][data-shell='staff-booking']";
export const DEFAULT_BOOKING_CASE_ID = "booking_case_299_compare_live";

function contentTypeFor(filePath: string): string {
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  if (filePath.endsWith(".json")) return "application/json; charset=utf-8";
  if (filePath.endsWith(".csv")) return "text/csv; charset=utf-8";
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".mmd")) return "text/plain; charset=utf-8";
  return "text/plain; charset=utf-8";
}

export async function startStaticAtlasServer(atlasPath: string): Promise<{
  server: http.Server;
  atlasUrl: string;
}> {
  const port = await allocatePort();
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || "/", "http://127.0.0.1");
    const pathname = requestUrl.pathname === "/" ? atlasPath : decodeURIComponent(requestUrl.pathname);
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
    server,
    atlasUrl: `http://127.0.0.1:${port}${atlasPath}`,
  };
}

export async function closeAtlasServer(server: http.Server): Promise<void> {
  await new Promise<void>((resolve, reject) =>
    server.close((error) => (error ? reject(error) : resolve())),
  );
}

export async function openStaffBookingRoute(
  page: any,
  baseUrl: string,
  relativePath: string,
): Promise<void> {
  const routePath = relativePath.split("?")[0] ?? relativePath;
  const bookingCaseId =
    routePath === "/workspace/bookings"
      ? DEFAULT_BOOKING_CASE_ID
      : decodeURIComponent(routePath.split("/").filter(Boolean).at(-1) ?? DEFAULT_BOOKING_CASE_ID);
  await page.goto(`${baseUrl}${relativePath}`, { waitUntil: "networkidle" });
  await page.locator("[data-testid='WorkspaceShellRouteFamily']").waitFor();
  await page.locator(WORKSPACE_BOOKINGS_ROUTE_SELECTOR).waitFor();
  await waitForStaffBookingCase(page, bookingCaseId);
}

export async function waitForStaffBookingCase(page: any, bookingCaseId: string): Promise<void> {
  await page.waitForFunction(
    ([selector, expectedBookingCaseId]) =>
      document.querySelector(selector)?.getAttribute("data-booking-case") === expectedBookingCaseId,
    [WORKSPACE_BOOKINGS_ROUTE_SELECTOR, bookingCaseId],
  );
}

export {
  ROOT,
  assertCondition,
  assertNoHorizontalOverflow,
  captureAriaTree,
  importPlaywright,
  outputPath,
  startClinicalWorkspace,
  startTracedContext,
  stopClinicalWorkspace,
  stopTrace,
  trackExternalRequests,
  wait,
  writeAccessibilitySnapshot,
  writeWorkspaceAriaSnapshots,
};
