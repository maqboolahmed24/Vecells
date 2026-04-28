import type { Page } from "playwright";

import {
  redactSensitiveText,
  redactUrl,
  type EvidenceRedactionClass,
} from "../../services/command-api/src/phase7-nhs-app-onboarding-service.ts";

const SENSITIVE_PATTERNS = [
  /assertedLoginIdentity=(?!%5BREDACTED|\[REDACTED)/iu,
  /asserted_login_identity=(?!%5BREDACTED|\[REDACTED)/iu,
  /access_token=(?!%5BREDACTED|\[REDACTED)/iu,
  /id_token=(?!%5BREDACTED|\[REDACTED)/iu,
  /\bBearer\s+[A-Za-z0-9._~+/=-]{12,}\b/iu,
  /\b[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/u,
  /\bnhs[_\s-]?number\s*[:=]\s*[0-9 ]{10,13}\b/iu,
  /\b(patientId|patient_id|subjectRef|grantId)\s*[:=]\s*[^&\s,;]+/iu,
] as const;

export function redact396BrowserText(value: string): string {
  return redactSensitiveText(value);
}

export function redact396BrowserUrl(value: string): string {
  return redactUrl(value);
}

export function is396RedactionSafeText(value: string): boolean {
  return SENSITIVE_PATTERNS.every((pattern) => !pattern.test(value));
}

export async function assert396RedactionSafePage(page: Page, label: string): Promise<void> {
  const content = await page.content();
  if (!is396RedactionSafeText(content)) {
    throw new Error(`${label} contains a token, identity assertion, or patient-bearing value.`);
  }
}

export function safe396EvidencePolicy(mode: string): {
  readonly captureScreenshots: boolean;
  readonly captureTrace: boolean;
  readonly allowHar: false;
  readonly allowedRedactionClasses: readonly EvidenceRedactionClass[];
} {
  return {
    captureScreenshots: mode !== "dry-run",
    captureTrace: mode === "capture-evidence",
    allowHar: false,
    allowedRedactionClasses: ["public", "internal", "sensitive", "phi_url"],
  };
}
