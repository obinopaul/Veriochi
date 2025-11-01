# Annotated plane.env (example)

This file is an annotated example of the `plane.env` used by the deployment templates. Replace placeholders with secure values and store secrets in a secret manager for production. Each variable below includes a note pointing to where it is consumed in the codebase.

```bash
# -----------------------------
# Core
# -----------------------------
# Django secret key (apps/api/plane/settings/common.py)
SECRET_KEY=__REPLACE_WITH_STRONG_RANDOM_SECRET__

# Debug (0 = off, 1 = on). Production should be 0. (common.py / production.py)
DEBUG=0

# Comma-separated hosts Django should accept (common.py)
ALLOWED_HOSTS=example.com

# Base domain reused by proxy templates and certificates (deployments/*/variables.env)
APP_DOMAIN=example.com

# Release channel for published images (deployments/cli/community/variables.env)
APP_RELEASE=stable

# Primary API endpoint consumed by front-ends (deployments/cli/community/variables.env)
API_BASE_URL=https://api.example.com

# Restrict browser origins (common.py)
CORS_ALLOWED_ORIGINS=https://app.example.com,https://admin.example.com

# -----------------------------
# Database (Postgres)
# -----------------------------
# Primary DB connection; if set, `DATABASE_URL` is used by Django (common.py)
DATABASE_URL=postgresql://plane:plane@plane-db:5432/plane

# Alternatively (used when DATABASE_URL is empty): POSTGRES_* vars (common.py)
POSTGRES_DB=plane
POSTGRES_USER=plane
POSTGRES_PASSWORD=plane
POSTGRES_HOST=plane-db
POSTGRES_PORT=5432

# Docker volume location (deployments/*/docker-compose*.yml)
PGDATA=/var/lib/postgresql/data

# Optional read replica configuration (common.py)
ENABLE_READ_REPLICA=0
DATABASE_READ_REPLICA_URL=
POSTGRES_READ_REPLICA_HOST=
POSTGRES_READ_REPLICA_PORT=5432
POSTGRES_READ_REPLICA_DB=
POSTGRES_READ_REPLICA_USER=
POSTGRES_READ_REPLICA_PASSWORD=

# -----------------------------
# Redis (cache / sessions)
# -----------------------------
# Connection URL consumed by Django cache/session (common.py, redis.py)
REDIS_URL=redis://plane-redis:6379/0
# Host/port fallback for scripts and health checks (deployments/*/docker-compose*.yml)
REDIS_HOST=plane-redis
REDIS_PORT=6379

# -----------------------------
# Message broker (RabbitMQ / AMQP)
# -----------------------------
# AMQP_URL overrides individual RABBITMQ_* values when present (common.py)
AMQP_URL=amqp://plane:plane@plane-mq:5672/plane
# Individual fallback values (common.py)
RABBITMQ_HOST=plane-mq
RABBITMQ_PORT=5672
RABBITMQ_USER=plane
RABBITMQ_PASSWORD=plane
RABBITMQ_VHOST=plane

# -----------------------------
# Object storage (S3 / MinIO)
# -----------------------------
# Used by storage backend and presigned URL generation (common.py, storage.py)
USE_MINIO=1
MINIO_ENDPOINT_URL=http://minio:9000
MINIO_ENDPOINT_SSL=0
AWS_S3_ENDPOINT_URL=http://minio:9000
AWS_S3_BUCKET_NAME=uploads
AWS_ACCESS_KEY_ID=minio-access-key
AWS_SECRET_ACCESS_KEY=minio-secret-key
AWS_REGION=us-east-1

# -----------------------------
# App URLs and base paths (used for links, presigned URLs)
# -----------------------------
# Caddy listener configuration for HTTP/HTTPS proxy (deployments/*/variables.env)
SITE_ADDRESS=:80
TRUSTED_PROXIES=0.0.0.0/0
LISTEN_HTTP_PORT=80
LISTEN_HTTPS_PORT=443

# URLs exposed to clients (common.py)
WEB_URL=https://api.example.com
ADMIN_BASE_URL=https://admin.example.com
ADMIN_BASE_PATH=/god-mode/
SPACE_BASE_URL=https://app.example.com
SPACE_BASE_PATH=/spaces/
APP_BASE_URL=https://app.example.com
APP_BASE_PATH=/
LIVE_BASE_URL=https://live.example.com
LIVE_BASE_PATH=/live/

# Shared secret for live streaming service callbacks (apps/live, apps/api/plane/settings/live.py)
LIVE_SERVER_SECRET_KEY=__REPLACE_LIVE_SECRET__

# Instance metadata shown in changelog UI (apps/api/plane/license/utils/instance_value.py)
HARD_DELETE_AFTER_DAYS=60
INSTANCE_CHANGELOG_URL=

# -----------------------------
# Sessions and cookies (common.py)
# -----------------------------
SESSION_COOKIE_AGE=604800
SESSION_COOKIE_NAME=session-id
SESSION_SAVE_EVERY_REQUEST=0
ADMIN_SESSION_COOKIE_AGE=3600
COOKIE_DOMAIN=example.com

# -----------------------------
# Email and login providers
# -----------------------------
# SMTP host details powering outbound email (apps/api/plane/license/utils/instance_value.py)
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_HOST_USER=send@example.com
EMAIL_HOST_PASSWORD=__EMAIL_PASS__
EMAIL_USE_TLS=1
EMAIL_USE_SSL=0
# Friendly From header used across notifications (license/utils/instance_value.py)
EMAIL_FROM="Plane <notifications@example.com>"
# Custom backend path if overriding Django's default (common.py)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
# Master toggle for SMTP delivery; `0` falls back to console backend (license/api/views/configuration.py)
ENABLE_SMTP=1
# Allow password-based login or restrict to SSO/magic links (license/utils/instance_value.py)
ENABLE_EMAIL_PASSWORD=0
# Magic link auth toggle checked before issuing codes (authentication/provider/credentials/magic_code.py)
ENABLE_MAGIC_LINK_LOGIN=1
# Controls whether new end-user accounts may self-register (license/api/views/instance.py)
ENABLE_SIGNUP=1
# When `1`, only administrators can create workspaces (license/utils/instance_value.py)
DISABLE_WORKSPACE_CREATION=0

# -----------------------------
# Uploads and limits
# -----------------------------
# Max upload size and retention for incomplete assets (common.py)
FILE_SIZE_LIMIT=5242880
UNUPLOADED_ASSET_DELETE_DAYS=7

# -----------------------------
# Runtime tuning
# -----------------------------
# API container port and worker count (apps/api/bin/docker-entrypoint-api.sh)
PORT=8000
GUNICORN_WORKERS=4

# -----------------------------
# Third-party integrations
# -----------------------------
# Product analytics (apps/api/plane/license/utils/instance_value.py)
POSTHOG_API_KEY=
POSTHOG_HOST=
# Stock imagery integration (apps/api/plane/license/utils/instance_value.py)
UNSPLASH_ACCESS_KEY=
# Personal access token for GitHub API fallbacks (apps/api/plane/license/utils/instance_value.py)
GITHUB_ACCESS_TOKEN=
# GitHub App metadata for OAuth installs (apps/api/plane/authentication/provider/github.py)
GITHUB_APP_NAME=Veriochi
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
GITHUB_ORGANIZATION_ID=
# GitLab OAuth configuration (apps/api/plane/authentication/provider/gitlab.py)
GITLAB_HOST=https://gitlab.com
GITLAB_CLIENT_ID=
GITLAB_CLIENT_SECRET=
# Google OAuth client (apps/api/plane/authentication/provider/google.py)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
# Additional analytics endpoints (apps/api/plane/license/utils/instance_value.py)
ANALYTICS_SECRET_KEY=
ANALYTICS_BASE_API=
# Application performance monitoring (apps/api/plane/settings/scout.py)
SCOUT_MONITOR=0
SCOUT_KEY=
# Slack OAuth client ID for notifications (apps/api/plane/license/utils/instance_value.py)
SLACK_CLIENT_ID=
# Feature toggles surfaced in admin console (apps/admin/core/store/instance.store.ts)
IS_GOOGLE_ENABLED=0
IS_GITHUB_ENABLED=0
IS_GITLAB_ENABLED=0
IS_INTERCOM_ENABLED=0
# Intercom widget/app identifier (apps/api/plane/license/utils/instance_value.py)
INTERCOM_APP_ID=
# Optional MongoDB connection for analytics (common.py)
MONGO_DB_URL=
MONGO_DB_DATABASE=
# Enable OpenAPI schema generation (apps/api/plane/settings/drf.py)
ENABLE_DRF_SPECTACULAR=0

# -----------------------------
# LLM settings
# -----------------------------
# Default large language model provider used by AI features (apps/api/plane/settings/llm.py)
LLM_PROVIDER=openai
LLM_MODEL=gpt-4o-mini
LLM_API_KEY=

# -----------------------------
# AI / GPT (deprecated)
# -----------------------------
# Legacy OpenAI settings kept for backward compatibility (apps/api/plane/settings/llm.py)
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_API_KEY=sk-
GPT_ENGINE=gpt-3.5-turbo

# -----------------------------
# Deployment helpers
# -----------------------------
# Flags consumed by docker entrypoints and health checks (deployments/*)
DOCKERIZED=1
DOCKER_PLATFORM=
SKIP_ENV_VAR=1
# Test mode flag used in CI (apps/api/plane/settings/common.py)
IS_TEST=0
# Optional version string surfaced in UI (apps/api/plane/license/utils/instance_value.py)
APP_VERSION=2025.11.01

# -----------------------------
# Deployment scaling (docker-compose templates)
# -----------------------------
WEB_REPLICAS=1
SPACE_REPLICAS=1
ADMIN_REPLICAS=1
API_REPLICAS=1
WORKER_REPLICAS=1
BEAT_WORKER_REPLICAS=1
LIVE_REPLICAS=1

# -----------------------------
# Certificates / TLS automation (proxy/Caddy)
# -----------------------------
CERT_ACME_CA=https://acme-v02.api.letsencrypt.org/directory
CERT_EMAIL=ops@example.com
CERT_ACME_DNS=

# -----------------------------
# API key rate limit
# -----------------------------
# Controls per-key throttling in API rate limiter (apps/api/plane/settings/rest_framework.py)
API_KEY_RATE_LIMIT=60/minute

# -----------------------------
# Telemetry
# -----------------------------
# OTLP exporter configuration for observability (apps/api/plane/settings/otel.py)
SERVICE_NAME=plane-ce-api
OTLP_ENDPOINT=https://telemetry.plane.so
```

## Notes

- Do NOT commit secrets into the repository. Use a secrets backend (Vault, AWS Secrets Manager, Kubernetes Secrets) in production.
- `AMQP_URL` will override the RABBITMQ_* variables if present.
- If `USE_MINIO=1`, ensure the proxy (Caddy) has routes for direct uploads (see `apps/proxy` Caddyfile templates).
