# 333 Mission Stack Algorithm Alignment Notes

## Desktop to folded mapping

- desktop `HubStatusAuthorityStrip` -> `HubNarrowStatusAuthorityStrip`
- desktop `CasePulse` and shell summary -> `HubCasePulseCompact`
- desktop queue workbench and saved-view rail -> `HubNarrowQueueWorkbench`
- desktop centre-column candidate or case canvas -> `HubMissionStackLayout`
- desktop right rail -> `HubSupportDrawer`
- desktop right-rail `DecisionDock` -> `HubDecisionDockBar`
- desktop continuity markers -> `HubMissionStackContinuityBinder`

## Preserved truth

- the folded shell still resolves from `resolveHubShellSnapshot`
- `selectedCaseId`, `selectedOptionCardId`, and `selectedExceptionId` remain state-owned, not view-owned
- access-denied and scope-drift logic still comes from the acting-context control plane rather than route-local banners
- recovery canvas, commit pane, and exceptions detail use the same backend-derived descriptors as the desktop shell

## Borrowed and rejected design moves

- borrowed: Linear-style restrained density, NHS-style content priority, and APG-style explicit drawer state
- rejected: inbox-like mobile cards, floating duplicate CTA bars, and drawer-only hidden recovery meaning

## Fold plan summary

1. preserve shell chrome, active queue anchor, and current case pulse first
2. keep the dominant case region in flow
3. demote support material into a drawer
4. reserve bottom safe-area space for the sticky `DecisionDock`
5. keep continuity markers observable across fold, unfold, rotate, and reload
