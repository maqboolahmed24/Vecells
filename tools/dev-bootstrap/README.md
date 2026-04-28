# Dev Bootstrap

The bootstrap helper prepares a local contributor checkout without pretending to be a production orchestrator.

Current scope:

- read `.env.example`
- list expected keys
- report which values are missing from the current shell
- install `.githooks` via `git config core.hooksPath .githooks`
- print the canonical local validation loop
