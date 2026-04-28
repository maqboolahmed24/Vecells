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

function stableHexDigest(value: string): string {
  let left = 0x811c9dc5;
  let middle = 0x9e3779b9;
  let right = 0xc2b2ae35;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    left = Math.imul(left ^ code, 0x01000193) >>> 0;
    middle = Math.imul(middle ^ (code + index), 0x85ebca6b) >>> 0;
    right = Math.imul(right ^ (code + left), 0x27d4eb2f) >>> 0;
  }
  return [left, middle, right]
    .map((part) => part.toString(16).padStart(8, "0"))
    .join("")
    .slice(0, 24);
}

export function computeWorkspaceTupleHash(parts: readonly WorkspaceTupleHashPart[]): string {
  const canonical = parts
    .map((part) => `${part.key}=${normalizeValue(part.value)}`)
    .sort()
    .join("|");
  return stableHexDigest(canonical);
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
