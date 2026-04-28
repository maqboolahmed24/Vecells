import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { PatientIntakeMissionFrameApp } from "./patient-intake-mission-frame";

describe("patient intake mission frame", () => {
  it("renders the calm shell anatomy for the landing route", () => {
    const html = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/start-request" />,
    );

    expect(html).toContain('data-testid="patient-intake-mission-frame-root"');
    expect(html).toContain('data-testid="patient-intake-masthead"');
    expect(html).toContain('data-testid="patient-intake-status-strip"');
    expect(html).toContain('data-testid="patient-intake-progress-rail"');
    expect(html).toContain('data-testid="patient-intake-question-canvas"');
    expect(html).toContain('data-testid="patient-intake-summary-panel"');
    expect(html).toContain('data-testid="patient-intake-action-tray"');
    expect(html).toContain("Quiet clarity mission frame");
  });

  it("renders request-type selection without generic wizard chrome", () => {
    const html = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/start-request/dft_7k49m2v8pq41/request-type" />,
    );

    expect(html).toContain('data-testid="patient-intake-request-type-grid"');
    expect(html).toContain('data-testid="request-type-card-Symptoms"');
    expect(html).toContain("What kind of help do you need today?");
    expect(html).not.toContain("wizard");
  });

  it("renders the same-shell urgent frame inside the mission shell instead of a placeholder page", () => {
    const urgentHtml = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/start-request/dft_7k49m2v8pq41/urgent-guidance" />,
    );

    expect(urgentHtml).toContain('data-testid="patient-intake-urgent-step"');
    expect(urgentHtml).toContain('data-testid="urgent-pathway-frame"');
    expect(urgentHtml).toContain('data-testid="urgent-required-pending-settlement-card"');
    expect(urgentHtml).toContain('data-testid="urgent-dominant-action"');
    expect(urgentHtml).toContain('data-shell-continuity-key="patient.portal.requests"');
    expect(urgentHtml).toContain('data-route-family="rf_intake_self_service"');
    expect(urgentHtml).not.toContain("Urgent diversion placeholder");
  });

  it("renders the same-shell receipt frame instead of a detached success placeholder", () => {
    const receiptHtml = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/start-request/dft_7k49m2v8pq41/receipt" />,
    );

    expect(receiptHtml).toContain('data-testid="patient-intake-receipt-step"');
    expect(receiptHtml).toContain('data-testid="receipt-outcome-canvas"');
    expect(receiptHtml).toContain('data-testid="receipt-reference-fact"');
    expect(receiptHtml).toContain('data-testid="receipt-eta-fact"');
    expect(receiptHtml).toContain('data-testid="receipt-track-request-anchor-card"');
    expect(receiptHtml).toContain('data-shell-continuity-key="patient.portal.requests"');
    expect(receiptHtml).not.toContain("Receipt placeholder");
  });

  it("renders the minimal track surface instead of a status placeholder panel", () => {
    const statusHtml = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/intake/requests/req_qc_2049/status" />,
    );

    expect(statusHtml).toContain('data-testid="patient-intake-status-step"');
    expect(statusHtml).toContain('data-testid="track-request-surface"');
    expect(statusHtml).toContain('data-testid="track-request-pulse-header"');
    expect(statusHtml).toContain('data-testid="track-current-state-panel"');
    expect(statusHtml).toContain('data-testid="track-next-steps-timeline"');
    expect(statusHtml).toContain('data-shell-continuity-key="patient.portal.requests"');
    expect(statusHtml).not.toContain("Status placeholder");
  });

  it("renders the progressive question frame with the canonical details question surface", () => {
    const html = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/start-request/dft_7k49m2v8pq41/details" />,
    );

    expect(html).toContain('data-testid="patient-intake-question-stem"');
    expect(html).toContain('data-testid="question-field-symptoms.category"');
    expect(html).toContain('data-testid="patient-intake-reveal-patch-region"');
    expect(html).toContain("What kind of symptom is the main concern?");
  });

  it("renders the governed evidence lane without falling back to a generic widget", () => {
    const html = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/start-request/dft_7k49m2v8pq41/files" />,
    );

    expect(html).toContain('data-testid="patient-intake-evidence-dropzone"');
    expect(html).toContain('data-testid="patient-intake-file-picker-button"');
    expect(html).toContain('data-testid="patient-intake-evidence-card-stack"');
    expect(html).toContain("Files are checked before they are used.");
    expect(html).not.toContain("dropzone plugin");
  });

  it("renders the real contact editor with masked-summary and confirmation-copy surfaces", () => {
    const html = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp initialPathname="/start-request/dft_7k49m2v8pq41/contact" />,
    );

    expect(html).toContain('data-testid="contact-channel-stack"');
    expect(html).toContain('data-testid="contact-route-entry-panel"');
    expect(html).toContain('data-testid="contact-masked-summary-card"');
    expect(html).toContain('data-testid="contact-communication-needs-panel"');
    expect(html).toContain('data-testid="contact-confirmation-copy-preview"');
    expect(html).toContain('data-testid="contact-trust-boundary-note"');
    expect(html).toContain("masked");
    expect(html).toContain("not whether the route is verified");
  });

  it("renders the same-shell read-only return frame instead of exposing editable detail on narrowed auth return", () => {
    const html = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp
        initialPathname="/start-request/dft_7k49m2v8pq41/details"
        initialMemoryOverride={{
          accessSimulation: { scenarioId: "auth_return_read_only" },
        }}
      />,
    );

    expect(html).toContain('data-testid="access-posture-strip"');
    expect(html).toContain('data-testid="read-only-return-frame"');
    expect(html).toContain('data-testid="access-posture-summary-card"');
    expect(html).toContain("editing is paused");
    expect(html).not.toContain('data-testid="question-field-symptoms.category"');
  });

  it("renders the stale draft mapping notice inside the authoritative receipt shell", () => {
    const html = renderToStaticMarkup(
      <PatientIntakeMissionFrameApp
        initialPathname="/start-request/dft_7k49m2v8pq41/receipt"
        initialMemoryOverride={{
          accessSimulation: { scenarioId: "stale_draft_promoted" },
        }}
      />,
    );

    expect(html).toContain('data-testid="stale-draft-notice"');
    expect(html).toContain('data-testid="receipt-outcome-canvas"');
    expect(html).toContain("authoritative request shell");
  });
});
