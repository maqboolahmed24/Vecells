import {
  listPhase3PatientWorkspaceConversationClusterRefs,
  listPhase3PatientWorkspaceConversationRequestRefs,
  listPhase3PatientWorkspaceConversationTaskIds,
  resolvePhase3PatientWorkspaceConversationBundleByClusterRef,
  resolvePhase3PatientWorkspaceConversationBundleByRequestRef,
  resolvePhase3PatientWorkspaceConversationBundleByTaskId,
  type Phase3PatientWorkspaceConversationBundle,
  type Phase3PatientWorkspaceConversationRouteKey,
  type Phase3PatientWorkspaceConversationScenario,
} from "@vecells/domain-kernel";

export const PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SERVICE_NAME =
  "Phase3PatientWorkspaceConversationMergeApplication";
export const PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SCHEMA_VERSION =
  "271.phase3.patient-workspace-conversation-merge.v1";
export const PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_QUERY_SURFACES = [
  "GET /v1/workspace/tasks/{taskId}/patient-workspace-conversation",
  "GET /v1/me/requests/{requestRef}/conversation-merge",
  "GET /v1/me/messages/{clusterId}/conversation-merge",
] as const;

export const phase3PatientWorkspaceConversationMergeRoutes = [
  {
    routeId: "workspace_task_phase3_patient_workspace_conversation_current",
    method: "GET",
    path: "/v1/workspace/tasks/{taskId}/patient-workspace-conversation",
    contractFamily: "Phase3PatientWorkspaceConversationBundleContract",
    purpose:
      "Resolve the shared patient/staff more-info, callback, clinician-message, repair, and continuity bundle for one task lineage.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "patient_request_phase3_workspace_conversation_current",
    method: "GET",
    path: "/v1/me/requests/{requestRef}/conversation-merge",
    contractFamily: "Phase3PatientWorkspaceConversationBundleContract",
    purpose:
      "Resolve the patient conversation child-route bundle from the same canonical lineage that staff actions mutate.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
  {
    routeId: "patient_message_cluster_phase3_workspace_conversation_current",
    method: "GET",
    path: "/v1/me/messages/{clusterId}/conversation-merge",
    contractFamily: "Phase3PatientWorkspaceConversationBundleContract",
    purpose:
      "Resolve the request-linked conversation bundle from a patient message cluster without detaching callback, thread, repair, or return continuity.",
    bodyRequired: false,
    idempotencyRequired: false,
  },
] as const;

export const phase3PatientWorkspaceConversationMergePersistenceTables = [
  "phase3_triage_tasks",
  "phase3_more_info_cycles",
  "phase3_message_threads",
  "phase3_callback_cases",
  "phase3_patient_conversation_clusters",
  "phase3_patient_conversation_threads",
] as const;

export const phase3PatientWorkspaceConversationMergeMigrationPlanRefs = [
  "services/command-api/migrations/112_phase3_more_info_cycle_kernel.sql",
  "services/command-api/migrations/119_phase3_callback_case_domain.sql",
  "services/command-api/migrations/120_phase3_clinician_message_domain.sql",
  "services/command-api/migrations/123_phase3_patient_conversation_tuple_and_visibility.sql",
] as const;

export interface Phase3PatientWorkspaceConversationMergeApplication {
  readonly serviceName: typeof PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SERVICE_NAME;
  readonly schemaVersion: typeof PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SCHEMA_VERSION;
  readonly querySurfaces: typeof PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_QUERY_SURFACES;
  readonly routes: typeof phase3PatientWorkspaceConversationMergeRoutes;
  readonly persistenceTables: readonly string[];
  readonly migrationPlanRefs: readonly string[];
  readonly knownTaskIds: readonly string[];
  readonly knownRequestRefs: readonly string[];
  readonly knownClusterRefs: readonly string[];
  queryTaskConversationMerge(input: {
    taskId: string;
    scenario?: Phase3PatientWorkspaceConversationScenario;
    routeKey?: Phase3PatientWorkspaceConversationRouteKey;
  }): Promise<Phase3PatientWorkspaceConversationBundle>;
  queryRequestConversationMerge(input: {
    requestRef: string;
    scenario?: Phase3PatientWorkspaceConversationScenario;
    routeKey?: Phase3PatientWorkspaceConversationRouteKey;
  }): Promise<Phase3PatientWorkspaceConversationBundle>;
  queryClusterConversationMerge(input: {
    clusterId: string;
    scenario?: Phase3PatientWorkspaceConversationScenario;
    routeKey?: Phase3PatientWorkspaceConversationRouteKey;
  }): Promise<Phase3PatientWorkspaceConversationBundle>;
}

export function createPhase3PatientWorkspaceConversationMergeApplication(): Phase3PatientWorkspaceConversationMergeApplication {
  return {
    serviceName: PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SERVICE_NAME,
    schemaVersion: PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_SCHEMA_VERSION,
    querySurfaces: PHASE3_PATIENT_WORKSPACE_CONVERSATION_MERGE_QUERY_SURFACES,
    routes: phase3PatientWorkspaceConversationMergeRoutes,
    persistenceTables: [...phase3PatientWorkspaceConversationMergePersistenceTables],
    migrationPlanRefs: [...phase3PatientWorkspaceConversationMergeMigrationPlanRefs],
    knownTaskIds: listPhase3PatientWorkspaceConversationTaskIds(),
    knownRequestRefs: listPhase3PatientWorkspaceConversationRequestRefs(),
    knownClusterRefs: listPhase3PatientWorkspaceConversationClusterRefs(),
    async queryTaskConversationMerge(input) {
      return resolvePhase3PatientWorkspaceConversationBundleByTaskId(input);
    },
    async queryRequestConversationMerge(input) {
      return resolvePhase3PatientWorkspaceConversationBundleByRequestRef(input);
    },
    async queryClusterConversationMerge(input) {
      return resolvePhase3PatientWorkspaceConversationBundleByClusterRef({
        clusterRef: input.clusterId,
        scenario: input.scenario,
        routeKey: input.routeKey,
      });
    },
  };
}
