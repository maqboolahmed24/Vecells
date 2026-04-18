import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_QUERY_SURFACES,
  PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SCHEMA_VERSION,
  PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SERVICE_NAME,
  createPhase3PatientWorkspaceConversationMergeApplication,
  phase3PatientWorkspaceConversationMergeRoutes,
} from "../src/phase3-patient-workspace-conversation-merge.ts";

describe("phase3 patient/workspace conversation merge", () => {
  it("publishes the documented route and query surfaces", () => {
    const routeIds = new Set(serviceDefinition.routeCatalog.map((route) => route.routeId));

    expect(routeIds.has("workspace_task_phase3_patient_workspace_conversation_current")).toBe(true);
    expect(routeIds.has("patient_request_phase3_workspace_conversation_current")).toBe(true);
    expect(routeIds.has("patient_message_cluster_phase3_workspace_conversation_current")).toBe(true);
  });

  it("resolves the more-info and message lineage from the same bundle", async () => {
    const application = createPhase3PatientWorkspaceConversationMergeApplication();

    expect(application.serviceName).toBe(PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SERVICE_NAME);
    expect(application.schemaVersion).toBe(
      PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SCHEMA_VERSION,
    );
    expect(application.querySurfaces).toEqual(
      PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_QUERY_SURFACES,
    );
    expect(application.routes).toEqual(phase3PatientWorkspaceConversationMergeRoutes);

    const taskBundle = await application.queryTaskConversationMerge({
      taskId: "task-311",
      routeKey: "conversation_more_info",
    });
    const requestBundle = await application.queryRequestConversationMerge({
      requestRef: "request_211_a",
      routeKey: "conversation_messages",
    });

    expect(taskBundle.requestRef).toBe("request_211_a");
    expect(taskBundle.moreInfoCycleRef).toBe("cycle_216_dermatology_photo");
    expect(taskBundle.replyWindowCheckpointRef).toBe("checkpoint_216_open");
    expect(requestBundle.clusterRef).toBe("cluster_214_derm");
    expect(requestBundle.threadId).toBe("thread_214_primary");
    expect(requestBundle.evidenceDeltaPacketRef).toBe(taskBundle.evidenceDeltaPacketRef);
  });

  it("keeps callback repair bound to the patient request and cluster lineage", async () => {
    const application = createPhase3PatientWorkspaceConversationMergeApplication();
    const requestBundle = await application.queryRequestConversationMerge({
      requestRef: "request_215_callback",
      routeKey: "conversation_callback",
      scenario: "repair",
    });
    const clusterBundle = await application.queryClusterConversationMerge({
      clusterId: "cluster_214_callback",
      routeKey: "conversation_messages",
      scenario: "blocked",
    });

    expect(requestBundle.taskId).toBe("task-412");
    expect(requestBundle.routeRefs.callback).toBe(
      "/requests/request_215_callback/conversation/callback",
    );
    expect(requestBundle.parity.repairPosture).toBe("required");
    expect(clusterBundle.requestRef).toBe("request_215_callback");
    expect(clusterBundle.secureLinkAccessState).toBe("step_up_required");
    expect(clusterBundle.routeRefs.messageCluster).toBe("/messages/cluster_214_callback");
  });
});
