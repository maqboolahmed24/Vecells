# 332 Org-Aware Access Controls And Acting Context Switcher

## Visual mode

- `Hub_Acting_Context_Control_Plane`

## Outcome

The hub shell now exposes one always-visible acting-context control plane that makes organisation, site, purpose of use, audience tier, and break-glass posture explicit without leaving the same shell family.

## Primary surfaces

- `HubActingContextChip`: masthead control that shows organisation, site, role, access posture, and break-glass state
- `HubScopeSummaryStrip`: shell-level summary row for organisation, site, purpose, audience tier, visibility envelope, tuple hash, and minimum-necessary posture
- `OrganisationSwitchDrawer`: same-shell drawer for organisation switching, site switching, purpose-of-use selection, break-glass controls, and the visibility legend
- `ActingSiteSwitcher`: site rows with `current`, `available`, and `pending` states
- `PurposeOfUsePanel`: purpose rows with `current`, `available`, `pending`, and `blocked` states
- `BreakGlassReasonModal`: reason-coded activation surface with explicit denial treatment when the current scope cannot elevate
- `AccessScopeTransitionReceipt`: preserves the active case anchor while explaining whether the new scope stayed writable, became read-only, froze, or denied the route
- `ScopeDriftFreezeBanner`: explicit same-shell freeze state for purpose or visibility drift
- `VisibilityEnvelopeLegend`: audience-tier explanation for hub, origin-practice, and servicing-site visibility envelopes
- `MinimumNecessaryPlaceholderBlock`: governed withheld-content treatment so hidden fields do not look like broken data
- `HubAccessDeniedState`: stronger blocked posture that keeps the shell but stops unsafe detail and mutation

## Route behavior

- `/hub/queue`: current acting context stays visible above the queue workbench and can switch without losing the selected queue row
- `/hub/case/:hubCoordinationCaseId`: organisation or purpose changes preserve the current case anchor and either keep writable posture, demote to read-only, freeze in place, or deny explicitly
- `/hub/alternatives/:offerSessionId`: the same acting-context grammar carries through the alternatives route family without a profile-style detour
- `/hub/exceptions`: hub-only exception review denies explicitly when the active organisation is not the hub tuple
- `/hub/audit/:hubCoordinationCaseId`: audit remains same-shell and read-mostly while still showing the current acting scope and visibility contract

## Governing laws

1. The live organisation, site, purpose, audience tier, and break-glass posture must be visible in the main shell rather than hidden in account chrome.
2. Organisation or site switching may preserve, freeze, or deny the current route, but it may not silently reinterpret the open case.
3. Read-only and denied are different states: read-only keeps bounded context; denied blocks operational detail more strongly.
4. Minimum-necessary omissions must render as intentional placeholders with explicit reason text.
5. Break-glass states must remain visibly distinct across inactive, active, expiring, revoked, and denied postures.

## Proof surface

- local `hub-desk` vitest coverage for state restoration and acting-context transitions
- Playwright coverage for same-shell switching, break-glass, placeholders, and accessibility
- validator coverage for artifact completeness plus deterministic runtime states
