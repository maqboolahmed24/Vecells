import {
  createPhase6PharmacyDispatchService,
  createPhase6PharmacyDispatchStore,
  type PharmacyCaseSnapshot,
} from "../../packages/domains/pharmacy/src/index.ts";
import {
  build349DraftInput,
  create349PackageHarness,
  load349CurrentCase,
  seed349ConsentReadyCase,
} from "./349_pharmacy_referral_package.helpers.ts";

export function create350DispatchHarness(
  scenario: Parameters<typeof create349PackageHarness>[0] = "baseScenario",
) {
  const packageHarness = create349PackageHarness(scenario);
  const dispatchRepositories = createPhase6PharmacyDispatchStore();
  const dispatchService = createPhase6PharmacyDispatchService({
    repositories: dispatchRepositories,
    caseKernelService: packageHarness.caseKernelService,
    directoryRepositories: packageHarness.repositories,
    packageRepositories: packageHarness.packageRepositories,
  });
  return {
    ...packageHarness,
    dispatchRepositories,
    dispatchService,
  };
}

export interface Seed350FrozenState {
  rulePackId: string;
  pharmacyCaseId: string;
  currentCase: PharmacyCaseSnapshot;
  packageBundle: Awaited<
    ReturnType<ReturnType<typeof create350DispatchHarness>["packageService"]["freezePackage"]>
  >["packageBundle"];
}

export async function seed350FrozenPackageCase(input: {
  harness: ReturnType<typeof create350DispatchHarness>;
  seed: string;
  providerRef?: string;
}): Promise<Seed350FrozenState> {
  const { harness, seed } = input;
  const seedState = await seed349ConsentReadyCase({
    harness,
    seed,
    providerRef: input.providerRef,
  });
  const draftInput = build349DraftInput({ seedState });
  const currentCase = await load349CurrentCase(harness, seedState.pharmacyCaseId);
  const frozen = await harness.packageService.freezePackage({
    ...draftInput,
    actorRef: `actor_${seed}`,
    commandActionRecordRef: `freeze_action_${seed}`,
    commandSettlementRecordRef: `freeze_settlement_${seed}`,
    recordedAt: "2026-04-23T14:10:00.000Z",
    leaseRef: currentCase.leaseRef,
    expectedOwnershipEpoch: currentCase.ownershipEpoch,
    expectedLineageFenceRef: currentCase.lineageFenceRef,
    scopedMutationGateRef: `scope_gate_${seed}_freeze`,
    reasonCode: "freeze_package",
    idempotencyKey: `freeze_${seed}`,
  });
  return {
    rulePackId: seedState.rulePackId,
    pharmacyCaseId: seedState.pharmacyCaseId,
    currentCase: (await load349CurrentCase(harness, seedState.pharmacyCaseId)) ?? currentCase,
    packageBundle: frozen.packageBundle,
  };
}

export async function load350CurrentCase(
  harness: ReturnType<typeof create350DispatchHarness>,
  pharmacyCaseId: string,
): Promise<PharmacyCaseSnapshot> {
  const bundle = await harness.caseKernelService.getPharmacyCase(pharmacyCaseId);
  if (!bundle) {
    throw new Error(`PharmacyCase ${pharmacyCaseId} was not found.`);
  }
  return bundle.pharmacyCase;
}

export async function submit350Dispatch(input: {
  harness: ReturnType<typeof create350DispatchHarness>;
  frozenState: Seed350FrozenState;
  sourceCommandId: string;
  recordedAt?: string;
}) {
  const currentCase = await load350CurrentCase(input.harness, input.frozenState.pharmacyCaseId);
  return input.harness.dispatchService.submitDispatch({
    pharmacyCaseId: input.frozenState.pharmacyCaseId,
    packageId: input.frozenState.packageBundle.package.packageId,
    routeIntentBindingRef: input.frozenState.packageBundle.package.routeIntentBindingRef,
    canonicalObjectDescriptorRef: "PharmacyDispatchAttempt.v1",
    governingObjectVersionRef: "phase6_dispatch_contract_v1",
    actorRef: `actor_${input.sourceCommandId}`,
    commandActionRecordRef: `dispatch_action_${input.sourceCommandId}`,
    commandSettlementRecordRef: `dispatch_settlement_${input.sourceCommandId}`,
    recordedAt: input.recordedAt ?? "2026-04-23T14:20:00.000Z",
    leaseRef: currentCase.leaseRef,
    expectedOwnershipEpoch: currentCase.ownershipEpoch,
    expectedLineageFenceRef: currentCase.lineageFenceRef,
    scopedMutationGateRef: `scope_gate_${input.sourceCommandId}_dispatch`,
    reasonCode: "submit_dispatch",
    sourceCommandId: input.sourceCommandId,
  });
}
