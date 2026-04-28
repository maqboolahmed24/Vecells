# 200 Contact Claim Visibility And Preference Separation UI

Task `par_200` adds the authenticated account details contact workspace for the
`Contact_Truth_Ledger` visual mode. The route family is
`rf_contact_truth_workspace` and the primary entry is `/portal/account/contact`.

## Source Separation

The workspace deliberately separates three contact families:

1. NHS login contact claims are rendered by `SourceTruthCard`. They are
   view-only, externally managed, and used only for sign-in, recovery, and
   identity assurance.
2. Vecells communication preferences are rendered by `PreferenceLedgerCard`.
   They are editable or reviewable in Vecells and control Vecells callbacks,
   replies, and reminders only.
3. Optional PDS and GP demographic rows are rendered by
   `DemographicSourceCard` only when the projection says they are available, or
   as an explicit gated/unavailable explanation when the source is absent.

No source card can imply that editing one family updates another. The route
model carries `noExternalWriteSideEffects` and `noPreferenceSideEffects` so
validators and Playwright can assert the boundary.

## Provenance

Every card renders `ProvenanceBadgeRow` with text labels for source, freshness,
and edit authority. The row is not color-only: each badge includes a label and
human-readable value. This keeps NHS login, Vecells preference, PDS, and GP
authority clear even when color is unavailable.

## Reachability And Repair

`ReachabilityRiskPanel` is secondary when no current action is blocked. When a
callback, reply, or reminder path is blocked, the same panel becomes visible
with `role="alert"` and `data-promoted-to-visible-panel="true"`. The blocker is
never hidden in account disclosure because it governs the active path.

`ContactRepairEntryCard` preserves the blocked action context for
`/portal/requests/REQ-4219#reply-window`. Repair starts in the same account
shell and the return action keeps the selected reply-window anchor instead of
redirecting the patient to generic home.

## Route Inventory

| Route | Screen | Purpose |
| --- | --- | --- |
| `/portal/account/contact` | `AccountDetailsContactWorkspace` | Normal source ledger with no active blocker. |
| `/portal/account/contact/repair` | `ContactRepairRequiredState` | Promoted blocker and repair entry before continuing an active path. |
| `/portal/account/contact/external-off` | `ExternalSourceUnavailableState` | Bounded PDS/GP unavailable explanation with no inferred values. |

## Safety Rules

- NHS login contact claims are view-only in Vecells.
- Vecells preferences can be reviewed here, but they do not update NHS login,
  PDS, or GP rows.
- PDS and GP demographic rows are external demographic references, not
  communication preferences.
- Blocking reachability issues for active callback, reply, or reminder paths
  must be promoted to a visible repair panel.
- Full phone numbers, raw identifiers, tokens, and full patient identifiers are
  not rendered in route, atlas, screenshots, or artifacts.
