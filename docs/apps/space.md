## apps/space — workspace / embeddable UI

Purpose

`apps/space` appears to be a workspace-focused Next.js application. It may provide per-tenant workspaces, embeddable boards, or a variant of the main product UI.

Key files

- `apps/space/package.json` — scripts and dependencies.
- `apps/space/app/` or `apps/space/pages/` — source code.
- `apps/space/Dockerfile.space` — Dockerfile.

Entrypoints & runtime

- Dev: `pnpm --filter apps/space dev`.
- Build: `pnpm --filter apps/space build` and `pnpm --filter apps/space start`.

Env & ports

- Typical port: 3002 in compose.
- Check for `NEXT_PUBLIC_SPACE_*` env vars for feature toggles and API endpoints.

Troubleshooting

- If embeddable scripts or cross-origin frames fail, check CORS and allowed `next.config.js` headers.

Deployment

See `docs/deployment.md` and the `deployments/` folder for details about production packaging and environment.
