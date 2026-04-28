# 398 NHS App Support/Ops Accessibility Notes

## Applied Decisions

| Area                 | Decision                                                                                                    | Verification                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Landmarks            | The workbench uses a skip link, masthead, `main`, rail `aside`, and inspector `aside`.                      | `398_channel_merge_accessibility_and_visual.spec.ts` checks headings, tab roles, and keyboard focus. |
| Native controls      | Case rows, timeline events, tab selectors, and dock toggle are native buttons. Deep links are anchors.      | Playwright uses role and test-id locators rather than brittle CSS selectors.                         |
| Focus visibility     | `:focus-visible` is styled with a high-contrast accent outline.                                             | Accessibility visual spec tabs through the surface and asserts a focused element is present.         |
| Reduced motion       | Selection transitions collapse under `prefers-reduced-motion: reduce`.                                      | Visual spec emulates reduced motion before taking the final screenshot.                              |
| Patient-visible copy | `WhatPatientSawPanel` exposes concise state summaries and does not rely on color alone for freeze posture.  | Audit/patient Playwright spec verifies consent-denied and read-only language is visible.             |
| Tables               | Audit fields use a native table with column headers and row headers.                                        | Validator checks the audit table surface and disclosure-safe field map.                              |
| URL replay           | Major inspector state is serialized into the URL so assistive users and operators can reload the same view. | Traceability and governance specs assert `case`, `tab`, `event`, `sso`, and `freeze` query params.   |

## Current Limits

The route rail stacks at narrow widths in this implementation. The CSS reserves the same semantic rail and inspector regions, and the dock toggle preserves the inspector state in the URL; a later shell-level drawer primitive can replace the stacked rail without changing the surface contract.

## Reference Alignment

The NHS App integration standards require WCAG 2.2 AA evidence for integrated services. The support workbench therefore treats accessibility proof as an operator-surface requirement, not only a patient-facing obligation.
