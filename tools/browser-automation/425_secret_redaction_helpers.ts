import type { Page } from "playwright";

import {
  collectTrackedSecretRefs,
  containsSensitiveLeak,
  redactSensitiveText,
} from "../../scripts/assistive/425_model_vendor_project_setup_lib.ts";

export async function redactBrowserText(value: string): Promise<string> {
  return redactSensitiveText(value, collectTrackedSecretRefs());
}

export async function assertSecretSafeText(
  value: string,
  label: string,
): Promise<void> {
  if (containsSensitiveLeak(value, collectTrackedSecretRefs())) {
    throw new Error(`${label} contains a secret locator or raw credential token.`);
  }
}

export async function assertSecretSafePage(
  page: Page,
  label: string,
): Promise<void> {
  await assertSecretSafeText(await page.content(), label);
}

export function safeEvidencePolicy() {
  return {
    isolatedBrowserContext: true,
    recordScreenshotsAfterRedaction: true,
    recordTraceOnlyForRedactedHarness: true,
    allowHar: false,
    allowVideo: false,
  } as const;
}
