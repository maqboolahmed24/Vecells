export interface Phase3LeaseFenceTuple {
  ownershipEpoch: number;
  fencingToken: string;
  lineageFenceEpoch: number;
}

export interface Phase3CommandWitness {
  actorRef: string;
  routeIntentTupleHash: string;
  routeIntentBindingRef: string;
  commandActionRecordRef: string;
  commandSettlementRecordRef: string;
  transitionEnvelopeRef: string;
  releaseRecoveryDispositionRef: string;
  causalToken: string;
  recordedAt: string;
  recoveryRouteRef?: string | null;
}

export interface Phase3ClaimAuthorityWitness extends Phase3LeaseFenceTuple {
  nextOwnershipEpoch: number;
  nextLineageFenceEpoch: number;
  nextFencingToken: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
}

export interface Phase3TakeoverAuthorityWitness {
  staleOwnerRecoveryRef: string;
  nextOwnershipEpoch: number;
  nextLineageFenceEpoch: number;
  nextFencingToken: string;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
  leaseTtlSeconds: number;
}

export interface Phase3ReleaseAuthorityWitness extends Phase3LeaseFenceTuple {
  nextLineageFenceEpoch: number;
  lifecycleLeaseRef: string;
  leaseAuthorityRef: string;
}

export function assertPhase3FenceAdvance(input: {
  currentOwnershipEpoch: number;
  nextOwnershipEpoch?: number;
  currentLineageFenceEpoch: number;
  nextLineageFenceEpoch?: number;
}): void {
  if (
    input.nextOwnershipEpoch !== undefined &&
    input.nextOwnershipEpoch <= input.currentOwnershipEpoch
  ) {
    throw new Error("nextOwnershipEpoch must advance the current ownership epoch.");
  }
  if (
    input.nextLineageFenceEpoch !== undefined &&
    input.nextLineageFenceEpoch <= input.currentLineageFenceEpoch
  ) {
    throw new Error("nextLineageFenceEpoch must advance the current lineage fence epoch.");
  }
}
