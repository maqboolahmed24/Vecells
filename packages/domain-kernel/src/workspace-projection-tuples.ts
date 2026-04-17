import { createHash } from "node:crypto";

export type WorkspaceRecoveryAction =
  | "none"
  | "refresh_projection"
  | "repair_anchor"
  | "reacquire_lease"
  | "supervised_takeover"
  | "review_consequence_drift";

export interface WorkspaceTupleHashPart {
  key: string;
  value: string | number | boolean | null | undefined;
}

function normalizeValue(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) {
    return "null";
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value);
}

export function computeWorkspaceTupleHash(parts: readonly WorkspaceTupleHashPart[]): string {
  const canonical = parts
    .map((part) => `${part.key}=${normalizeValue(part.value)}`)
    .sort()
    .join("|");
  return createHash("sha256").update(canonical).digest("hex").slice(0, 24);
}

export function buildWorkspaceEntityContinuityKey(input: {
  requestId: string;
  routeFamilyRef: string;
  selectedAnchorTupleHashRef: string;
}): string {
  return [
    input.requestId.trim(),
    input.routeFamilyRef.trim(),
    input.selectedAnchorTupleHashRef.trim(),
  ].join("::");
}
