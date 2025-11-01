## Development — how to run and iterate locally

Quick prerequisites

- Node >= 22.18.0 (root `package.json` specifies this).
- pnpm v7+ recommended (root `package.json` uses pnpm@10 in CI/Dockerfiles via corepack).
- Python 3.10+ for local Django development (Dockerfiles use Python 3.12 in containers).

Common quick-start (Docker Compose)

1. Copy environment files. The repo uses `.env` files referenced in `docker-compose.yml` and `apps/*/.env` files. Create a local `.env` at the repo root using the example env files.
2. Start compose: `docker compose up --build` (or `docker-compose -f docker-compose.yml up --build` on older setups).
3. Visit the web UI on `http://localhost:3000` (and admin on 3001 depending on compose ports).

Local iterative development (fast route)

1. At repo root run `pnpm -w install` to ensure workspace packages are linked.
2. Start a single app in dev mode, e.g., `pnpm --filter apps/web dev`.
3. For the backend, you can run Django locally in a Python venv and point to a local Postgres if you prefer not to run full compose.

Testing and checks

- Linting/formatting: run `pnpm -w dlx eslint .` or the repo's `turbo run check` script.
- Type checking: run `pnpm -w dlx tsc -b` or `pnpm -w dlx turbo run check` depending on monorepo setup.
- Python tests: `python -m pytest` from `apps/api` when dependencies are installed. Running these inside the `apps/api` container is faster if host setup differs.

Notes and troubleshooting

- If workspace packages fail to resolve, run `pnpm -w install` and `pnpm -w -s turbo prune --scope <app> --out-dir .` as required by Dockerfiles.
- Ensure your local Node version matches the Dockerfile’s Node version to avoid unexpected builds.
