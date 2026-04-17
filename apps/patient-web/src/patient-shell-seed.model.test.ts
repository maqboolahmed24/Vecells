import { createInitialContinuitySnapshot } from "@vecells/persistent-shell";
import { describe, expect, it } from "vitest";
import {
  defaultPatientShellViewMemory,
  parsePatientShellLocation,
  patientShellGalleryRequirements,
  patientShellProjectionExamples,
  resolvePatientShellView,
  selectedAnchorKeyForLocation,
} from "./patient-shell-seed.model";

function snapshotForPath(pathname: string) {
  const memory = defaultPatientShellViewMemory();
  const location = parsePatientShellLocation(pathname);
  return {
    memory,
    location,
    continuitySnapshot: createInitialContinuitySnapshot({
      shellSlug: "patient-web",
      routeFamilyRef: location.routeFamilyRef,
      anchorKey: selectedAnchorKeyForLocation(location, memory.homeMode),
    }),
  };
}

describe("patient shell seed model", () => {
  it("covers all required patient seed routes and gallery requirements", () => {
    expect(patientShellProjectionExamples).toHaveLength(9);
    expect(patientShellProjectionExamples.map((example) => example.routeKey)).toEqual(
      expect.arrayContaining([
        "home",
        "request_detail",
        "appointments",
        "record_follow_up",
        "message_thread",
        "recovery",
        "embedded",
      ]),
    );
    expect(patientShellGalleryRequirements).toContain(
      "selected-anchor persistence, DOM markers, and PHI-safe telemetry",
    );
  });

  it("keeps appointments in read-only posture with mutation authority fenced", () => {
    const view = resolvePatientShellView(snapshotForPath("/appointments"));

    expect(view.guardDecision.effectivePosture).toBe("read_only");
    expect(view.mutationAction.state).toBe("read_only");
    expect(view.statusInput.pendingExternalState).toBe("awaiting_confirmation");
  });

  it("keeps record follow-up summary-first and return-safe", () => {
    const view = resolvePatientShellView(snapshotForPath("/records/REC-HEM-8/follow-up"));

    expect(view.artifactSpecimen?.title).toContain("Ferritin result");
    expect(view.artifactSpecimen?.context.returnTargetLabel).toBe(
      "Back to the record summary list",
    );
    expect(view.artifactSpecimen?.summarySections[0]?.title).toBe("What changed");
  });

  it("suppresses reply reassurance for blocked-contact threads", () => {
    const view = resolvePatientShellView(snapshotForPath("/messages/thread/THR-399"));

    expect(view.messagePosture?.title).toContain("reply posture is bounded");
    expect(view.statusInput.authority.localSignalSuppressionRef).toBe(
      "reply_reassurance_suppressed",
    );
    expect(view.trustCues.some((cue) => cue.includes("Blocked contact posture"))).toBe(true);
  });
});

