# Safe upgrade & rollback guide

This guide shows recommended, low-risk steps to upgrade a running deployment of this repo (Plane/Veriochi). It covers Docker Compose (CLI/AIO), Docker Swarm and Kubernetes/Helm. Follow the checklist exactly and validate backups before proceeding.

## Before you start (must-do checks)

- Validate you have a recent, complete backup of Postgres. For example:

```bash
# using docker-compose named service `plane-db`
docker exec -t plane-db pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > /backups/plane-$(date +%F).sql

# or using pg_dump from host (replace values)
PGPASSWORD="$POSTGRES_PASSWORD" pg_dump -h $POSTGRES_HOST -U $POSTGRES_USER -Fc $POSTGRES_DB -f plane-$(date +%F).dump
```

- Snapshot MinIO / S3 data (if used). With MinIO `mc`:

```bash
mc alias set local http://minio:9000 $AWS_ACCESS_KEY_ID $AWS_SECRET_ACCESS_KEY
mc mirror --overwrite local/${AWS_S3_BUCKET_NAME} /backups/minio-${DATE}/
```

- Export Redis (if using persistence): create an RDB save or copy the RDB file from the Redis volume.
- Note: for managed services (AWS RDS, S3, Elasticache), use the provider snapshot API.

## High-level safe-upgrade checklist (Compose)

1. Put the system into maintenance mode (if supported) or notify users not to write data.

1. Stop non-essential workers to avoid background jobs mutating data during migrations:

```bash
docker compose stop worker beat
```

1. Pull or build the new images and update `docker-compose.yml` and `plane.env` as needed.

1. Run database migrations with the migrator container (runs `manage.py migrate`):

```bash
docker compose run --rm api ./bin/docker-entrypoint-migrator.sh
```

1. If migrations succeed, start the updated services:

```bash
docker compose up -d --no-deps --build api web live proxy worker beat
```

1. Run smoke tests (API health, login, basic read/write flows, file upload). Example health check:

```bash
curl -f -s https://api.example.com/health || echo "health check failed"
```

1. Re-enable background workers and monitor queues closely:

```bash
docker compose start worker beat
```

1. Monitor logs, database integrity, and error rates for at least a short window before marking the upgrade complete.

## Rolling back (Compose)

- If migration failed or critical errors are found, revert to the previous state by:

1. Stop updated services:

```bash
docker compose down
```

1. Restore the Postgres snapshot:

```bash
# example (custom format)
pg_restore -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB -c plane-YYYY-MM-DD.dump
```

1. Restore MinIO/S3 objects (if needed) and Redis from RDB snapshot.

1. Start the previous images (keep an archive of the previous `docker-compose.yml` and images/tags).

Notes on rollback: If you cannot revert DB schema safely (destructive migrations), you may need to run compensating migrations or data transforms. Plan irreversible migrations carefully.

## Swarm

- Use the `deployments/swarm/community/swarm.sh` helper to fetch/prepare the stack, then use `docker stack deploy`.
- Similar approach: snapshot databases, deploy new stack to a new stack name first if possible, test, then switch traffic.

## Kubernetes / Helm

- For Helm releases:
  - Create DB backups as above.
  - Update your Helm values and use `helm upgrade --install`.
  - Run migrations as a Kubernetes Job or run a one-off Pod that executes `python manage.py migrate`. Example:

```bash
kubectl run migrator --rm -it --image=myorg/plane-api:NEWTAG -- /bin/sh -c "./bin/docker-entrypoint-migrator.sh"
```

- If migration fails, rollback the release with `helm rollback <release> <revision>` and restore DB from backup.

## Smoke tests (example checklist)

- /health endpoint returns 200
- Basic login flow works (token or session)
- Create / read / update / delete a small record in API
- Upload a small file and retrieve it with presigned URL

## Monitoring & post-upgrade checks

- Inspect logs (`docker compose logs -f api`, `kubectl logs`) for errors.
- Monitor task queue lengths (RabbitMQ UI) and worker throughput.
- Monitor DB for long-running transactions or missing indexes after migrations.

## Final notes and best practices

- Always test the full upgrade flow in a staging environment using production-like data before touching production.
- Keep an immutable archive of previous image tags and `docker-compose.yml` files for quick rollbacks.
- Prefer backward-compatible migrations (add columns, backfill data, then switch code paths in a second release) to reduce rollback risk.
