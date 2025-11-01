## apps/web — main public Next.js app

Purpose
-------

`apps/web` is the primary public-facing Next.js application. It serves the product UI, pages, and may host client-side integrations.

Key files
---------

- `apps/web/package.json` — scripts and workspace dependencies.
- `apps/web/next.config.js` — Next.js configuration (image domains, runtime config, rewrites).
- `apps/web/app/` or `apps/web/pages/` — application source (Next 13 app dir or pages directory).
- `apps/web/public/` — static assets.
- `apps/web/.env` — env file (not committed) used in local/dev.
- `apps/web/Dockerfile.web` — multi-stage Dockerfile used for production builds.

Entrypoints & runtime
---------------------

- Development: `pnpm --filter apps/web dev` (or from root `pnpm -w dlx turbo run dev --filter=apps/web`).
- Production build: `pnpm --filter apps/web build` then `pnpm --filter apps/web start` or run the image built with `apps/web/Dockerfile.web`.
- Docker image runtime typically runs Node and serves the built Next.js server (check the Dockerfile for exact command).

Important env vars & ports
--------------------------

- Typical dev port: 3000 (check `docker-compose.yml` or `apps/web/package.json` scripts).
- `NEXT_PUBLIC_API_URL` or similar — points to the backend API; confirm exact variable names in code or `next.config.js`.

Common troubleshooting
----------------------

- Missing workspace packages: run `pnpm -w install` at repo root.
- Type errors after package updates: run `pnpm -w dlx tsc -b` or `turbo run check`.
- Production Docker build fails: ensure `pnpm-lock.yaml` is up to date and the local Node version matches the Dockerfile's major version.

Where to find deployment notes
------------------------------

See `docs/deployment.md` and the `deployments/` folder root (subfolders: `aio/`, `cli/`, `kubernetes/`, `swarm/`) for deployment strategies and environment specifics.
