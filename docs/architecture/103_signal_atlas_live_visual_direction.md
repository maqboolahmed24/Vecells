# 103 Vecell Visual Direction

`vecell / Quiet Clarity` is the default visual language for active app chrome. It is not a component catalog aesthetic and it is not a dashboard skin. The target feel is a premium clinical instrument: measured, calm, traceable, and spatially memorable under stress.

## What It Must Feel Like

- calm by default, even when the system is busy
- precise enough for professional review, but not coded like a dense internal admin kit
- quiet in patient space, list-first in queue space, and evidence-forward in governance space
- motion that explains change instead of decorating it

## What It Must Avoid

- hero wallpaper, decorative gradients, or marketing-gloss chrome
- saturated badge storms or role-color wallpaper
- local typography, spacing, or animation ladders
- route-local exception colors that override semantic meaning

## Palette Direction

The canonical seed palette is published in the token foundation and then converted into OKLCH-driven token values. The visual result is restrained:

- light surfaces sit in pale graphite and shell mist tones, never bright white-on-white card stacks
- dark surfaces stay navy-graphite rather than pure black and neon
- semantic accents stay singular and purposeful
- success remains governed and sparse
- danger is urgent because of meaning, contrast, and wording, not because the entire surface turns red

## Typography Direction

The typography contract stays editorial and operational at the same time:

- display and headline are for sparse orientation moments only
- section and body roles carry most of the product
- labels are for scanning, not shouting
- mono small is reserved for ids, counts, timestamps, and provenance tuples
- tabular numerics are default for operational values

## Shell Posture

- Patient: one dominant action, generous spacing, reduced motion by default
- Workspace and hub: two-plane, list-first, evidence-in-support-lane
- Support: review-toned, replay-aware, still quiet
- Pharmacy: trust and fulfilment cues stay crisp without celebratory success
- Operations: compact dense-data posture is legal only for passive telemetry
- Governance: approval, evidence, and scope live in one shell, not detached destinations
- Embedded: constrained chrome, safe-area resilience, static equivalents first

## Brand Mark

The active product brand is `vecell`, sourced from one canonical SVG geometry in `@vecells/design-system`.

- `VecellLogoIcon` is the icon-only crop and is used for favicon or tab chrome and other compact emblem slots.
- `VecellLogoWordmark` is the text-only crop and is used for compact in-flow brand bands.
- `VecellLogoLockup` is the icon-plus-wordmark crop and is used for mastheads, shell headers, and hero brand rows.
- The three variants are derived from one path and one source lockup. They are not separate illustrations and they may not drift independently.
- Route-local pseudo marks, specimen-only placeholder badges, or bespoke inline SVG logos must not replace the shared exports in active surfaces.

That keeps the visible brand system singular while still allowing the browser tab, compact headers, and large mastheads to use the appropriate crop.
