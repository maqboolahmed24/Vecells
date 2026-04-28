# 357 Eligibility Explainer And Return State

## Intent

Task `par_357` mounts the first real Phase 6 eligibility explanation layer into the pharmacy shell family introduced by `356`.

It closes four specific gaps:

1. staff no longer need backend logs to understand the causal route decision
2. patients no longer see a vague pharmacy rejection
3. patient and staff surfaces cannot drift from one another because they consume one preview bundle
4. superseded or stale explanation bundles no longer look current

## Visual Mode

`Pharmacy_Eligibility_Clarity`

The mode is precise, low-noise, and evidence-led:

- one decision summary strip
- one causal gate ladder
- one version and scope row
- one evidence drawer in the promoted support region
- one patient-safe next-step panel
- one explicit supersession posture when the bundle changed

## Truth Contract

Both audiences consume the same preview snapshot:

- `decisionTupleHash`
- `sharedEvidenceHash`
- `EligibilityExplanationBundleSnapshot`
- `PathwayEligibilityEvaluationSnapshot`
- policy-pack version metadata

Disclosure may differ.
Decision truth may not.

## Staff Surface

`PharmacyEligibilityRuleExplainer` is mounted into the pharmacy-console validation board for cases with explanation previews.

The staff surface shows:

- a decision summary strip with the final route posture
- `EligibilityVersionChip`
- `EligibilityGateLadder`
- `EligibilityEvidenceDrawer` in the support region
- `EligibilitySupersessionNotice` when the bundle is stale or superseded

The ladder keeps the causal order stable:

1. age and sex gate
2. named pathway fit
3. exclusions and red flags
4. evidence completeness
5. minor-illness fallback
6. final routing

## Patient Surface

`PatientUnsuitableReturnState` and `PatientAlternativeRouteNextStepPanel` mount inside the existing patient pharmacy shell.

The patient surface keeps:

- the same request shell
- the same request-lineage anchor
- one calm explanation sentence
- one obvious next step
- one explicit return-path summary

The patient copy intentionally avoids:

- raw rule IDs
- threshold names
- score labels
- implementation-only policy language

## Host Regions

### Pharmacy console

- main board: `PharmacyEligibilityRuleExplainer`
- promoted support region: `EligibilityEvidenceDrawer`

### Patient shell

- main region: `PatientUnsuitableReturnState`
- promoted support region: `PatientAlternativeRouteNextStepPanel`

## Posture Rules

- `current`: render normal explanation and next-step posture
- `superseded`: render `EligibilitySupersessionNotice` and freeze calm or writable implication
- `stale`: keep the surface visible, but signal that the current bundle is waiting for refresh

## Accessibility Rules

- every gate row is a real button with `aria-expanded` and `aria-controls`
- evidence disclosure is button-led and keyboard reachable
- the patient next-step CTA remains visible at narrow widths
- no drawer or disclosure may hide or overlap the dominant CTA
- the patient surface keeps short readable line lengths and avoids screen-reader noise

## Route Coverage

### Workspace

- `/workspace/pharmacy/:pharmacyCaseId`
- `/workspace/pharmacy/:pharmacyCaseId/validate`

### Patient

- `/pharmacy/:pharmacyCaseId/choose`
- `/pharmacy/:pharmacyCaseId/instructions`
- `/pharmacy/:pharmacyCaseId/status`

## Non-goals

This task does not own:

- provider ranking or chooser UI from `358`
- dispatch proof UI from later tracks
- generic non-pharmacy rejection patterns outside the pharmacy loop
