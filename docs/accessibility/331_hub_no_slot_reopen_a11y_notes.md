# 331 Hub Recovery And Reopen Accessibility Notes

## Landmarks and focus

- retain one banner, one main, and bounded complementary regions inside the hub shell
- recovery panels are read in document order under the active case canvas
- exception rows are focusable buttons with persistent visible focus
- the detail drawer is labelled and remains in the same reading order on narrow layouts

## State announcement

- non-modal recovery changes stay visible and persistent
- callback pending and reopen cues do not steal focus
- typed exception rows expose severity, retry, and escalation posture in text as well as color

## Reflow and motion

- recovery canvas and exception workspace collapse to one column below tablet widths
- no reliance on horizontal scroll for core recovery content
- reduced-motion parity must preserve the same sequence of states without directional animation dependence

## Keyboard behavior

- queue row selection, case route navigation, exception-row selection, and drawer action buttons remain keyboard reachable
- reopening the exceptions route on refresh must restore the selected exception and case anchor before hydration starts

## Copy rules

- callback pending avoids calm completion wording
- urgent return uses direct, short language
- diff strip states what changed before it suggests what to do next
