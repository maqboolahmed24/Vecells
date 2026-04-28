# 250 Advice Content Release And Artifact Controls

Visible self-care advice is allowed only while content approval, review cadence, publication posture, and trust posture are all current.

## Approval and review

Every visible settlement must bind one explicit `ClinicalContentApprovalRecord` and one current `ContentReviewSchedule`.
Implicit content approval is forbidden.

If approval is revoked, superseded, expired, or mismatched for audience, channel, locale, reading level, or accessibility scope, the render fails closed.
If review cadence is due or hard expiry has elapsed, the render is withheld.

## Publication and trust

`releaseTrustState = quarantined` or a quarantined release gate cannot authorize fresh visible advice.
Degraded publication or frozen release posture may permit diagnostic evaluation, but it may not authorize fresh visible advice render.

A live `AdviceEligibilityGrant` is not proof of renderable advice.
Render still depends on the current boundary tuple, current publication tuple, and current trust tuple.

## Artifact and exit control

Raw URLs and uncontrolled downloads are forbidden in `AdviceVariantSet.linkedArtifactContractRefs`.
Every linked leaflet, summary-first artifact, or external exit must resolve through `ArtifactPresentationContract` and bounded navigation-grant policy.

Summary-first delivery remains the default.
The artifact contract is stored on `AdviceRenderSettlement` so later patient or staff surfaces can explain exactly which governed presentation mode was active.

## Fallback safety

Fallback transforms may not change clinical meaning.
Locale or reading-level fallback is allowed only when the selected variant remains inside the approval scope and the fallback path is stored on the settlement.
