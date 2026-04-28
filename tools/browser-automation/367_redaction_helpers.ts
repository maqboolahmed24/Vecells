import type { Page } from "playwright";

import {
  collectTrackedSecretRefs,
  containsSensitiveLeak,
  redactSensitiveText,
} from "../../scripts/pharmacy/367_update_record_transport_sandbox_lib.ts";

export async function redactBrowserText(value: string): Promise<string> {
  return redactSensitiveText(value, await collectTrackedSecretRefs());
}

export async function assertSecretSafeText(
  value: string,
  label: string,
): Promise<void> {
  const secretRefs = await collectTrackedSecretRefs();
  if (containsSensitiveLeak(value, secretRefs)) {
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
    recordScreenshotsAfterSecretBoundary: true,
    recordTraceAfterSecretBoundary: true,
    allowHar: false,
  } as const;
}
