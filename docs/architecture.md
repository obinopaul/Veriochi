## Architecture — high level

This repo follows a modular monorepo architecture with clear separation of concerns.

- Monorepo orchestration: pnpm workspaces + Turbo (task runner/caching).
- Frontend: multiple Next.js apps in `apps/` (SSG, SSR and API routes where applicable).
- Backend: a Django project in `apps/api` for REST/GraphQL endpoints, migrations, and background workers.
- Realtime: a dedicated Node/TypeScript server (`apps/live`) handling collaborative state via Yjs/Hocuspocus.
- Proxy/edge: `apps/proxy` using Caddy for TLS and routing; production deployments often put a load balancer in front.
- Shared packages: `packages/` contains reusable UI components, services, types and configuration (e.g., `@plane/propel`, `@plane/ui`, `@plane/services`).

Data & infra

- Postgres for primary relational data (docker-compose: `plane-db`).
- Redis for caching and ephemeral stores (docker-compose: `plane-redis`).
- RabbitMQ for Celery task queues (docker-compose: `plane-mq`).
- MinIO for object storage in local/dev (docker-compose: `plane-minio`).

Build & deploy pattern

1. Local development uses `docker-compose.yml` to bring up services quickly with environment files.
2. Production images are built via multi-stage Dockerfiles in each app. They use `turbo prune` to build minimal production contexts and `pnpm` to install workspace packages.
3. CI (if present) typically runs `pnpm -w install`, `turbo run build`, and publishes artifacts or builds containers.

Notes

- The repo enforces Node >= 22.18.0 and uses pnpm v10 in Dockerfiles; make sure runners match.
- The project is licensed AGPL-3.0 — read `docs/license.md` for guidance before commercial reuse.
