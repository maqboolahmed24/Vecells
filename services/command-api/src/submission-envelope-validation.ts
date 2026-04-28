import {
  createDraftAutosaveStore,
  createDraftSessionAutosaveService,
  type DraftAutosaveDependencies,
  type DraftContinuityEvidenceProjectionDocument,
} from "@vecells/domain-identity-access";
import {
  type ContactPreferenceValidationSummary,
  createSubmissionEnvelopeValidationService,
  type SubmissionAttachmentState,
  type SubmissionContactAuthorityPosture,
  type SubmissionEnvelopeValidationInput,
  type SubmissionEnvelopeValidationVerdict,
  type ValidationUrgentDecisionState,
} from "../../../packages/domains/intake_request/src/index";
import { createDeterministicBackboneIdGenerator } from "@vecells/domain-kernel";

export interface SubmissionEnvelopeValidationApplication {
  readonly repositories: DraftAutosaveDependencies;
  readonly drafts: ReturnType<typeof createDraftSessionAutosaveService>;
  readonly validation: ReturnType<typeof createSubmissionEnvelopeValidationService>;
  evaluateDraftValidation(draftPublicId: string): Promise<SubmissionEnvelopeValidationVerdict>;
  evaluateSubmitReadiness(draftPublicId: string): Promise<SubmissionEnvelopeValidationVerdict>;
  seedAttachmentState(state: SubmissionAttachmentState): void;
  seedContactAuthorityPosture(
    draftPublicId: string,
    posture: SubmissionContactAuthorityPosture,
  ): void;
  seedUrgentDecisionState(draftPublicId: string, state: ValidationUrgentDecisionState): void;
  seedConvergenceState(draftPublicId: string, state: "valid" | "invalid"): void;
}

export const submissionEnvelopeValidationProjectionHookRefs = [
  "DraftContinuityEvidenceProjectionDocument",
] as const;

export const submissionEnvelopeValidationPublicEventPolicy = {
  owningSeamRef: "SEAM_143_PUBLIC_JOURNEY_AND_EVENT_SPINE",
  publicEventNames: [] as const,
} as const;

function projectionToValidationInput(
  projection: DraftContinuityEvidenceProjectionDocument,
  overrides?: Partial<
    Pick<
      SubmissionEnvelopeValidationInput,
      | "attachmentStates"
      | "contactAuthorityPosture"
      | "contactPreferenceSummary"
      | "urgentDecisionState"
      | "convergenceState"
    >
  >,
): SubmissionEnvelopeValidationInput {
  const snapshot = projection.toSnapshot();
  return {
    envelopeRef: snapshot.envelopeRef,
    draftPublicId: snapshot.draftPublicId,
    requestType: snapshot.requestType,
    structuredAnswers: { ...snapshot.structuredAnswers },
    freeTextNarrative: snapshot.freeTextNarrative,
    attachmentRefs: [...snapshot.attachmentRefs],
    contactPreferences: { ...snapshot.contactPreferences },
    identityContext: { ...snapshot.identityContext },
    channelCapabilityCeiling: { ...snapshot.channelCapabilityCeiling },
    surfaceChannelProfile: snapshot.surfaceChannelProfile,
    ingressChannel: snapshot.ingressChannel,
    intakeConvergenceContractRef: snapshot.intakeConvergenceContractRef,
    draftVersion: snapshot.authoritativeDraftVersion,
    currentStepKey: snapshot.currentStepKey,
    completedStepKeys: [...snapshot.completedStepKeys],
    attachmentStates: overrides?.attachmentStates,
    contactAuthorityPosture: overrides?.contactAuthorityPosture,
    contactPreferenceSummary: overrides?.contactPreferenceSummary,
    urgentDecisionState: overrides?.urgentDecisionState,
    convergenceState: overrides?.convergenceState,
  };
}

export function createSubmissionEnvelopeValidationApplication(options?: {
  repositories?: DraftAutosaveDependencies;
  attachmentStateResolver?: (input: {
    draftPublicId: string;
    attachmentRefs: readonly string[];
  }) => Promise<readonly SubmissionAttachmentState[]>;
  contactPreferenceResolver?: (input: {
    draftPublicId: string;
    envelopeRef: string;
  }) => Promise<ContactPreferenceValidationSummary | undefined>;
}): SubmissionEnvelopeValidationApplication {
  const repositories = options?.repositories ?? createDraftAutosaveStore();
  const drafts = createDraftSessionAutosaveService(
    repositories,
    createDeterministicBackboneIdGenerator("command_api_submission_validation_drafts"),
  );
  const validation = createSubmissionEnvelopeValidationService();
  const attachmentStates = new Map<string, SubmissionAttachmentState>();
  const contactAuthorityByDraft = new Map<string, SubmissionContactAuthorityPosture>();
  const urgentDecisionByDraft = new Map<string, ValidationUrgentDecisionState>();
  const convergenceStateByDraft = new Map<string, "valid" | "invalid">();

  async function requireProjection(
    draftPublicId: string,
  ): Promise<DraftContinuityEvidenceProjectionDocument> {
    const projection = await repositories.findDraftContinuityEvidenceProjectionByPublicId(draftPublicId);
    if (!projection) {
      throw new Error(`Draft projection not found for ${draftPublicId}.`);
    }
    return projection;
  }

  async function buildInput(draftPublicId: string): Promise<SubmissionEnvelopeValidationInput> {
    const projection = await requireProjection(draftPublicId);
    const projectionSnapshot = projection.toSnapshot();
    const resolvedAttachmentStates = options?.attachmentStateResolver
      ? await options.attachmentStateResolver({
          draftPublicId,
          attachmentRefs: projectionSnapshot.attachmentRefs,
        })
      : undefined;
    const resolvedContactPreferenceSummary = options?.contactPreferenceResolver
      ? await options.contactPreferenceResolver({
          draftPublicId,
          envelopeRef: projectionSnapshot.envelopeRef,
        })
      : undefined;
    const seededAttachmentStates =
      resolvedAttachmentStates ??
      projectionSnapshot.attachmentRefs.map(
        (attachmentRef) =>
          attachmentStates.get(attachmentRef) ?? {
            attachmentRef,
            outcomeRef: "PARALLEL_INTERFACE_GAP_145_ATTACHMENT_SCAN_PIPELINE_PENDING",
            submitDisposition: "state_unknown" as const,
            currentSafeMode: "recovery_only" as const,
            documentReferenceState: "pending" as const,
            quarantineState: "unknown" as const,
          },
      );
    return projectionToValidationInput(projection, {
      attachmentStates: seededAttachmentStates,
      contactAuthorityPosture: contactAuthorityByDraft.get(draftPublicId),
      contactPreferenceSummary: resolvedContactPreferenceSummary,
      urgentDecisionState: urgentDecisionByDraft.get(draftPublicId),
      convergenceState: convergenceStateByDraft.get(draftPublicId),
    });
  }

  return {
    repositories,
    drafts,
    validation,
    async evaluateDraftValidation(draftPublicId: string): Promise<SubmissionEnvelopeValidationVerdict> {
      return validation.evaluateDraftSave(await buildInput(draftPublicId));
    },
    async evaluateSubmitReadiness(draftPublicId: string): Promise<SubmissionEnvelopeValidationVerdict> {
      return validation.evaluateSubmit(await buildInput(draftPublicId));
    },
    seedAttachmentState(state: SubmissionAttachmentState): void {
      attachmentStates.set(state.attachmentRef, state);
    },
    seedContactAuthorityPosture(
      draftPublicId: string,
      posture: SubmissionContactAuthorityPosture,
    ): void {
      contactAuthorityByDraft.set(draftPublicId, posture);
    },
    seedUrgentDecisionState(draftPublicId: string, state: ValidationUrgentDecisionState): void {
      urgentDecisionByDraft.set(draftPublicId, state);
    },
    seedConvergenceState(draftPublicId: string, state: "valid" | "invalid"): void {
      convergenceStateByDraft.set(draftPublicId, state);
    },
  };
}
