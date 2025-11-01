## Apps — what each app does and how to run it

This page describes the top-level `apps/` folders and how they are typically run.

1) `apps/web`
- Purpose: The main public-facing Next.js application (site, marketing, or product UI).
- Where to look: `apps/web/package.json`, `apps/web/app` (Next 13+ app dir), `apps/web/next.config.js`.
- Local run (dev): from repo root `pnpm --filter apps/web dev` or `turbo run dev --filter=apps/web`.
- Production build: `pnpm --filter apps/web build` then `pnpm --filter apps/web start` or build Docker image using `apps/web/Dockerfile.web`.
- Notes: Uses workspace packages (e.g., `@plane/ui`, `@plane/services`) — make sure to run `pnpm -w install`.

2) `apps/admin`
- Purpose: Admin dashboard for site management and operational tooling.
- Where to look: `apps/admin/package.json`, `apps/admin/app`.
- Run similarly to `apps/web` but commonly on a different port (3001 in Dockerfiles).

3) `apps/space`
- Purpose: a scoped Next.js app, often for an embeddable or workspace-focused UI.
- Run and build like the other Next.js apps.

4) `apps/live`
- Purpose: Dedicated realtime server (Node/TypeScript). It manages collaborative sessions and shared document state.
- Where to look: `apps/live/src` and `apps/live/package.json` (entrypoint for runtime sits in `dist/start.js`).
- Dev run: `pnpm --filter apps/live dev` (or run `ts-node`/`vite` dev mode inside `apps/live`).
- Production: build with `pnpm --filter apps/live build` and run with `node dist/start.js`, or use `apps/live/Dockerfile.live` in containerized deployments.

5) `apps/api`
- Purpose: Django backend for REST APIs, auth, migrations, and background worker tasks.
- Where to look: `apps/api/manage.py`, `apps/api/pyproject.toml`, `apps/api/Dockerfile.api`, `apps/api/bin/*` (entry scripts).
- Dev run: Typically via `docker-compose` (starts DB, Redis, MQ, then Django). You can also run locally with a Python virtualenv: `python -m venv .venv && .venv\Scripts\Activate.ps1 && pip install -r requirements.txt && python manage.py runserver`.
- Workers: Celery workers/beat are started with entry scripts in `apps/api/bin` and use RabbitMQ as the broker.

6) `apps/proxy`
- Purpose: Caddy-based HTTP proxy and TLS termination. Useful in local and production routing.
- Where to look: `apps/proxy/Caddyfile.ce` and `apps/proxy/Dockerfile.ce`.

Tips
- Environment files: many apps read `.env` or `apps/*/.env` files. Check Dockerfiles and `docker-compose.yml` for exact env vars.
- Ports: `apps/web` (3000), `apps/admin` (3001), `apps/space` (3002) are typical defaults in docker-compose.
