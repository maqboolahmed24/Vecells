import { describe, expect, it } from "vitest";
import { serviceDefinition } from "../src/service-definition.ts";
import {
  SUPPORT_LINEAGE_ASSEMBLER_NAME,
  SUPPORT_LINEAGE_FIXTURE_TICKET_ID,
  SUPPORT_LINEAGE_QUERY_SURFACES,
  SUPPORT_SUBJECT_CONTEXT_DISCLOSURE_SERVICE_NAME,
  SUPPORT_SUBJECT_HISTORY_QUERY_SERVICE_NAME,
  SUPPORT_TICKET_WORKSPACE_ASSEMBLER_NAME,
  createSupportLineageTicketSubjectHistoryApplication,
} from "../src/support-lineage-ticket-subject-history.ts";

function baseInput(overrides = {}) {
  return {
    supportTicketId: SUPPORT_LINEAGE_FIXTURE_TICKET_ID,
    requestedByRef: "support_user_218_primary",
    requestedAt: "2026-04-16T14:05:00.000Z",
    ...overrides,
  };
}

describe("Support lineage binding, ticket workspace, and subject history query stack", () => {
  it("publishes the required support query surfaces in the command API route catalog", () => {
    const routeIds = serviceDefinition.routeCatalog.map((route) => route.routeId);
    for (const routeId of [
      "support_ticket_workspace_current",
      "support_ticket_subject_history",
      "support_ticket_subject_360",
      "support_ticket_lineage_scope_members",
      "support_ticket_artifact_provenance",
    ]) {
      expect(routeIds).toContain(routeId);
    }

    const routeText = JSON.stringify(serviceDefinition.routeCatalog);
    for (const marker of [
      "SupportTicketWorkspaceProjection",
      "SupportLineageBinding",
      "SupportLineageScopeMember",
      "SupportLineageArtifactBinding",
      "SupportSubject360Projection",
      "SupportSubjectContextBinding",
      "SupportContextDisclosureRecord",
      "SupportReadOnlyFallbackProjection",
    ]) {
      expect(routeText).toContain(marker);
    }
    expect(SUPPORT_LINEAGE_QUERY_SURFACES).toContain("GET /ops/support/tickets/:supportTicketId");
  });

  it("assembles one ticket workspace over the active SupportLineageBinding canonical join", () => {
    const application = createSupportLineageTicketSubjectHistoryApplication();
    const result =
      application.supportLineageTicketProjectionService.getSupportTicketWorkspace(baseInput());

    expect(SUPPORT_LINEAGE_ASSEMBLER_NAME).toBe("SupportLineageAssembler");
    expect(SUPPORT_TICKET_WORKSPACE_ASSEMBLER_NAME).toBe("SupportTicketWorkspaceAssembler");
    expect(result.supportTicket.projectionName).toBe("SupportTicket");
    expect(result.supportLineageBinding.projectionName).toBe("SupportLineageBinding");
    expect(result.supportTicketWorkspaceProjection.projectionName).toBe(
      "SupportTicketWorkspaceProjection",
    );
    expect(result.supportTicket.supportLineageBindingRef).toBe(
      result.supportLineageBinding.supportLineageBindingId,
    );
    expect(result.supportTicket.supportLineageBindingHash).toBe(
      result.supportLineageBinding.bindingHash,
    );
    expect(result.supportTicketWorkspaceProjection.supportLineageBindingHash).toBe(
      result.supportLineageBinding.bindingHash,
    );
    expect(result.supportTicketWorkspaceProjection.querySurfaceRef).toBe(
      "GET /ops/support/tickets/:supportTicketId",
    );
    expect(result.supportTicketWorkspaceProjection.reasonCodes).toContain(
      "SUPPORT_218_LINEAGE_BINDING_CANONICAL_JOIN",
    );
  });

  it("requires explicit scope members and a single active mutation authority target", () => {
    const application = createSupportLineageTicketSubjectHistoryApplication();
    const result =
      application.supportLineageTicketProjectionService.getSupportTicketWorkspace(baseInput());

    expect(result.supportLineageScopeMembers).toHaveLength(4);
    expect(
      result.supportLineageScopeMembers.every(
        (member) =>
          member.supportLineageBindingRef === result.supportLineageBinding.supportLineageBindingId,
      ),
    ).toBe(true);

    const mutationMembers = result.supportLineageScopeMembers.filter(
      (member) => member.actionability === "governed_mutation" && member.memberState === "active",
    );
    expect(mutationMembers).toHaveLength(1);
    expect(mutationMembers[0].supportLineageScopeMemberId).toBe(
      result.supportLineageBinding.primaryScopeMemberRef,
    );
    expect(result.supportLineageScopeMembers.map((member) => member.memberRole)).toEqual([
      "primary_action_target",
      "communication_context",
      "artifact_provenance",
      "identity_repair_dependency",
    ]);
  });

  it("binds every support-visible artifact summary to SupportLineageArtifactBinding provenance", () => {
    const application = createSupportLineageTicketSubjectHistoryApplication();
    const provenance =
      application.supportLineageTicketProjectionService.getSupportLineageArtifactProvenance(
        baseInput(),
      );

    expect(provenance.artifactBindings).toHaveLength(2);
    for (const artifact of provenance.artifactBindings) {
      expect(artifact.projectionName).toBe("SupportLineageArtifactBinding");
      expect(artifact.supportLineageBindingRef).toBe(
        provenance.supportLineageBinding.supportLineageBindingId,
      );
      expect(artifact.sourceLineageRef).toMatch(/^lineage_/);
      expect(artifact.sourceArtifactRef).toBeTruthy();
      expect(artifact.parityDigestRef).toBeTruthy();
      expect(artifact.bindingState).toBe("active");
    }
  });

  it("keeps SupportSubject360Projection compact, masked, and bound to the subject context binding", () => {
    const application = createSupportLineageTicketSubjectHistoryApplication();
    const result =
      application.supportLineageTicketProjectionService.getSupportTicketWorkspace(baseInput());

    expect(result.subject360Projection.projectionName).toBe("SupportSubject360Projection");
    expect(result.subject360Projection.subjectContextBindingRef).toBe(
      result.subjectContextBinding.subjectContextBindingId,
    );
    expect(result.subject360Projection.maskedSubjectLabel).toBe("Subject ending 214");
    expect(result.subject360Projection.summaryRows).toHaveLength(4);
    expect(JSON.stringify(result.subject360Projection)).not.toContain("full name");
    expect(result.subject360Projection.reasonCodes).toContain(
      "SUPPORT_218_SUBJECT_360_SUMMARY_FIRST",
    );
  });

  it("returns summary-first subject history until a reason-coded disclosure record approves detail", () => {
    const application = createSupportLineageTicketSubjectHistoryApplication();
    const summary =
      application.supportLineageTicketProjectionService.getSupportSubjectHistory(baseInput());
    const detail = application.supportLineageTicketProjectionService.getSupportSubjectHistory(
      baseInput({
        disclosureMode: "bounded_detail",
        disclosureApprovalState: "approved",
        disclosureReasonCode: "SUPPORT_HISTORY_DELIVERY_REPAIR_INVESTIGATION",
      }),
    );

    expect(SUPPORT_SUBJECT_HISTORY_QUERY_SERVICE_NAME).toBe("SupportSubjectHistoryQueryService");
    expect(SUPPORT_SUBJECT_CONTEXT_DISCLOSURE_SERVICE_NAME).toBe(
      "SupportSubjectContextDisclosureService",
    );
    expect(summary.query.projectionName).toBe("SupportSubjectHistoryQuery");
    expect(summary.subjectContextBinding.projectionName).toBe("SupportSubjectContextBinding");
    expect(summary.disclosureRecord.projectionName).toBe("SupportContextDisclosureRecord");
    expect(summary.historyProjection.projectionName).toBe("SupportSubjectHistoryProjection");
    expect(summary.disclosureRecord.approvedMode).toBe("summary_only");
    expect(
      summary.historyProjection.historySlices.every((slice) => slice.boundedDetail === null),
    ).toBe(true);

    expect(detail.disclosureRecord.approvedMode).toBe("bounded_detail");
    expect(detail.disclosureRecord.reasonCode).toBe(
      "SUPPORT_HISTORY_DELIVERY_REPAIR_INVESTIGATION",
    );
    expect(detail.historyProjection.detailedSliceCount).toBeGreaterThan(0);
    expect(
      detail.historyProjection.historySlices.some((slice) =>
        slice.reasonCodes.includes("SUPPORT_218_SUBJECT_HISTORY_DISCLOSURE_GATED"),
      ),
    ).toBe(true);
  });

  it("degrades stale lineage or runtime drift into same-shell read-only fallback", () => {
    const application = createSupportLineageTicketSubjectHistoryApplication();
    const result = application.supportLineageTicketProjectionService.getSupportTicketWorkspace(
      baseInput({ simulateBindingState: "stale" }),
    );

    expect(result.supportLineageBinding.bindingState).toBe("stale");
    expect(result.supportReadOnlyFallbackProjection?.projectionName).toBe(
      "SupportReadOnlyFallbackProjection",
    );
    expect(result.supportTicket.shellMode).toBe("read_only_recovery");
    expect(result.supportTicketWorkspaceProjection.supportReadOnlyFallbackProjectionRef).toBe(
      result.supportReadOnlyFallbackProjection?.supportReadOnlyFallbackProjectionId,
    );
    expect(result.supportTicketWorkspaceProjection.allowedActionRefs).toEqual([
      "support_action_reacquire_lineage_binding_218",
    ]);
    expect(result.supportTicketWorkspaceProjection.reasonCodes).toContain(
      "SUPPORT_218_READ_ONLY_FALLBACK_SAME_SHELL",
    );
  });
});
