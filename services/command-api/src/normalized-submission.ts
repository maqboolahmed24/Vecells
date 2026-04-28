import {
  createNormalizedSubmissionService,
  createNormalizedSubmissionStore,
  type CreateNormalizedSubmissionInput,
  type NormalizedSubmissionDocument,
  type NormalizedSubmissionRepository,
} from "../../../packages/domains/intake_request/src/index";

export interface NormalizedSubmissionApplication {
  readonly repositories: NormalizedSubmissionRepository;
  readonly service: ReturnType<typeof createNormalizedSubmissionService>;
  normalizeAndPersist(input: CreateNormalizedSubmissionInput): Promise<NormalizedSubmissionDocument>;
}

export function createNormalizedSubmissionApplication(options?: {
  repositories?: NormalizedSubmissionRepository;
}) {
  const repositories = options?.repositories ?? createNormalizedSubmissionStore();
  const service = createNormalizedSubmissionService();

  return {
    repositories,
    service,
    async normalizeAndPersist(
      input: CreateNormalizedSubmissionInput,
    ): Promise<NormalizedSubmissionDocument> {
      const document = service.createNormalizedSubmission(input);
      await repositories.saveNormalizedSubmission(document);
      return document;
    },
  } satisfies NormalizedSubmissionApplication;
}
