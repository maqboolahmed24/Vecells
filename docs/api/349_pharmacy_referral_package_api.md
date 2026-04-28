# 349 Pharmacy Referral Package API

## Service

`createPhase6PharmacyReferralPackageService(...)`

## Methods

### `validatePackageTuple(input)`

Returns `PharmacyPackageTupleValidationResult`.

Required input groups:

- `pharmacyCaseId`
- `compiledPolicyBundleRef`
- `expectedSelectionBindingHash`
- `routeIntentBindingRef`
- `routeIntentTuple`
- `contentInput`

Optional tuple fences:

- `expectedChoiceProofRef`
- `expectedSelectedExplanationRef`
- `expectedDirectorySnapshotRef`
- `expectedConsentCheckpointRef`

### `composeDraftPackage(input)`

Persists a `composing` package plus its governance decisions. No transport action occurs.

### `freezePackage(input)`

Required extra freeze authority:

- `actorRef`
- `commandActionRecordRef`
- `commandSettlementRecordRef`
- `recordedAt`
- `leaseRef`
- `expectedOwnershipEpoch`
- `expectedLineageFenceRef`
- `scopedMutationGateRef`
- `reasonCode`

Optional:

- `draftPackageId`
- `idempotencyKey`

Returns:

- frozen `PharmacyReferralPackageBundle`
- optional `caseMutation`
- `tupleValidation`
- representation materialization summary
- package-bound `PharmacyCorrelationRecord`
- replay flag

### `supersedePackage(input)`

Marks an older frozen package as `superseded` and appends a supersession record.

### `invalidatePackage(input)`

Marks a package as `invalidated` and invalidates its representation set when present.

### `getPackageById(packageId)`

Returns the package bundle, governance decisions, artifacts, freeze history, supersession history,
invalidation history, correlation record, and current FHIR representation state.

### `getCurrentPackageForCase(pharmacyCaseId)`

Returns the current frozen package for the case, if one exists.

### `replayCanonicalRepresentationGeneration(input)`

Re-materializes the canonical representation path for a frozen package and proves the replay lands
 on the same representation-set identifier.

## Key state laws

- `packageState` is one of `composing | frozen | superseded | invalidated`
- `packageFingerprint` and `packageHash` are immutable once frozen
- `package_ready` in the case kernel now means a package was actually frozen
- replay drift is a hard failure, not a warning
