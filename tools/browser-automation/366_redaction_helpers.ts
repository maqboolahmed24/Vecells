import type { Page } from "playwright";

import {
  buildSecretReferenceManifest,
  containsSecretLeak,
  redactSensitiveText,
} from "../../scripts/pharmacy/366_directory_dispatch_credentials_lib.ts";

export async function redactBrowserText(value: string): Promise<string> {
  return redactSensitiveText(value, await buildSecretReferenceManifest());
}

export async function assertSecretSafeText(
  value: string,
  label: string,
): Promise<void> {
  const secretManifest = await buildSecretReferenceManifest();
  if (containsSecretLeak(value, secretManifest)) {
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
