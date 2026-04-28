# Verified Links

Links checked during this audit on 2026-04-28.

## Render

- [Render Web Services](https://render.com/docs/web-services)
  - Checked for web service Git deploy flow, branch setting, public URL behavior, and port binding.
  - Important finding: public web services must bind HTTP to `0.0.0.0`; using `PORT` is recommended.
- [Render Private Services](https://render.com/docs/private-services)
  - Checked for private service reachability.
  - Important finding: private services are not reachable from the public internet but are reachable by other Render services in the same private network.
- [Render Deploy for Free](https://render.com/docs/free)
  - Checked free service/datastore limits.
  - Important finding: Free web services lose local filesystem changes on redeploy/restart/spin-down; Free Postgres is 1 GB and expires after 30 days.
- [Render Blueprint YAML Reference](https://render.com/docs/blueprint-spec)
  - Checked service definitions, env vars, generated values, `sync: false`, databases, env groups, private service examples, and `ipAllowList` behavior.
- [Render Monorepo Support](https://render.com/docs/monorepo-support)
  - Checked monorepo service root/build filter behavior.
  - Important finding: root directory changes affect which files are available at build/runtime, so this repo should generally build from repo root unless each service is carefully isolated.
- [Render Node Version](https://render.com/docs/node-version)
  - Checked current default and pinning methods.
  - Important finding: Render currently defaults new Node services to Node `24.14.1`, but the repo should still pin Node to avoid drift.
- [Render Inbound IP Rules](https://render.com/docs/inbound-ip-rules)
  - Checked whether IP allowlisting is a default internal access solution.
  - Important finding: web service/static site IP rules require Enterprise; do not depend on this unless the account supports it.

## GitHub

- [GitHub protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
  - Checked required status checks and protected branch behavior.
  - Important finding: required status checks can block merges until checks pass, and strict mode requires branches to be up to date before merge.

## Local Files Cross-Checked

- `package.json`
- `pnpm-workspace.yaml`
- `nx.json`
- `.env.example`
- `.github/workflows/build-provenance-ci.yml`
- `.github/workflows/nonprod-provenance-promotion.yml`
- primary app `package.json` files under `apps/`
- runtime service `package.json` files under `services/`
- `infra/data-storage/local/data-storage-emulator.compose.yaml`
- `infra/event-spine/local/event-spine-emulator.compose.yaml`
- `infra/cache-live-transport/local/cache-live-transport-emulator.compose.yaml`
- `infra/object-storage/local/object-storage-emulator.compose.yaml`
- service runtime files that currently bind to `127.0.0.1`

