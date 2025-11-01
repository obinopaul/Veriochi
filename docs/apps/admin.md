## apps/admin — admin dashboard (Next.js)

Purpose

`apps/admin` is the administrative UI for management tasks, user/account operations, and product monitoring. It's a Next.js app structured similarly to `apps/web` but tailored to internal workflows.

Key files

- `apps/admin/package.json` — entry scripts and workspace dependencies.
- `apps/admin/app/` or `apps/admin/pages/` — admin UI source.
- `apps/admin/Dockerfile.admin` — Dockerfile used by compose and production images.

Entrypoints & runtime

- Dev: `pnpm --filter apps/admin dev`.
- Build: `pnpm --filter apps/admin build` and `pnpm --filter apps/admin start`.

Env vars & ports

- Typical port: 3001 in compose.
- Authentication tokens and admin feature flags are often present as env vars — check `apps/admin/.env` and `docker-compose.yml` for names.

Troubleshooting

- If admin pages are failing with 404s after build, confirm correct Next.js route exports and `next.config.js` rewrites.
- If the admin can't reach the API, verify `NEXT_PUBLIC_API_URL` or corresponding env vars.

Deployment notes

See `docs/deployment.md` and `deployments/` for how this app is built and deployed in production clusters.
