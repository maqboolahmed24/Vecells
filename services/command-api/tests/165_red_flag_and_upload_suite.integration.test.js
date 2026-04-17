import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { createIntakeAttachmentApplication } from "../src/intake-attachment.ts";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..", "..", "..");
const CASES_PATH = path.join(ROOT, "data", "test", "165_malicious_upload_cases.csv");

function parseCsv(text) {
  const [headerLine, ...lines] = text.trim().split("\n");
  const headers = headerLine.split(",");
  return lines.map((line) => {
    const values = [];
    let current = "";
    let inQuotes = false;
    for (let index = 0; index < line.length; index += 1) {
      const char = line[index];
      if (char === '"' && line[index + 1] === '"') {
        current += '"';
        index += 1;
      } else if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === "," && !inQuotes) {
        values.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    values.push(current);
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });
}

function expectedList(value) {
  return value ? value.split("|").filter(Boolean) : [];
}

function slug(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function bytesFor(row) {
  return Buffer.from(`seq-165-fixture:${row.case_id}:${row.file_name}`);
}

async function runUploadCase(row, options = {}) {
  const application = options.application ?? createIntakeAttachmentApplication();
  const draftPublicId = options.draftPublicId ?? `draft_165_${slug(row.case_id)}`;
  const checksumSha256 = row.checksum_mode === "matching" ? `checksum_${slug(row.case_id)}` : null;
  const initiated = await application.initiateAttachmentUpload({
    draftPublicId,
    fileName: row.file_name,
    declaredMimeType: row.declared_mime_type,
    byteSize: Number(row.byte_size),
    initiatedAt: "2026-04-15T10:00:00Z",
    checksumSha256,
    clientUploadId: `client_${slug(row.case_id)}`,
    simulatorScenarioId: row.simulator_scenario_id || null,
  });

  const beforePipeline = await application.createArtifactPresentation({
    attachmentPublicId: initiated.attachment.attachmentPublicId,
    action: "download",
    routeFamilyRef: "rf_intake_self_service",
    continuityKey: "patient.portal.requests",
    selectedAnchorRef: "patient.portal.requests.intake.supporting_files",
    returnTargetRef: "return://intake/review-submit",
    requestedAt: "2026-04-15T10:00:01Z",
  });

  const events = [...initiated.events.map((event) => event.eventType)];
  if (initiated.accepted && initiated.uploadSession) {
    const recorded = await application.recordAttachmentUpload({
      uploadSessionId: initiated.uploadSession.uploadSessionId,
      fileName: row.file_name,
      reportedMimeType: row.reported_mime_type,
      bytes: bytesFor(row),
      checksumSha256: row.checksum_mode === "mismatched" ? "wrong_checksum" : null,
      uploadedAt: "2026-04-15T10:00:02Z",
    });
    events.push(...recorded.events.map((event) => event.eventType));
    const worker = await application.runAttachmentWorker({
      now: "2026-04-15T10:00:03Z",
    });
    events.push(...worker.events.map((event) => event.eventType));
  }

  const attachment = await application.attachments.getAttachment(
    initiated.attachment.attachmentPublicId,
  );
  const projection = await application.listDraftAttachmentProjection(draftPublicId);
  const states = await application.buildSubmissionAttachmentStates(draftPublicId);
  const afterPipeline = await application.createArtifactPresentation({
    attachmentPublicId: initiated.attachment.attachmentPublicId,
    action: "download",
    routeFamilyRef: "rf_intake_self_service",
    continuityKey: "patient.portal.requests",
    selectedAnchorRef: "patient.portal.requests.intake.supporting_files",
    returnTargetRef: "return://intake/review-submit",
    requestedAt: "2026-04-15T10:00:06Z",
  });

  return {
    application,
    draftPublicId,
    initiated,
    attachment,
    projection,
    states,
    beforePipeline,
    afterPipeline,
    events,
  };
}

const rows = parseCsv(fs.readFileSync(CASES_PATH, "utf8"));
const ordinaryRows = rows.filter((row) => !["duplicate", "mixed_batch"].includes(row.case_family));

describe("seq_165 malicious upload and quarantine suite", () => {
  it.each(ordinaryRows)("$case_id follows the expected attachment policy posture", async (row) => {
    const result = await runUploadCase(row);
    const state = result.states.find(
      (candidate) => candidate.attachmentRef === result.initiated.attachment.attachmentPublicId,
    );

    expect(result.initiated.accepted).toBe(row.expected_initiate_accepted === "true");
    expect(result.beforePipeline.contract.previewPolicy).toBe("hidden");
    expect(result.beforePipeline.contract.downloadPolicy).toBe("forbidden");
    expect(result.beforePipeline.grant).toBeNull();
    expect(row.expected_trusted_before_pipeline).toBe("false");

    expect(result.attachment?.lifecycleState).toBe(row.expected_lifecycle_state);
    expect(result.attachment?.classificationOutcome ?? "").toBe(
      row.expected_classification_outcome,
    );
    expect(result.attachment?.quarantineState).toBe(row.expected_quarantine_state);
    expect(result.attachment?.currentSafeMode).toBe(row.expected_current_safe_mode);
    expect(result.attachment?.documentReferenceState).toBe(row.expected_document_reference_state);
    expect(state?.submitDisposition).toBe(row.expected_submit_disposition);
    expect(result.events).toEqual(expectedList(row.expected_event_chain));
    expect(result.afterPipeline.contract.previewPolicy).toBe(row.expected_preview_policy);
    expect(result.afterPipeline.contract.downloadPolicy).toBe(row.expected_download_policy);
    expect(Boolean(result.afterPipeline.grant)).toBe(row.expected_grant_allowed === "true");

    if (row.expected_grant_allowed === "true") {
      expect(result.afterPipeline.grant?.scrubbedDestination).toMatch(
        /^artifact:\/\/attachment-grant\//,
      );
    } else {
      expect(result.afterPipeline.grant).toBeNull();
      expect(row.expected_submit_disposition).not.toBe("routine_submit_allowed");
    }

    if (row.expected_fallback_review_open === "true") {
      expect(row.expected_patient_continuity_posture).not.toBe("safe_preview_ready");
      expect(state?.submitDisposition).not.toBe("routine_submit_allowed");
    }
  });

  it("replays duplicate uploads to the existing attachment lineage", async () => {
    const row = rows.find((candidate) => candidate.case_id === "UP165_DUPLICATE_REPLAY");
    expect(row).toBeDefined();
    const application = createIntakeAttachmentApplication();
    const first = await runUploadCase(row, {
      application,
      draftPublicId: "draft_165_duplicate_replay",
    });
    const replay = await application.initiateAttachmentUpload({
      draftPublicId: "draft_165_duplicate_replay",
      fileName: row.file_name,
      declaredMimeType: row.declared_mime_type,
      byteSize: Number(row.byte_size),
      initiatedAt: "2026-04-15T10:01:00Z",
      checksumSha256: "checksum_up165_duplicate_replay",
      clientUploadId: "duplicate_second_attempt",
      simulatorScenarioId: row.simulator_scenario_id,
    });

    expect(first.attachment?.lifecycleState).toBe("promoted");
    expect(replay.duplicateReplayOfAttachmentPublicId).toBe(
      first.initiated.attachment.attachmentPublicId,
    );
    expect(replay.events).toEqual([]);
  });

  it("blocks calm routine continuation when one unsafe upload appears in a mixed batch", async () => {
    const safeRow = rows.find((candidate) => candidate.case_id === "UP165_SAFE_PDF");
    const unsafeRow = rows.find((candidate) => candidate.case_id === "UP165_MIXED_BATCH_UNSAFE");
    expect(safeRow).toBeDefined();
    expect(unsafeRow).toBeDefined();
    const application = createIntakeAttachmentApplication();
    const draftPublicId = "draft_165_mixed_batch";

    await runUploadCase(safeRow, { application, draftPublicId });
    const unsafe = await runUploadCase(unsafeRow, { application, draftPublicId });
    const states = await application.buildSubmissionAttachmentStates(draftPublicId);

    expect(unsafe.attachment?.classificationOutcome).toBe("quarantined_malware");
    expect(states.some((state) => state.submitDisposition === "routine_submit_allowed")).toBe(true);
    expect(states.every((state) => state.submitDisposition === "routine_submit_allowed")).toBe(
      false,
    );
    expect(
      states.some((state) => state.submitDisposition === "replace_or_remove_then_review"),
    ).toBe(true);
  });
});
