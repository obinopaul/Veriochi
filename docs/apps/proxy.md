## apps/proxy — Caddy reverse proxy and edge routing

Purpose

`apps/proxy` provides a Caddy-based reverse proxy, TLS termination, and static-file serving where applicable.

Key files

- `apps/proxy/Caddyfile.ce` — Caddy configuration used for the CE build.
- `apps/proxy/Dockerfile.ce` — builds a custom Caddy binary with plugins (xcaddy).

Entrypoints & runtime

- This runs as a front-facing service in `docker-compose.yml` and routes traffic to the Next.js apps and the API.
- Ensure your proxy config forwards WebSocket connections (for `apps/live`) and health check paths used by orchestrators.

Env & ports

- Typically listens on 80/443 and reverse-proxies to internal container ports for `apps/web`, `apps/admin`, `apps/space`, and `apps/api`.

Troubleshooting

- TLS issues: verify certificates and ACME config in `Caddyfile.ce` or production-specific Caddyfiles in `deployments/`.
- WebSocket proxying: check `reverse_proxy` directive in Caddyfile includes `header_up` for `Connection` and `Upgrade` headers if necessary.

Deployment

Caddy may be built with custom plugins; the `apps/proxy/Dockerfile.ce` explains how the binary is produced. See `deployments/` for production proxy templates.
