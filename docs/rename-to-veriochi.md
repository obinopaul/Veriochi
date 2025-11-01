# Rename plan — safely renaming `plane` → `Veriochi`

This document lists a safe, repeatable checklist to rename the repository and internal package scopes from `plane` to `Veriochi` (case-sensitive steps advised).

Important: AGPL
- The project is AGPL-3.0. Renaming doesn't change license obligations. If you plan to use the code as a company base, consult legal counsel about AGPL obligations for derivative works and SaaS usage.

High-level approach
-------------------

1. Create a new branch: `git checkout -b rename/plane-to-veriochi`.
2. Replace top-level metadata:
   - `package.json` (root): change `name` and any references to `plane` to `veriochi` or `@veriochi` scope as desired.
   - `README.md`, `CODE_OF_CONDUCT.md`, `CONTRIBUTING.md`, and other docs: update project name and badges.
3. Workspace packages:
   - Decide on a new scope (recommended): `@veriochi/*`.
   - For each package in `packages/`, update `package.json` `name` fields (e.g., `@plane/propel` -> `@veriochi/propel`) and update all internal import paths across the repo.
   - Use a codemod or search-and-replace tool (ripgrep + sed, or an IDE refactor) to update imports like `@plane/...`.
4. Update `pnpm-workspace.yaml` if you change scope patterns (only needed if you change directory structure — usually not necessary).
5. CI/CD and Dockerfiles:
   - Update any image names, labels, or references that include `plane`.
   - Update `docker-compose.yml` service names if you want the runtime service name to change.
6. Tests and type-checks: run the monorepo checks (`pnpm -w install`, `turbo run build`, `turbo run check`) and fix failing imports.
7. Create a PR and request reviews. Keep the rename in one PR per logical area if changes are large.

Automated replacement strategy (recommended)

- Use a two-step automated approach: first run a search-only pass to list all occurrences of `@plane`/`plane`.

  Example (ripgrep):

  ```powershell
  rg "@plane/|\bplane\b" -n --hidden
  ```

- Then run a cautious replacement using a multi-file replace tool (e.g., `git grep` + `perl` or an editor macro). Commit in small chunks.

Potential pitfalls

- Changing package names will require updates to Docker stages that rely on `turbo prune` and `pnpm` install. Ensure `pnpm-lock.yaml` is regenerated and CI caches updated.
- Search for literal `plane` in Python/Django settings, migrations or env keys. Some settings may use `PLANE_*` env names — decide whether to rename env names and update deploy scripts.
- Third-party integrations (analytics, sentry DSNs) may contain `plane` in project IDs; check external consoles before modifying monitored names.

Post-rename steps

1. Run full test suite and lint/type checks.
2. Regenerate lockfiles and container builds in CI.
3. Update any external docs, GitHub repo name (if you plan to rename the repository on GitHub or your host), and DNS entries if applicable.

If you want I can generate the exact replace commands and a small codemod (Node script) to safely rename package scopes and update imports across the repo. Say "Generate rename codemod" and I'll create it and a PR branch for you.
