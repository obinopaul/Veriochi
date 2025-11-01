## Deployment — docker-compose, Dockerfiles, and production notes

Local (compose)

- Use `docker-compose.yml` at the repository root for full local stacks (Postgres, Redis, RabbitMQ, MinIO, the web/admin/space frontends, the API and workers, and the live server).
- Bring up everything: `docker compose up --build` (Windows PowerShell: ensure Docker Desktop is running).

Production build pattern

1. Each app has a multi-stage `Dockerfile.*` that performs:
   - A prune step (`turbo prune`) to create a minimal production context.
   - Install dependencies via `pnpm` in a separate stage.
   - Build and output compiled assets into a runtime image.
2. CI: run `pnpm -w install`, `turbo run build`, build container images and push to a registry.

Important files

- `docker-compose.yml` — local orchestration and environment variable references.
- `apps/*/Dockerfile.*` — per-app multi-stage Docker build patterns. Check `apps/api/Dockerfile.api` for Python image and entry scripts.
- `apps/proxy/Dockerfile.ce` & `apps/proxy/Caddyfile.ce` — edge routing, TLS and static handling.

Deployment considerations

- Secrets & env: Do not store secrets in repo. Use a secret manager (Azure KeyVault, AWS Secrets Manager, HashiCorp Vault) for production.
- Database migrations: run `python manage.py migrate` as part of deploy or via a one-off migrator job (the repo includes migrator entry scripts).
- Worker and queue scaling: Celery workers connect to RabbitMQ. Scale worker replicas independently in container orchestrators.
- Storage: MinIO is used in local dev; in production use S3 or another managed object store.

Monitoring and logging

- Forward logs from containers to a centralized system (e.g., ELK, Datadog). `@plane/logger` may contain helpers to standardize structured logs.
- Add healthchecks to containers and use readiness/liveness probes in Kubernetes deployments.

AGPL license note

- The project is AGPL-3.0 licensed. If you deploy this service (even as SaaS), AGPL may require you to provide source code to users interacting with the service; consult legal before customizing for proprietary commercial use.

Deployments folder (what I found)
--------------------------------

The repository includes a `deployments/` directory with several templates and helper scripts for different hosting targets. I inspected `deployments/*/community` and summarized the important artifacts below. Use these templates as starting points for self-hosting or production packaging.

1) All-In-One (AIO)
- Path: `deployments/aio/community`
- Purpose: Build a single container that bundles all services (web, admin, space, API, live, proxy, workers) into one image for simple deployments and testing.
- Key files: `README.md`, `build.sh`, `variables.env`, `Dockerfile` and `start.sh`.
- How to use: The README contains quick-start docker run examples and required env vars (DATABASE_URL, REDIS_URL, AMQP_URL, AWS_*), and `build.sh` creates a `dist` folder and prints a `docker build` command. `variables.env` includes default env values you should review and override.
- Notes: AIO is convenient for quick single-host demos, but not ideal for scaling or HA. It still requires external Postgres/Redis/RabbitMQ/S3 unless configured to run them locally.

2) CLI / Docker Compose installer
- Path: `deployments/cli/community`
- Purpose: Opinionated installer for self-hosted deployments using Docker Compose (desktop or cloud VM). Includes a setup script that downloads release artifacts and manages lifecycle (install/start/stop/upgrade/backup).
- Key files: `install.sh` (interactive installer), `docker-compose.yml`, `variables.env`, `build.yml`, `images/`, `restore.sh`, `restore-airgapped.sh`, `migration-0.13-0.14.sh`.
- How to use: Run `install.sh`/`setup.sh` to download `docker-compose.yml` and `plane.env` (variables.env) and then `start` to bring up the stack. The installer supports building images locally for air-gapped or custom images.
- Notes: The installer includes helpful utility functions (health-checks, backup/restore, log viewing). Environment defaults and secrets are stored in the `plane.env` file — review before starting.

3) Kubernetes / Helm
- Path: `deployments/kubernetes/community`
- Purpose: Helm chart packaging for deploying to Kubernetes (community helm chart published to Artifact Hub).
- Key files: `README.md` with a link to the Helm chart on Artifact Hub. Use the `makeplane/plane-ce` chart for K8s deployments.
- How to use: Follow the Helm chart README and configure values (database, storage, ingress/hostnames, secrets). This is the recommended production path if you have a K8s cluster.

4) Docker Swarm
- Path: `deployments/swarm/community`
- Purpose: Scripts to deploy the stack on Docker Swarm with stack name support and helpers (deploy, remove, upgrade, view logs).
- Key files: `swarm.sh` — interactive deploy script that downloads compose and env files then runs `docker stack deploy` and waits for migrator and API readiness.
- Notes: Swarm deployment mirrors the compose-based layout but drives `docker stack` and supports stack name customization.

What I will do next
-------------------

- I will add short, actionable subsections to `docs/deployment.md` with example commands (compose, AIO build, helm install) and a checklist of env vars required for production (DB, Redis, MQ, S3, secrets, domain names). I will also surface the `restore` and `migration` scripts so you know how to perform upgrades and recovery.
- After that, I'll start the per-package deep docs you requested (prioritize `propel`, `editor`, `services`, `types`, `logger`, `typescript-config`, and `ui` if present).
## Actionable examples & checklists

### Quick: run the full stack with Docker Compose (local/dev)

PowerShell (recommended for Windows):

```powershell
# from repo root
docker compose up --build
```

Linux/macOS:

```bash
docker compose up --build
```

This starts Postgres, Redis, RabbitMQ, MinIO (if configured), the API, workers, the live server and Next.js frontends. Review `docker-compose.yml` for ports and env file references.

### All-In-One image (AIO) — build & run

Build (on a Linux host):

```bash
cd deployments/aio/community
./build.sh --release=vX.Y.Z --image-name=myorg/plane-aio
# follow printed docker build command (example shown by script)
```

Run (example):

```bash
docker run --name plane-aio -p 80:80 \
   -e DOMAIN_NAME=example.com \
   -e DATABASE_URL=postgresql://user:pass@db:5432/plane \
   -e REDIS_URL=redis://redis:6379 \
   -e AMQP_URL=amqp://user:pass@mq:5672/vhost \
   -e AWS_S3_BUCKET_NAME=uploads \
   myorg/plane-aio:latest
```

### CLI installer (Docker Compose) — quick self-host

The `deployments/cli/community/install.sh` script drives a small install UX that downloads the release `docker-compose.yml` and `plane.env` for the selected release, then starts the stack. Example:

```bash
cd deployments/cli/community
./install.sh        # interactive; choose Install -> Start
# or non-interactive: ./install.sh install
```

Files produced by the installer (default): `plane-app/docker-compose.yml` and `plane-app/plane.env` — review `plane.env` before `start`.

### Helm (Kubernetes)

The repo points to a community Helm chart. A minimal install looks like:

```bash
# add repo (if published)
helm repo add makeplane https://artifacthub.io/packages/helm/makeplane/plane-ce
helm repo update

# install with values file
helm install plane-ce makeplane/plane-ce -f ./my-values.yaml --namespace plane --create-namespace
```

Customize `my-values.yaml` for database, storage (S3), ingress host, TLS certs and secrets.

### Docker Swarm

Use the `deployments/swarm/community/swarm.sh` helper which downloads compose/env and runs `docker stack deploy`:

```bash
cd deployments/swarm/community
./swarm.sh deploy   # interactive; follow prompts to set stack name and deploy
```

## Checklist — required environment variables (core)

Populate these envs for production (names are examples — check `deployments/*/community/variables.env` or produced `plane.env` for exact keys):

- Database
   - `DATABASE_URL` (Postgres connection string)
- Cache/session
   - `REDIS_URL` (Redis connection string)
- Message broker
   - `AMQP_URL` or `RABBITMQ_*` vars
- Storage (S3/MinIO)
   - `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL` (for MinIO)
- Domain & TLS
   - `DOMAIN_NAME`, `SITE_ADDRESS`, `CERT_EMAIL` (if using ACME)
- Secrets
   - `SECRET_KEY` (Django secret), `LIVE_SERVER_SECRET_KEY`, `JWT_SECRET` (if present)
- App tuning
   - `API_KEY_RATE_LIMIT`, `FILE_SIZE_LIMIT`, `GUNICORN_WORKERS`

## Backup, restore & migrations

- The CLI installer includes `restore.sh` and `restore-airgapped.sh` for restore flows and `migration-0.13-0.14.sh` for older upgrades.
- Typical upgrade workflow (compose):
   1. Stop services.
   2. Replace `docker-compose.yml` and `plane.env` with new release files.
   3. Run migrator: the repo includes a `migrator` service (or run `docker compose run --rm api python manage.py migrate`).
   4. Start services.

Example migrator command (compose):

```bash
# run inside compose network
docker compose run --rm api ./bin/docker-entrypoint-migrator.sh
```

## Monitoring & production hardening

- Use a managed Postgres for persistence; schedule backups and point-in-time recovery.
- Use managed Redis for HA or Redis clusters with persistence if needed.
- Use object storage (S3) for uploads in production — MinIO is only recommended for local/dev.
- Use a secret manager instead of env files in production. For Kubernetes, create `Secrets` and reference them in the Helm values.
- Add centralized logging (e.g., forwarding to ELK/Datadog) and health probes for orchestrators.

## References (files I inspected)

- `deployments/aio/community/README.md`, `build.sh`, `variables.env`
- `deployments/cli/community/install.sh`, `docker-compose.yml`, `restore.sh`, `build.yml`
- `deployments/kubernetes/community/README.md` (Helm chart link)
- `deployments/swarm/community/swarm.sh`

- Annotated env example: `docs/deployment/plane.env.example.md` (production `plane.env` template and variable notes)

## Next steps I will take

- Expand `docs/deployment.md` further with an annotated `plane.env` example (mapping of variables to usage), and add a small subsection showing how to run a safe upgrade with backup.
- I will then start the app-level deep docs (starting with `apps/api` — Django settings and `apps/api/bin/*` scripts), then proceed to the other apps. If you'd like a different app order, tell me now.

