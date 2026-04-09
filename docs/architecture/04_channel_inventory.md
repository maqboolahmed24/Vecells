# Channel Inventory

## Summary

- Channels inventoried: 8
- Browser, embedded, and constrained_browser remain shell postures; telephony, secure-link continuation, and support-assisted capture remain ingress channels.

## Channel Matrix

| Channel | Class | Shell profile mapping | Shell applicability | Posture | Continuity notes |
| --- | --- | --- | --- | --- | --- |
| Browser web | interactive_primary | browser | patient<br>staff<br>hub<br>pharmacy<br>support<br>operations<br>governance | baseline | This is the baseline shell posture for most surfaces. |
| Embedded webview / NHS App-style embedded channel | interactive_embedded | embedded | patient | deferred | Channel posture changes without changing shell ownership. |
| Constrained browser posture | interactive_constrained | constrained_browser | patient<br>staff | baseline | The shell stays the same shell; only the channel profile changes. |
| Telephony / IVR | interactive_ingress | constrained_browser | patient | baseline | Telephony is an ingress channel, not a shell family. |
| SMS continuation / secure-link continuation | interactive_continuation | constrained_browser | patient | baseline | Preserves one specific lineage anchor rather than opening a generic portal shell from scratch. |
| Support-assisted capture | interactive_assisted | browser | support<br>patient | baseline | This is still one governed intake lineage, not a separate support-only request system. |
| External delivery channels for notifications and reminders | delivery_only | n/a | patient<br>support<br>hub | baseline | Continuity-sensitive calmness must still come from authoritative settlement and evidence, not transport acceptance alone. |
| External delivery channels for callback and telephony outcomes | delivery_only | n/a | patient<br>support<br>hub | baseline | Delivery evidence affects continuity and repair posture but does not redefine shell ownership. |

## Inventory Rules

- Embedded delivery narrows shell posture but does not change shell ownership.
- Telephony parity is explicit: phone/IVR is an ingress channel into the same intake lineage, not a separate back-office shell.
- External delivery rails stay in inventory because delivery evidence affects continuity, visibility, and repair posture even when they are not interactive shell entries.
