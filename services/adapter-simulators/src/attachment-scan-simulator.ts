import {
  type AttachmentScannerAdapter,
  type AttachmentScannerInput,
  type AttachmentScannerResult,
} from "../../../packages/domains/intake_request/src/attachment-pipeline";
import { phase1AttachmentAcceptancePolicy } from "../../../packages/domains/intake_request/src/attachment-policy";

export type AttachmentScanScenarioId =
  | "clean"
  | "preview_failure"
  | "malware_positive"
  | "mime_spoof"
  | "timeout_retryable"
  | "integrity_failure"
  | "unreadable";

export interface AttachmentScanScenario {
  scenarioId: AttachmentScanScenarioId;
  label: string;
  verdict: AttachmentScannerResult["verdict"];
  reasonCodes: readonly string[];
}

export const attachmentScanScenarios = {
  clean: {
    scenarioId: "clean",
    label: "Clean safe attachment",
    verdict: "clean",
    reasonCodes: [],
  },
  preview_failure: {
    scenarioId: "preview_failure",
    label: "Clean attachment with derivative failure",
    verdict: "clean",
    reasonCodes: [],
  },
  malware_positive: {
    scenarioId: "malware_positive",
    label: "Malware detected",
    verdict: "malware",
    reasonCodes: ["ATTACH_REASON_MALWARE_DETECTED"],
  },
  mime_spoof: {
    scenarioId: "mime_spoof",
    label: "MIME spoof or unsupported type",
    verdict: "unsupported_type",
    reasonCodes: ["ATTACH_REASON_UNSUPPORTED_MIME"],
  },
  timeout_retryable: {
    scenarioId: "timeout_retryable",
    label: "Scanner timeout",
    verdict: "timeout_retryable",
    reasonCodes: ["ATTACH_REASON_SCAN_TIMEOUT"],
  },
  integrity_failure: {
    scenarioId: "integrity_failure",
    label: "Checksum integrity failure",
    verdict: "integrity_failure",
    reasonCodes: ["ATTACH_REASON_INTEGRITY_FAILURE"],
  },
  unreadable: {
    scenarioId: "unreadable",
    label: "Unreadable payload",
    verdict: "unreadable",
    reasonCodes: ["ATTACH_REASON_UNREADABLE_PAYLOAD"],
  },
} as const satisfies Record<AttachmentScanScenarioId, AttachmentScanScenario>;

function defaultScenario(input: AttachmentScannerInput): AttachmentScanScenario {
  if (input.byteSize > phase1AttachmentAcceptancePolicy.maxAcceptedBytes) {
    return {
      scenarioId: "mime_spoof",
      label: "Oversized payload",
      verdict: "size_exceeded",
      reasonCodes: ["ATTACH_REASON_SIZE_EXCEEDED"],
    };
  }
  if (input.suppliedChecksumSha256 && input.suppliedChecksumSha256 !== input.checksumSha256) {
    return attachmentScanScenarios.integrity_failure;
  }
  const declaredMime = input.declaredMimeType.toLowerCase();
  const detectedMime = input.detectedMimeType.toLowerCase();
  if (declaredMime !== detectedMime) {
    return attachmentScanScenarios.mime_spoof;
  }
  return attachmentScanScenarios.clean;
}

export function createAttachmentScanSimulator(): AttachmentScannerAdapter {
  return {
    async scanAttachment(input: AttachmentScannerInput): Promise<AttachmentScannerResult> {
      const scenario =
        (input.simulatorScenarioId
          ? attachmentScanScenarios[input.simulatorScenarioId as AttachmentScanScenarioId]
          : undefined) ?? defaultScenario(input);
      return {
        scannerRef: "ADP_MALWARE_ARTIFACT_SCANNING_SIMULATOR_V1",
        scenarioId: scenario.scenarioId,
        verdict: scenario.verdict,
        detectedMimeType: input.detectedMimeType,
        reasonCodes: scenario.reasonCodes,
        settledAt: new Date(Date.parse(input.startedAt) + 2_000).toISOString(),
      };
    },
  };
}
