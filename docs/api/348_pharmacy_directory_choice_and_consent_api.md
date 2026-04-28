# 348 Pharmacy Directory Choice And Consent API

## Service entry points

All 348 consumers must call the pharmacy domain service, not adapter-specific helpers.

### `discoverProvidersForCase`

Input:

- `pharmacyCaseId`
- `location`
- `audience`
- `refreshMode`
- `evaluatedAt`

Returns:

- `PharmacyDirectorySnapshot`
- bound source snapshots
- capability snapshots
- normalized providers
- `PharmacyChoiceProof`
- `PharmacyChoiceExplanation[]`
- `PharmacyChoiceDisclosurePolicy`
- `PharmacyChoiceSession`
- `PharmacyChoiceTruthProjection`

### `getChoiceTruth`

Input:

- `pharmacyCaseId`
- `audience`

Returns the latest persisted choice bundle without re-ranking in the caller.

### `selectProvider`

Input:

- `pharmacyCaseId`
- `providerRef`
- `actorRef`
- `expectedChoiceRevision`
- mutation-authority tuple from the 346 case kernel

Effects:

- validates provider visibility against the persisted proof
- mints a new `selectionBindingHash`
- persists selected provider / explanation / capability snapshot
- moves the 346 case into `consent_pending`
- creates or refreshes a placeholder `PharmacyConsentCheckpoint`

### `acknowledgeWarnedChoice`

Input:

- `pharmacyCaseId`
- `acknowledgementScriptRef`
- `actorRef`
- `actorRole`
- `expectedChoiceRevision`
- mutation-authority tuple

Effects:

- persists `PharmacyChoiceOverrideAcknowledgement`
- clears `patientOverrideRequired`
- moves the session to `consent_pending`

### `capturePharmacyConsent`

Input:

- `pharmacyCaseId`
- `consentScriptVersion`
- `actorRef`
- `expectedSelectionBindingHash`
- `referralScope`
- `channel`
- `patientAwarenessOfGpVisibility`
- optional `packageFingerprint`
- mutation-authority tuple

Effects:

- persists `PharmacyConsentRecord`
- updates `PharmacyConsentCheckpoint`
- marks the session `completed`
- projects read-only provenance for later UI tracks

### `revokeOrSupersedeConsent`

Input:

- `pharmacyCaseId`
- `reasonCode`
- `actorRef`
- mutation-authority tuple

Effects:

- supersedes or withdraws the active consent
- writes `PharmacyConsentRevocationRecord`
- marks the checkpoint stale
- forces recovery

### `refreshChoiceIfStale`

Input:

- `pharmacyCaseId`
- `location`
- `audience`
- `reasonCode`
- `evaluatedAt`

Effects:

- re-runs discovery only when the current snapshot is stale, unless the caller used
  `discoverProvidersForCase(..., refreshMode="force_refresh")`

## Consumer rules

- UI tracks must consume `PharmacyChoiceTruthProjection`.
- No downstream consumer may rebuild provider order from raw adapter payloads.
- No downstream consumer may infer consent health from selected-provider state.
