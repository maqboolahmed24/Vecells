# Account Linking State Experience Spec

Status: frozen for Phase 2 frontend implementation  
Primary artifacts: `172_candidate_competition_examples.json`, `172_patient_linkage_confidence_board.html`

## Experience Principles

Account linking is a trust moment, not a diagnostic dashboard. The patient should understand whether they can continue, need to confirm details, are in limited mode, or need help. They should not see model jargon, candidate ranks, demographic comparisons, or raw identifiers.

Visual thesis: quiet identity-atlas surface, high whitespace, precise state language, and one dominant safe action.

Content plan:

| Moment                              | Patient message                                             | Dominant action              | Safe reveal                    |
| ----------------------------------- | ----------------------------------------------------------- | ---------------------------- | ------------------------------ |
| `signed_in_ready`                   | You are signed in and ready.                                | Continue                     | masked account shell only      |
| `details_found_confirmation_needed` | We found details that look like yours.                      | Confirm these details        | masked candidate summary only  |
| `limited_or_provisional_mode`       | We cannot link everything yet, but you can continue safely. | Continue with limited access | no patient-specific reveal     |
| `unable_to_confidently_match`       | We could not confidently match your record.                 | Choose another safe option   | no candidate comparison reveal |
| `identity_hold_bounded_recovery`    | We need to check this account before showing more.          | Get help with this account   | bounded recovery only          |

Interaction thesis:

- Selection changes synchronize atlas, ridge, proof braid, threshold ladder, inspector, and parity tables in `180ms`.
- Inspector reveal uses a slightly slower `220ms` shift to make state changes legible.
- Reduced motion collapses transitions without changing DOM state or table parity.

## Same-Shell Rules

All account-linking surfaces must preserve same-shell recovery semantics.

- Preserve the current patient shell and selected anchor.
- Do not route to a detached error island.
- Do not show candidate comparison details to patients.
- Do not imply writable posture while `linkState` is `none`, `candidate`, `ambiguous`, `correction_pending`, or `revoked`.
- `provisional_verified` can support low-risk continuation only when route policy allows it.
- `verified_patient` still requires current session, binding, route, and capability fences before writable actions appear.

## Copy Registry

| Copy key                                     | Use                                         | Constraint                            |
| -------------------------------------------- | ------------------------------------------- | ------------------------------------- |
| `LINK_172_COPY_SIGNED_IN_READY`              | Verified patient link.                      | Keep one direct continue action.      |
| `LINK_172_COPY_CONFIRM_DETAILS`              | Provisional match needs confirmation.       | Use masked candidate summary only.    |
| `LINK_172_COPY_LIMITED_MODE`                 | No confident candidate or restricted route. | No patient-specific reveal.           |
| `LINK_172_COPY_UNABLE_TO_MATCH`              | Ambiguous runner-up or weak subject proof.  | Do not mention probabilities or rank. |
| `LINK_172_COPY_IDENTITY_HOLD`                | Repair or conflict posture.                 | Offer help without blame.             |
| `LINK_172_COPY_CONTACT_CLAIM_NOT_PREFERENCE` | Contact claim visible in account context.   | State that preferences are separate.  |
| `LINK_172_COPY_PDS_NOT_PREFERENCE`           | PDS enrichment present.                     | Do not imply PDS changed preferences. |

## Board Contract

`172_patient_linkage_confidence_board.html` must use surface mode `Patient_Linkage_Confidence_Board` and include:

- restrained Vecells wordmark plus `identity_constellation_mark`
- left rail width `280px`
- right inspector width `408px`
- masthead height `72px`
- max width `1600px`
- candidate-confidence ridge with adjacent table parity
- subject-to-patient proof braid with adjacent table parity
- threshold ladder with adjacent table parity
- patient-facing state atlas with text-only parity view
- lower copy-state registry

The board is internal contract evidence. It may visualize confidence, but all patient-facing copy shown in the atlas must stay non-diagnostic.

## Validation Commitments

Playwright coverage must include:

- candidate and threshold filter synchronization
- row and diagram selection sync
- ambiguous/out-of-domain rendering
- patient-state atlas parity
- keyboard traversal and landmarks
- reducedMotion equivalence
- diagram/table parity
