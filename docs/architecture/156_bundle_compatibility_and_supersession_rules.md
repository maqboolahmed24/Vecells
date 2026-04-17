# 156 Bundle Compatibility And Supersession Rules

The frontend inherits the frozen bundle compatibility and supersession laws instead of inventing local branch behavior.

## Request Type Changes

- Policy ref: `RTC_140_CONFIRM_AND_SUPERSEDE_V1`
- Trigger: request type changes after any branch answer exists
- Required behavior: explicit confirm-and-supersede
- Forbidden behavior: silent semantic remap

## Branch Supersession

When a controlling answer changes:

1. Recompute visibility immediately.
2. Remove newly hidden answers from the active payload.
3. Remove newly hidden answers from the active summary chips.
4. Retain superseded values in audit memory only.
5. Raise a review cue when any superseded answer was safety relevant.

## Resume Compatibility Modes

| Mode | Meaning | Patient posture |
| --- | --- | --- |
| `resume_compatible` | Current bundle still matches saved semantics | Continue in the same shell |
| `review_migration_required` | Semantics remain aligned but the shell posture changed | Review before continuing |
| `blocked` | Draft semantics no longer match the active bundle | Freeze continuation and open bounded recovery guidance |

## Same-Shell Law

- Compatibility review does not leave the mission frame.
- The status strip, masthead, progress rail, and summary region stay visible.
- The selected anchor stays in the same route family.
- Recovery remains bounded and continuity-aware, not a detached error page.
