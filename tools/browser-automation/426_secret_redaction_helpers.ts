import type { Page } from "playwright";

import {
  collectTrackedSecretRefs,
  containsSensitiveLeak,
  redactSensitiveText,
} from "../../scripts/assistive/426_model_audit_and_safety_lib.ts";

export async function redactBrowserText(value: string): Promise<string> {
  let redacted = redactSensitiveText(value);
  for (const secretRef of collectTrackedSecretRefs()) {
    redacted = redacted.replaceAll(secretRef, "[secret-ref:redacted]");
  }
  return redacted;
}

export async function assertSecretSafeText(
  value: string,
  label: string,
): Promise<void> {
  if (containsSensitiveLeak(value)) {
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
    separateContextPerEnvironment: true,
    recordScreenshotsAfterRedaction: true,
    recordTraceOnlyForRedactedHarness: true,
    allowHar: false,
    allowVideo: false,
    commitStorageState: false,
  } as const;
}

