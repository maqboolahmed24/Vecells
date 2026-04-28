import fs from "node:fs";
import path from "node:path";

import {
  buildNavigationContract,
  createFakeNhsAppApi,
  createLiveEligibility,
  createNhsAppBridgeRuntime,
  createOutboundNavigationGrant,
  renderBridgeDiagnosticsHtml,
  type AppPageDestination,
  type NhsAppBridgeRuntime,
  type NhsAppPlatform,
  type OutboundDestinationClass,
} from "../../packages/nhs-app-bridge-runtime/src/index.ts";

export const MANIFEST_381 = "nhsapp-manifest-v0.1.0-freeze-374";

export function assertCondition(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export async function importPlaywright() {
  try {
    return await import("playwright");
  } catch {
    console.warn("Playwright is not installed; skipping 381 browser proof.");
    return null;
  }
}

export function outputPath(fileName: string): string {
  const outputDir = path.join(process.cwd(), "output", "playwright");
  fs.mkdirSync(outputDir, { recursive: true });
  return path.join(outputDir, fileName);
}

export function makeBridgeFixture(input?: {
  readonly platform?: NhsAppPlatform;
  readonly missingMethods?: readonly Parameters<typeof createFakeNhsAppApi>[0]["missingMethods"];
  readonly routeObservedAt?: string;
  readonly eligibilityState?: Parameters<typeof createLiveEligibility>[0]["eligibilityState"];
}): {
  readonly bridge: NhsAppBridgeRuntime;
  readonly fakeApi: ReturnType<typeof createFakeNhsAppApi>;
} {
  const navigationContract = buildNavigationContract({
    routeId: "jp_manage_local_appointment",
    manifestVersionRef: MANIFEST_381,
    patientEmbeddedNavEligibilityRef: "PatientEmbeddedNavEligibility:381-playwright",
    routeFreezeDispositionRef: "RouteFreezeDisposition:381-playwright",
    continuityEvidenceRef: "ContinuityEvidence:381-playwright",
  });
  const eligibility = createLiveEligibility({
    journeyPathRef: "jp_manage_local_appointment",
    routeFamilyRef: "appointment_manage",
    manifestVersionRef: MANIFEST_381,
    eligibilityState: input?.eligibilityState ?? "live",
  });
  const fakeApi = createFakeNhsAppApi({
    platform: input?.platform ?? "ios",
    missingMethods: input?.missingMethods ?? [],
  });
  const bridge = createNhsAppBridgeRuntime({
    api: input?.platform === "none" ? null : fakeApi,
    channelContextRef: "ChannelContext:381-playwright",
    patientEmbeddedSessionProjectionRef: "PatientEmbeddedSessionProjection:381-playwright",
    navigationContract,
    eligibility,
    selectedAnchorRef: "SelectedAnchor:appointment-381",
  });
  return { bridge, fakeApi };
}

export function makeGrant(
  bridge: NhsAppBridgeRuntime,
  input: {
    readonly destinationClass: OutboundDestinationClass;
    readonly scrubbedUrlRef?: string;
    readonly appDestination?: AppPageDestination | null;
    readonly allowedHostRef?: string | null;
    readonly allowedPathPattern?: string | null;
  },
) {
  return createOutboundNavigationGrant({
    routeFamilyRef: bridge.navigationContract.routeFamilyRef,
    destinationClass: input.destinationClass,
    scrubbedUrlRef: input.scrubbedUrlRef,
    appDestination: input.appDestination,
    allowedHostRef: input.allowedHostRef,
    allowedPathPattern: input.allowedPathPattern,
    selectedAnchorRef: "SelectedAnchor:appointment-381",
    bridgeCapabilityMatrixRef: bridge.matrix.matrixId,
    patientEmbeddedNavEligibilityRef: bridge.eligibility.embeddedNavEligibilityId,
    manifestVersionRef: bridge.navigationContract.manifestVersionRef,
  });
}

export async function renderDiagnostics(page: any, bridge: NhsAppBridgeRuntime): Promise<void> {
  await page.setContent(renderBridgeDiagnosticsHtml(bridge.snapshot()), {
    waitUntil: "domcontentloaded",
  });
  await page.locator("[data-testid='bridge-diagnostics-root']").waitFor();
}
