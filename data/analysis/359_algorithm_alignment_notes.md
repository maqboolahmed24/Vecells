# 359 Algorithm Alignment Notes

## Governing rule

Dispatch posture is truthful only when the browser reflects the current package, proof, consent, and continuity tuple without collapsing them into a single local status.

## Source mapping

| UI surface | Required truth object(s) | Why |
| --- | --- | --- |
| `ChosenPharmacyAnchorCard` | `PharmacyConsentCheckpoint`, `PharmacyDispatchTruthProjection`, continuity evidence | keeps the governing anchor or preserved provenance explicit |
| `DispatchProofStatusStrip` | `PharmacyDispatchTruthProjection`, `DispatchProofEnvelope`, `PharmacyHandoffWatchProjection` | separates overall posture, deadline, next step, and recovery owner |
| `DispatchEvidenceRows` | `PharmacyDispatchTruthProjection`, `DispatchProofEnvelope`, `PharmacyConsoleContinuityEvidenceProjection` | keeps transport, provider, proof, deadline, and owner on separate lanes |
| `DispatchArtifactSummaryCard` | `ReferralArtifactManifest`, `PharmacyReferralPackage` | makes redaction and omission legible |
| `PatientDispatchPendingState` | patient-safe dispatch preview | keeps next-step language non-technical |
| `PatientConsentCheckpointNotice` | `PharmacyConsentCheckpoint` | exposes blocked progress without dropping the chosen pharmacy |
| `DispatchContinuityWarningStrip` | continuity evidence + consent/proof drift | prevents stale calmness |

## Gap closures

### 1. Dispatch looks confirmed too early

Closed by:

- `data-patient-calm-allowed`
- explicit `authoritativeProofState`
- distinct evidence rows and staff strip tone

### 2. Patient sees transport jargon

Closed by:

- patient-specific title and summary strings in the preview layer
- patient routes using next-step copy instead of adapter-local labels

### 3. Consent-blocked state drops the chosen pharmacy

Closed by:

- rendering `ChosenPharmacyAnchorCard` on non-chooser patient routes
- preserving the anchor during `consent_blocked` and `continuity_drift`

### 4. Artifact redaction is invisible

Closed by:

- `DispatchArtifactSummaryCard`
- explicit included, redacted, and omitted rows

## Scenario truth checkpoints

- `PHC-2048`: calmness allowed only because proof and continuity are current
- `PHC-2057`: pending proof blocks calmness even though transport has accepted the attempt
- `PHC-2090`: consent drift forces blocked posture and read-only anchor
- `PHC-2148`: warned-choice acknowledgement blocks dispatch before any transport proof can matter
- `PHC-2156`: stale anchor widens into provenance and read-only recovery
