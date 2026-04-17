import { describe, expect, it } from "vitest";
import {
  automationAnchorMatrixRows,
  automationTelemetryCatalog,
  buildAutomationAndUiTelemetryArtifacts,
  buildAutomationSurfaceAttributes,
  createUiTelemetryEnvelope,
  filterPhiSafeDisclosure,
  resolveAutomationAnchorProfile,
  resolveSharedMarkerSelector,
  uiEventEnvelopeExamplesArtifact,
  uiTelemetryVocabularyArtifact,
} from "../src/automation-telemetry";

describe("automation anchor and ui telemetry vocabulary", () => {
  it("resolves route-family anchor profiles from the published kernel tuple", () => {
    const profile = resolveAutomationAnchorProfile("rf_patient_home");

    expect(profile.automationAnchorProfileId).toBe("AAP_050_RF_PATIENT_HOME_V1");
    expect(profile.profileState).toBe("exact");
    expect(profile.markerBindings).toHaveLength(9);
    expect(profile.requiredUiEventRefs).toHaveLength(4);
    expect(profile.supplementalUiEventRefs).toHaveLength(3);
    expect(profile.selectedAnchorRef).toBe("marker.rf_patient_home.selected_anchor");
    expect(profile.focusRestoreRef).toBe("focus_restore.rf_patient_home.home-spotlight");
    expect(profile.visualizationAuthority).toBe("visual_table_summary");
  });

  it("publishes stable selectors and root attributes for Playwright consumers", () => {
    const profile = resolveAutomationAnchorProfile("rf_support_replay_observe");
    const rootSelector = resolveSharedMarkerSelector("rf_support_replay_observe", "landmark");
    const anchorSelector = resolveSharedMarkerSelector(
      "rf_support_replay_observe",
      "selected_anchor",
    );
    const attrs = buildAutomationSurfaceAttributes(profile, {
      recoveryPosture: "blocked",
      routeShellPosture: "shell_blocked",
    });

    expect(rootSelector).toBe("[data-automation-surface='rf_support_replay_observe']");
    expect(anchorSelector).toContain("[data-automation-anchor-class='selected_anchor']");
    expect(attrs["data-automation-anchor-map-ref"]).toBe(
      "AAM_050_RF_SUPPORT_REPLAY_OBSERVE_V1",
    );
    expect(attrs["data-telemetry-binding-profile-ref"]).toBe(
      "TBP_052_RF_SUPPORT_REPLAY_OBSERVE_V1",
    );
    expect(attrs["data-recovery-posture"]).toBe("blocked");
    expect(attrs["data-route-shell-posture"]).toBe("shell_blocked");
  });

  it("redacts PHI-shaped payload fields while preserving route-safe vocabulary fields", () => {
    const filtered = filterPhiSafeDisclosure({
      routeFamilyRef: "rf_patient_requests",
      selectedAnchorRef: "marker.rf_patient_requests.selected_anchor",
      patientDisplayName: "Alex Example",
      messageExcerpt: "Needs clinical review",
      attachmentFilename: "scan.pdf",
    });

    expect(filtered.disclosureFenceState).toBe("redacted");
    expect(filtered.redactedFields).toEqual([
      "patientDisplayName",
      "messageExcerpt",
      "attachmentFilename",
    ]);
    expect(filtered.payload.routeFamilyRef).toBe("rf_patient_requests");
    expect(filtered.payload.selectedAnchorRef).toBe(
      "marker.rf_patient_requests.selected_anchor",
    );
    expect(filtered.payload.patientDisplayName).toMatch(/^redacted::/);
  });

  it("creates supplemental telemetry envelopes without forking the route prefix", () => {
    const envelope = createUiTelemetryEnvelope({
      scenarioId: "SCN_ROUTE_GUARD_SUPPORT_BLOCKED",
      routeFamilyRef: "rf_support_replay_observe",
      sourceSurface: "route_guard_lab",
      eventClass: "recovery_posture_changed",
      payload: {
        routeFamilyRef: "rf_support_replay_observe",
        recoveryPosture: "blocked",
        patientDisplayName: "Replay subject",
      },
      surfaceState: {
        recoveryPosture: "blocked",
        routeShellPosture: "shell_blocked",
      },
    });

    expect(envelope.eventName).toBe(
      "ui.surface.support_replay_observe.recovery_posture_changed",
    );
    expect(envelope.bindingState).toBe("supplemental_gap_resolution");
    expect(envelope.disclosureFenceState).toBe("redacted");
    expect(envelope.payload.patientDisplayName).toMatch(/^redacted::/);
  });

  it("builds consistent artifacts, matrix rows, and envelope examples", () => {
    const artifacts = buildAutomationAndUiTelemetryArtifacts();

    expect(automationTelemetryCatalog.taskId).toBe("par_114");
    expect(automationTelemetryCatalog.routeProfileCount).toBe(19);
    expect(automationTelemetryCatalog.exactProfileCount).toBe(15);
    expect(automationTelemetryCatalog.provisionalProfileCount).toBe(4);
    expect(artifacts.automationAnchorProfileExamplesArtifact.summary.matrix_row_count).toBe(171);
    expect(automationAnchorMatrixRows).toHaveLength(171);
    expect(uiTelemetryVocabularyArtifact.summary.event_binding_count).toBe(133);
    expect(uiTelemetryVocabularyArtifact.summary.contract_binding_count).toBe(76);
    expect(uiTelemetryVocabularyArtifact.summary.supplemental_binding_count).toBe(57);
    expect(uiEventEnvelopeExamplesArtifact.summary.example_count).toBe(24);
    expect(uiEventEnvelopeExamplesArtifact.summary.redacted_example_count).toBe(24);
    expect(uiEventEnvelopeExamplesArtifact.summary.recovery_event_count).toBe(2);
    expect(uiEventEnvelopeExamplesArtifact.summary.visibility_downgrade_event_count).toBe(2);
    expect(
      new Set(
        artifacts.automationAnchorProfileExamplesArtifact.diagnosticScenarios.map(
          (scenario) => scenario.sourceSurface,
        ),
      ),
    ).toEqual(
      new Set([
        "shell_gallery",
        "status_truth_lab",
        "posture_gallery",
        "route_guard_lab",
        "patient_seed_surrogate",
      ]),
    );
  });
});
