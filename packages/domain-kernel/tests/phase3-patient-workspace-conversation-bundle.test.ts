import { describe, expect, it } from "vitest";
import {
  listPhase3PatientWorkspaceConversationClusterRefs,
  listPhase3PatientWorkspaceConversationRequestRefs,
  listPhase3PatientWorkspaceConversationTaskIds,
  makePhase3PatientWorkspaceConversationParityTupleHash,
  resolvePhase3PatientWorkspaceConversationBundleByClusterRef,
  resolvePhase3PatientWorkspaceConversationBundleByRequestRef,
  resolvePhase3PatientWorkspaceConversationBundleByTaskId,
  tryResolvePhase3PatientWorkspaceConversationBundle,
} from "../src/index.ts";

describe("phase3 patient/workspace conversation bundle", () => {
  it("resolves the more-info lineage from the staff task id", () => {
    const bundle = resolvePhase3PatientWorkspaceConversationBundleByTaskId({
      taskId: "task-311",
      routeKey: "conversation_more_info",
    });

    expect(bundle.requestRef).toBe("request_211_a");
    expect(bundle.clusterRef).toBe("cluster_214_derm");
    expect(bundle.replyWindowCheckpointRef).toBe("checkpoint_216_open");
    expect(bundle.routeRefs.moreInfo).toBe("/requests/request_211_a/conversation/more-info");
    expect(bundle.parity.replyEligibilityState).toBe("answerable");
    expect(bundle.staffParity.moreInfoStageState).toBe("awaiting_patient_reply");
  });

  it("resolves the callback repair lineage from the patient request ref", () => {
    const bundle = resolvePhase3PatientWorkspaceConversationBundleByRequestRef({
      requestRef: "request_215_callback",
      routeKey: "conversation_callback",
      scenario: "repair",
    });

    expect(bundle.taskId).toBe("task-412");
    expect(bundle.clusterRef).toBe("cluster_214_callback");
    expect(bundle.routeRefs.messageRepair).toBe("/messages/cluster_214_callback/repair");
    expect(bundle.parity.repairPosture).toBe("required");
    expect(bundle.parity.dominantNextActionRef).toBe("repair_contact_route");
  });

  it("resolves the same lineage from the message cluster ref", () => {
    const bundle = resolvePhase3PatientWorkspaceConversationBundleByClusterRef({
      clusterRef: "cluster_214_callback",
      routeKey: "conversation_messages",
      scenario: "blocked",
    });

    expect(bundle.requestRef).toBe("request_215_callback");
    expect(bundle.secureLinkAccessState).toBe("step_up_required");
    expect(bundle.parity.deliveryPosture).toBe("step_up_required");
    expect(bundle.staffParity.resumePosture).toBe("delta_first");
  });

  it("keeps lookup helpers and parity hashes stable", () => {
    expect(listPhase3PatientWorkspaceConversationTaskIds()).toEqual(["task-311", "task-412"]);
    expect(listPhase3PatientWorkspaceConversationRequestRefs()).toEqual([
      "request_211_a",
      "request_215_callback",
    ]);
    expect(listPhase3PatientWorkspaceConversationClusterRefs()).toEqual([
      "cluster_214_derm",
      "cluster_214_callback",
    ]);

    const bundle = tryResolvePhase3PatientWorkspaceConversationBundle({
      requestRef: "request_211_a",
      routeKey: "conversation_messages",
    });

    expect(bundle).not.toBeNull();
    expect(
      makePhase3PatientWorkspaceConversationParityTupleHash(
        bundle ?? resolvePhase3PatientWorkspaceConversationBundleByTaskId({ taskId: "task-311" }),
      ),
    ).toMatch(/^pwc_271_[0-9a-f]{8}$/);
  });
});
