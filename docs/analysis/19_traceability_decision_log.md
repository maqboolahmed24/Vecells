# Traceability Decision Log

## Recorded Decisions

- Task grounding uses `task_to_milestone_map.csv` as the authoritative task catalog because it already reconciles checklist order, milestone span, baseline scope, and gate attachment.
- Requirement scope defaults to `current` unless the registry or source phase explicitly places it in deferred Phase 7 or optional dependency territory.
- Empty prompt files are preserved as live roadmap entries. The generator does not invent prompt prose; it marks those tasks as weakly grounded where applicable.
- Risk links are inherited from seq_018 task-risk associations first, then refined by dependency and phase overlap.
- Deferred Phase 7 requirements are represented through placeholder rows without allowing those rows to count as current-baseline completion evidence.
