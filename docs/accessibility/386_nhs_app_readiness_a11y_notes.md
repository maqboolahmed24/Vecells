# 386 NHS App Readiness Accessibility Notes

## Landmarks

The page exposes one skip link and one `main` landmark for the route inventory. The filter rail,
detail side panel, and evidence drawer use labelled `aside` regions so screen-reader users can
move between controls, inventory, inspector, preview, and evidence.

## Keyboard Order

Keyboard order follows visible order:

1. Skip link
2. Masthead summary
3. Filter rail controls
4. Environment tuple and topology strip
5. Route inventory table rows
6. Inspector tabs and drawer open action
7. Preview mode select
8. Evidence drawer close action when open

## Table And Tabs

The inventory remains a native HTML table because each row is a route record with stable columns.
Row selection is performed by a button inside the row header. Inspector sections use a labelled
`tablist` with `role="tab"` and `role="tabpanel"`.

## Preview And Motion

The embedded preview is not a second interactive app. It is an assurance simulation with readable
status text, safe-area dimensions, bridge availability, freeze posture, and artifact limitation
copy. The reduced-motion preview mode and `prefers-reduced-motion` CSS path remove nonessential
drawer animation.

## Evidence Drawer

The drawer remains non-modal because operators still need table and inspector context. It is an
aside labelled "Evidence drawer" with explicit open and closed automation state.
