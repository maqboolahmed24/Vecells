# Mock Artifact Scan Gateway

Local provider twin for seq_035. It preserves `clean`, `suspicious`, `quarantined`, `unreadable`, and `failed` scan branches plus callback retry, quarantine hold, and manual-review actions.

Run with:

```bash
node src/server.js
```
