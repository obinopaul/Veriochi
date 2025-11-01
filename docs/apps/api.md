# apps/api (Django) — summary

Purpose

- Backend API for the monorepo (Django + ASGI). Provides REST endpoints, background tasks (Celery), file uploads (S3/MinIO), and admin UI.

Quick contract (inputs / outputs)

- Inputs: HTTP requests (JSON), Web requests from frontends, DB (Postgres), broker (RabbitMQ), object storage (S3/MinIO).
- Outputs: JSON responses, background job results, uploaded files to S3, metrics/logs.
- Error modes: DB unavailable, broker unavailable, storage misconfigured, migrations missing.

Entrypoints & run commands

- `manage.py` (default DJANGO_SETTINGS_MODULE -> `plane.settings.production`)
- Production container entry: `apps/api/bin/docker-entrypoint-api.sh`

  Steps performed by the entry script:

  1. `python manage.py wait_for_db` and `wait_for_migrations` to block until services are ready.
  2. Register the instance, configure instance, create default bucket, clear cache (via `manage.py` commands).
  3. Exec Gunicorn: `gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:${PORT:-8000}`

- Migrator: `apps/api/bin/docker-entrypoint-migrator.sh`

  Runs `python manage.py wait_for_db` then `python manage.py migrate`.

- Worker / Beat entry scripts exist: `docker-entrypoint-worker.sh`, `docker-entrypoint-beat.sh` (run Celery worker/beat respectively).

Environment variables (core, from `.env.example`)

- `DATABASE_URL` (constructed from POSTGRES_* settings) — Postgres connection string
- `REDIS_URL` — Redis connection string
- `RABBITMQ_*` (host/port/user/password/vhost) or `AMQP_URL` — message broker
- `AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_S3_BUCKET_NAME`, `AWS_S3_ENDPOINT_URL` — object storage (MinIO/S3)
- `DEBUG` — 0/1
- `GUNICORN_WORKERS` — number of gunicorn workers
- `PORT` — bind port (container defaults to 8000)
- `LIVE_SERVER_SECRET_KEY` — secret for live server integrations
- `FILE_SIZE_LIMIT` — max upload size

Developer commands

- Local quick run (compose): `docker compose up --build` from repo root (starts api plus dependencies)
- Run migrations locally: `docker compose run --rm api ./bin/docker-entrypoint-migrator.sh` or `docker compose run --rm api python manage.py migrate`
- Shell into api container: `docker compose run --rm api bash` then run `python manage.py` commands as needed.

Troubleshooting notes

- If `wait_for_db` never returns: verify `DATABASE_URL` and that Postgres is reachable from the network the container uses.
- If uploads fail: check AWS_* / MINIO endpoint and proxy upload routing in `apps/proxy` / Caddy config.
- If Celery tasks don't run: verify `RABBITMQ_*` and that worker containers are started.

Next steps (what I'll add to docs)

- Add an annotated `apps/api` env example mapping each env variable to code locations (settings modules) and where it's used.
- Add common troubleshooting logs and sample `docker compose` commands for backups and safe upgrades.

## apps/api — Django backend

Purpose

`apps/api` implements the backend services: REST endpoints, authentication, migrations, and background workers (Celery).

Key files

- `apps/api/pyproject.toml` — Python project metadata and tooling.
- `apps/api/manage.py` — Django management entrypoint.
- `apps/api/Dockerfile.api` — Dockerfile used to create the API image (Python 3.12 in repo Dockerfile).
- `apps/api/bin/` — entry scripts for `api`, `worker`, `beat` and `migrator` (check these scripts for startup ordering and environment expectations).
- `apps/api/settings/` — Django settings (often split into `base.py`, `development.py`, `production.py` — find exact layout in repo).

Entrypoints & runtime

- Local dev via Docker Compose: `docker compose up` will start `apps/api` alongside Postgres, Redis, RabbitMQ.
- To run locally without Docker: create a Python virtualenv, install `requirements.txt` (or use `pyproject.toml` tooling), then `python manage.py runserver`.
- Workers: Celery workers are started via entry scripts and connect to RabbitMQ (broker) and Redis (maybe result backend).

Env vars & important settings

- Database: `DATABASE_URL` or `POSTGRES_*` env vars from `docker-compose.yml`.
- `DJANGO_SETTINGS_MODULE` — points to the right settings file for the environment.
- Celery-related env vars: `CELERY_BROKER_URL`, `CELERY_RESULT_BACKEND`.

Common troubleshooting

- Migration errors: run `python manage.py migrate` inside the API environment or container. There's often a `migrator` entry job in `apps/api/bin`.
- Dependency mismatch: ensure Python versions in local venv match the Dockerfile’s Python version (3.12 in container) or use the container for consistency.
- Worker not processing tasks: check RabbitMQ connectivity, queue names, and Celery logs.

Security notes

- Ensure secret keys and database passwords are stored in a secrets manager in production, not in env files checked into the repo.

Deployment

Check `deployments/` subfolders for production templates and `apps/api/Dockerfile.api` for runtime instructions. See `docs/deployment.md`.

## Annotated environment-variable mapping (settings references)

Below are the primary environment variables the `apps/api` service reads, and where they are referenced in the codebase (useful when building `plane.env` or migrating to secrets manager):

- SECRET_KEY
  - Where used: `apps/api/plane/settings/common.py` (SECRET_KEY default via `get_random_secret_key()`)
  - Purpose: Django secret key; required in production.

  Example (apps/api/plane/settings/common.py):

  ```python
  SECRET_KEY = os.environ.get("SECRET_KEY", get_random_secret_key())
  ```

- DEBUG
  - Where used: `apps/api/plane/settings/common.py`, `apps/api/plane/settings/production.py`
  - Purpose: toggles debug/logging modes and influences `LOGGING` and other dev-only behavior.

  Examples:

  ```python
  # common.py
  DEBUG = int(os.environ.get("DEBUG", "0"))

  # production.py
  DEBUG = int(os.environ.get("DEBUG", 0)) == 1
  ```

- ALLOWED_HOSTS
  - Where used: `apps/api/plane/settings/common.py` (populated from `ALLOWED_HOSTS` env)
  - Purpose: Django hosts whitelist.

- DATABASE_URL / POSTGRES_* (POSTGRES_DB, POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_HOST, POSTGRES_PORT)
  - Where used: `apps/api/plane/settings/common.py` — `DATABASES` is sourced from `DATABASE_URL` (via dj_database_url) or the POSTGRES_* variables.
  - Purpose: Postgres connection settings for the Django DB.

  Example (apps/api/plane/settings/common.py):

  ```python
  if bool(os.environ.get("DATABASE_URL")):
    DATABASES = {"default": dj_database_url.config()}
  else:
    DATABASES = {
      "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": os.environ.get("POSTGRES_DB"),
        "USER": os.environ.get("POSTGRES_USER"),
        # ...
      }
    }
  ```

- ENABLE_READ_REPLICA / DATABASE_READ_REPLICA_URL / POSTGRES_READ_REPLICA_*
  - Where used: `apps/api/plane/settings/common.py`
  - Purpose: Optional read-replica config and DB router.

- REDIS_URL
  - Where used: `apps/api/plane/settings/common.py` (CACHES and REDIS_SSL detection), `apps/api/plane/settings/redis.py` (redis connection helper)
  - Purpose: Redis connection for cache/session; if contains `rediss` the code enables SSL path.

  Example (apps/api/plane/settings/common.py):

  ```python
  REDIS_URL = os.environ.get("REDIS_URL")
  REDIS_SSL = REDIS_URL and "rediss" in REDIS_URL
  ```

  And the helper (apps/api/plane/settings/redis.py):

  ```python
  if settings.REDIS_SSL:
      ri = redis.Redis(..., ssl=True, ...)
  else:
      ri = redis.Redis.from_url(settings.REDIS_URL, db=0)
  ```

- RABBITMQ_HOST, RABBITMQ_PORT, RABBITMQ_USER, RABBITMQ_PASSWORD, RABBITMQ_VHOST, AMQP_URL
  - Where used: `apps/api/plane/settings/common.py` (builds `CELERY_BROKER_URL`; AMQP_URL overrides individual RABBITMQ_* variables)
  - Purpose: Celery/broker configuration (RabbitMQ).

  Example (apps/api/plane/settings/common.py):

  ```python
  RABBITMQ_HOST = os.environ.get("RABBITMQ_HOST", "localhost")
  AMQP_URL = os.environ.get("AMQP_URL")

  if AMQP_URL:
      CELERY_BROKER_URL = AMQP_URL
  else:
      CELERY_BROKER_URL = f"amqp://{RABBITMQ_USER}:{RABBITMQ_PASSWORD}@{RABBITMQ_HOST}:{RABBITMQ_PORT}/{RABBITMQ_VHOST}"
  ```

- AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, AWS_REGION, AWS_S3_ENDPOINT_URL, MINIO_ENDPOINT_URL, USE_MINIO, MINIO_ENDPOINT_SSL
  - Where used: `apps/api/plane/settings/common.py` (STORAGES, AWS_* defaults) and `apps/api/plane/settings/storage.py` (S3Storage uses these envs and builds boto3 client)
  - Purpose: object storage (S3 or MinIO) credentials, endpoint and bucket settings used for uploaded files, presigned URLs, and storage backend.

  Examples:

  ```python
  # common.py
  AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID", "access-key")
  AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL", None) or os.environ.get("MINIO_ENDPOINT_URL", None)
  
  # storage.py (S3Storage.__init__)
  self.aws_access_key_id = os.environ.get("AWS_ACCESS_KEY_ID")
  self.aws_s3_endpoint_url = os.environ.get("AWS_S3_ENDPOINT_URL") or os.environ.get("MINIO_ENDPOINT_URL")
  ```

- FILE_SIZE_LIMIT
  - Where used: `apps/api/plane/settings/common.py` (FILE_SIZE_LIMIT and DATA_UPLOAD_MAX_MEMORY_SIZE)
  - Purpose: Max upload file size enforced by settings and presigned POST generation.

  ```python
  FILE_SIZE_LIMIT = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))
  DATA_UPLOAD_MAX_MEMORY_SIZE = int(os.environ.get("FILE_SIZE_LIMIT", 5242880))
  ```

- GUNICORN_WORKERS
  - Where used: `apps/api/bin/docker-entrypoint-api.sh` (used when launching Gunicorn)
  - Purpose: Number of gunicorn worker processes in production container.

  Example (apps/api/bin/docker-entrypoint-api.sh):

  ```bash
  exec gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:"${PORT:-8000}"
  ```

- PORT
  - Where used: `apps/api/bin/docker-entrypoint-api.sh` (bind port fallback `${PORT:-8000}`)
  - Purpose: container bind port for the API service.

- LIVE_SERVER_SECRET_KEY
  - Where used: seen in `apps/api/.env.example` and referenced by live integrations and `apps/live` service (integration point)
  - Purpose: shared secret between API and live server for auth/signing.

- CORS_ALLOWED_ORIGINS
  - Where used: `apps/api/plane/settings/common.py` (CORS_ALLOWED_ORIGINS parsed into `CORS_ALLOWED_ORIGINS` or `CORS_ALLOW_ALL_ORIGINS`)
  - Purpose: Allowed origins for cross-site requests from frontends.

  Example (apps/api/plane/settings/common.py):

  ```python
  cors_origins_raw = os.environ.get("CORS_ALLOWED_ORIGINS", "")
  cors_allowed_origins = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]
  if cors_allowed_origins:
      CORS_ALLOWED_ORIGINS = cors_allowed_origins
  else:
      CORS_ALLOW_ALL_ORIGINS = True
  ```

- ADMIN_BASE_URL, SPACE_BASE_URL, APP_BASE_URL, LIVE_BASE_URL and corresponding *_BASE_PATH
  - Where used: `apps/api/plane/settings/common.py` (used to build base URLs and UI links)
  - Purpose: External URL configuration for admin/space/app/live frontends; used when composing presigned URLs or email links.

- POSTHOG_API_KEY, POSTHOG_HOST, ANALYTICS_SECRET_KEY, ANALYTICS_BASE_API, UNSPLASH_ACCESS_KEY, GITHUB_ACCESS_TOKEN
  - Where used: `apps/api/plane/settings/common.py`
  - Purpose: Third-party integrations (analytics, imagery, GitHub integrations).

- MONGO_DB_URL, MONGO_DB_DATABASE
  - Where used: `apps/api/plane/settings/common.py` (environment flags) and `apps/api/plane/settings/mongo.py` (MongoConnection)
  - Purpose: Optional MongoDB support used by parts of the codebase; if unset Mongo is disabled.

- ENABLE_DRF_SPECTACULAR
  - Where used: `apps/api/plane/settings/common.py` (toggles DRF Spectacular and imports `openapi.py`)
  - Purpose: controls whether OpenAPI generation is enabled.

Notes and recommendations

- Many of these envs contain secrets (DB password, AWS keys, SECRET_KEY). For production, place them in a secrets manager (or Kubernetes Secrets) and avoid committing to files checked into the repo.
- For local development, `apps/api/.env.example` contains sensible defaults and compose templates reference these values; prefer using the compose-managed env file when testing locally.
- When renaming the project (Plane → Veriochi), you will need to update hard-coded values like `DJANGO_SETTINGS_MODULE` references (they currently point to `plane.settings.*`), logging names (e.g., SCOUT_NAME = "Plane"), and any docs or template strings that include the product name or domain (e.g., `developers.plane.so` in `openapi.py`).

I'll now add the annotated env block to `docs/apps/api.md` (done) and then expand it with direct links to the exact setting lines (where helpful) as a follow-up.
