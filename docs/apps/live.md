## apps/live — realtime collaboration server (Node/TypeScript)

Purpose

`apps/live` is a Node/TypeScript realtime server responsible for collaborative sessions, shared document state (Yjs/CRDT), and WebSocket/HTTP signaling.

Key files

- `apps/live/package.json` — scripts, build and start commands.
- `apps/live/src/` — server source files.
- `apps/live/Dockerfile.live` — production Dockerfile.
- `apps/live/dist/start.js` — compiled runtime entrypoint (after `pnpm build`).

Entrypoints & runtime

- Dev: `pnpm --filter apps/live dev` (may use `ts-node` or Vite in dev mode).
- Build: `pnpm --filter apps/live build` and run `node dist/start.js` in production.

Env vars & ports

- Check `apps/live/.env` or `docker-compose.yml` for variables like `LIVE_PORT`, `REDIS_URL`, `JWT_SECRET`, and other connection details.

Common troubleshooting

- If sessions fail to sync, check Redis and persistence backends used for awareness or presence.
- If WebSocket connections are dropped behind a proxy, ensure `apps/proxy` forwards WebSocket (Caddy config) and that sticky sessions or a pub/sub layer (Redis) is configured.

Deployment notes

The realtime server should be deployed with autoscaling in mind. If using multiple replicas, use a shared pub/sub (Redis or dedicated backend) for state sync or a persistor compatible with Yjs.

See `docs/deployment.md` and `deployments/` for cluster templates and production tuning.
