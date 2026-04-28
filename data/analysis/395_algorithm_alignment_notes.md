# 395 Algorithm Alignment Notes

## Publication Model

`EmbeddedDesignBundleProvider` publishes the local `DesignContractPublicationBundle` for the embedded NHS App route families. It wraps the task 394 accessibility layer instead of replacing it, preserving focus, resize, sticky-action, and semantic behavior.

## Registry Alignment

- `EmbeddedStateCopyRegistry` binds route family, state label, recovery label, CTA verb, and copy tone.
- `EmbeddedAutomationAnchorRegistry` binds route root test IDs and action reserve test IDs to the same route family vocabulary.
- `EmbeddedSemanticGrammarRegistry` binds route labels to one published archetype list.
- `EmbeddedIconographyRuleset` keeps icons secondary to text.
- `EmbeddedMicrocopyNormalizer` publishes plain-English single-dominant-action grammar.

## Visualization Fallback Alignment

Each retained visual surface maps to:

- `VisualizationFallbackContract`
- `VisualizationTableContract`
- `VisualizationParityProjection`

The fallback rows are not route-local prose. They are generated from the model profile in `embedded-design-convergence.model.ts`, allowing Playwright and validators to assert table parity across route families.

## Token Alignment

The CSS layer maps route-local variables from entry, intake, request, booking, pharmacy, recovery, and shell CSS to one token family. This reduces palette and spacing drift while avoiding route rewrites.

## Enforcement

The static validator checks source files, contracts, docs, route coverage, component hooks, package scripts, and Playwright specs. The runtime linter checks route roots, action anchors, fallback tables, and visual mode in the browser.

