# Docker development

This repository includes two Docker Compose definitions that let you boot the entire Veriochi stack locally. Use this guide as a map of the containers, how they rely on one another, and what each one is responsible for.

## Environment expectations

- Copy the root `.env.example` (or other provided sample files) to `.env`; this seeds credentials consumed by the infrastructure services.
- Duplicate `apps/api/.env.example` to `apps/api/.env` so the Django stack (API, workers, migrator) shares the same settings.
- When you run `docker compose` the named volumes declared at the bottom of the compose files (`pgdata`, `redisdata`, `uploads`, `rabbitmq_data`) retain database, cache, and object storage state between runs.

## Primary stack (`docker-compose.yml`)

Use `docker compose up --build` to start the production-like stack. The services below are grouped by responsibility.

| Service | Role | Notes |
| --- | --- | --- |
| `web` | Customer-facing Next.js frontend | Waits on `api`; served publicly through `proxy`. |
| `admin` | Administrative Next.js frontend | Depends on `api` and `web` to surface shared assets. |
| `space` | Workspace/tenant-facing Next.js frontend | Shares build artefacts with `web`; uses `api`. |
| `live` | Real-time collaboration frontend | Uses WebSocket endpoints exposed by Django and the message queue. |
| `api` | Django backend (Plane fork) | Starts via `bin/docker-entrypoint-api.sh`; handles REST/GraphQL, websocket routing, and background task dispatch. |
| `worker` | Celery worker | Runs long-lived tasks from `plane-mq`; shares code image with `api`. |
| `beat-worker` | Celery beat scheduler | Emits recurring jobs into the queue. |
| `migrator` | One-off migration runner | Executes database migrations against `plane-db` before the stack finishes booting. |
| `plane-db` | PostgreSQL 15 | Credentials pulled from `.env`; persistence via `pgdata`. |
| `plane-redis` | Valkey (Redis-compatible) | Backing store for cache, websockets, and Celery broker state. |
| `plane-mq` | RabbitMQ | Dedicated Celery message broker; console exposed on port `15672` by default inside the container. |
| `plane-minio` | MinIO S3-compatible storage | Stores uploaded files in the `uploads` volume; console on `9090` (internal). |
| `proxy` | Caddy-based reverse proxy | Terminates TLS locally and fans requests to `web`, `admin`, `space`, and `api`; exposes `${LISTEN_HTTP_PORT}`/`${LISTEN_HTTPS_PORT}` back to your host. |

The frontends share a multi-stage build pattern defined in their `apps/*/Dockerfile.*` files. Each image bundles the compiled Next.js output so you do not need Node.js on the host. The Django-flavoured services reuse the same image but override the entrypoint scripts (`./bin/docker-entrypoint-*.sh`) to run the correct Celery or management process.

## Developer-focused stack (`docker-compose-local.yml`)

Use `docker compose -f docker-compose-local.yml up` when you want mounted source code and hot reload for the backend. Key differences:

- The `api`, `worker`, `beat-worker`, and `migrator` services mount `./apps/api` into `/code` and use `Dockerfile.dev`, so changes on your host refresh immediately without rebuilding the image.
- Frontend services (`web`, `space`, `admin`, `live`, `proxy`) are commented out by default; uncomment the blocks if you want containerised frontends with volume mounts and dev servers.
- Infrastructure containers (`plane-db`, `plane-redis`, `plane-mq`, `plane-minio`) are identical to the primary stack but publish their default ports to your host for direct inspection (for example, Postgres on `5432`, MinIO on `9000`/`9090`).
- The compose file defines a `dev_env` bridge network so you can connect additional tooling containers without polluting the default Docker network namespace.

## Working with the stack

- Run `docker compose up --build proxy` if you only need the reverse proxy and frontends; Docker will pull up the dependencies automatically.
- Use `docker compose run --rm migrator` to re-apply database migrations after changing Django models.
- Check container logs with `docker compose logs -f <service>`; the Celery worker logs will reveal task-level failures and retries.
- To reset state, remove named volumes with `docker compose down --volumes`; persistent caches and database data will be recreated the next time you boot the stack.
- If you need to inspect services from the host (for example, connecting `psql` to PostgreSQL), prefer the local compose file because it maps standard ports without the reverse proxy in the way.

Refer back to this document whenever you need to trace an HTTP request or background task through the containers—the dependencies here mirror the order Docker Compose enforces when bringing the stack online.
