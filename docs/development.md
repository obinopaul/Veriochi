# Development — how to run and iterate locally

Quick prerequisites

- Node >= 22.18.0 (root `package.json` specifies this).
- pnpm v7+ recommended (root `package.json` uses pnpm@10 in CI/Dockerfiles via corepack).
- Python 3.10+ for local Django development (Dockerfiles use Python 3.12 in containers).

Common quick-start (Docker Compose)

1. Copy environment files. The repo uses `.env` files referenced in `docker-compose.yml` and `apps/*/.env` files. Create a local `.env` at the repo root using the example env files.
2. Start compose: `docker compose up --build` (or `docker-compose -f docker-compose.yml up --build` on older setups).
3. Visit the web UI on `http://localhost:3000` (and admin on 3001 depending on compose ports).

Local iterative development (fast route)

1. At repo root run `pnpm -w install` to ensure workspace packages are linked.
2. Start a single app in dev mode, e.g., `pnpm --filter apps/web dev`.
3. For the backend, you can run Django locally in a Python venv and point to a local Postgres if you prefer not to run full compose.

## Running individual apps in separate terminals

1. Start the shared services: `docker compose -f docker-compose-local.yml up plane-db plane-redis plane-mq plane-minio` keeps Postgres, Redis/Valkey, RabbitMQ, and MinIO available while you work. Leave this command running in its own terminal tab.
2. Open a new terminal tab per app you want to hack on and run the corresponding pnpm script from the repo root:

   | App | Command | Default port | Notes | Detailed description |
   | --- | --- | --- | --- | --- |
   | Public web (`apps/web`) | `pnpm --filter ./apps/web dev` | 3000 | Next.js dev server with hot reload. | Full product surface for signed-in users: renders the workspace shell, navigation, dashboards, issue layouts (kanban, list, calendar, gantt, spreadsheet), project settings, and user profile flows. Uses the App Router with server components, MobX stores under `core/store`, and SWR-backed data hooks to orchestrate project data from the API. All customer-facing experiential work happens here, including feature flag evaluation, onboarding walkthroughs, and integrations surfaced via `@plane/ui` primitives. |
   | Admin console (`apps/admin`) | `pnpm --filter ./apps/admin dev` | 3001 | Shares components with `apps/web`; keep API running. | Administrative control plane for operators and support staff. Provides user/account lifecycle actions, tenant provisioning, plan enforcement, impersonation tools, and system monitoring dashboards. Mirrors the main web app’s component stack but exposes privileged routes guarded by admin auth middleware and relies heavily on `@plane/services` for elevated API endpoints. |
   | Workspace UI (`apps/space`) | `pnpm --filter ./apps/space dev` | 3002 | Loads tenant views; requires correct API base URL. | Slimmed Next.js client aimed at embeddable or publicly shareable boards. Hosts read-focused issue layouts, share links, and minimal authentication (magic links / tokens) so workspaces can publish boards to external audiences. Reuses the same MobX stores but toggles features via publish settings and environment flags so it can run inside iframes or partner portals. |
   | Realtime server (`apps/live`) | `pnpm --filter apps/live dev` | 4000 (check `.env`) | Watches TypeScript with `tsdown`; restarts Node on rebuild. Build its workspace deps once with `pnpm -r --filter @plane/logger --filter @plane/decorators --filter @plane/editor --filter @plane/types build`. | Node/Express Hocuspocus server that backs collaborative editing in the rich-text editor. Boots Redis, the Yjs collaborative engine, controller decorators, and structured logging to bridge websocket clients with durable state. Exposes health/docs endpoints through `@plane/decorators`, enforces CORS/helmet, and coordinates document lifecycle, awareness updates, and persistence adapters so editor sessions stay synchronized. |
   | UI library (`packages/ui`) | `pnpm --filter @plane/ui dev` | n/a | Rebuilds shared components; frontends pick up changes automatically. | Central design system and component kit consumed by every Next.js surface. Ships Tailwind-driven primitives, form controls, layout shells, modals, and iconography that the apps register through Turborepo pipelines. Running the dev watcher allows instant feedback when tweaking tokens, theming, or complex widgets like kanban cards and dashboard tiles. |

3. For the Django API stack open another tab:

   - Option A (containers): `docker compose -f docker-compose-local.yml up api worker beat-worker` to run gunicorn, Celery worker, and beat with live code mounts.
   - Option B (host Python): inside `apps/api`, create a venv (`python -m venv .venv && .\.venv\Scripts\activate` on Windows), install deps (`pip install -r requirements.txt`), and run `python manage.py runserver 0.0.0.0:8000`. Start Celery with `celery -A plane worker -l info` in another tab if you need background jobs.

4. Keep `apps/*/.env` files in sync so each app points at the correct API (`NEXT_PUBLIC_API_URL`, `SPACE_BASE_URL`, etc.). Refer to `docs/apps/*.md` for the precise environment variables.

Tip: if you prefer a single command that manages multiple dev servers, use Turborepo: `pnpm -w dlx turbo run dev --parallel --filter=apps/web --filter=apps/admin --filter=apps/space`, but separate tabs give clearer logs when debugging.

Testing and checks

- Linting/formatting: run `pnpm -w dlx eslint .` or the repo's `turbo run check` script.
- Type checking: run `pnpm -w dlx tsc -b` or `pnpm -w dlx turbo run check` depending on monorepo setup.
- Python tests: `python -m pytest` from `apps/api` when dependencies are installed. Running these inside the `apps/api` container is faster if host setup differs.

Notes and troubleshooting

- If workspace packages fail to resolve, run `pnpm -w install` and `pnpm -w -s turbo prune --scope <app> --out-dir .` as required by Dockerfiles.
- Ensure your local Node version matches the Dockerfile’s Node version to avoid unexpected builds.


   ### What each surface feels like in the browser

   | App | What a user sees | Key capabilities | When it matters |
   | --- | --- | --- | --- |
   | Public web (`apps/web`) | The main Plane product: project dashboards, backlogs, sprints, issue detail drawers, dashboards, personal work views, and onboarding flows. | Lets teammates plan work, move cards across boards, edit tasks, update cycles, review analytics, and manage their workspace settings. | The app most customers visit daily; if it is down, the core experience is missing. |
   | Admin console (`apps/admin`) | A control-room style interface with user/account tables, billing and plan controls, and system health panels. | Gives support or ops staff tools to reset passwords, promote/demote roles, review audit logs, toggle features, and check service status. | Run when you need to perform customer-support actions or verify SaaS configuration outside the regular workspace UI. |
   | Workspace UI (`apps/space`) | A lighter, shareable board or workspace that can be embedded or opened via public links, often with brand-neutral chrome. | Presents curated boards, read-only or limited-edit views, and magical link authentication so partners or clients can follow progress without a full account. | Useful for publishing project progress to stakeholders or integrating boards into another product/portal. |
   | Realtime server (`apps/live`) | No direct UI; it silently powers live cursors, collaborative rich-text editing, and presence indicators inside the product. | Keeps everyone’s editors in sync, persists collaborative documents, and broadcasts awareness (who’s online, who is editing). If it is off, shared documents stop updating in real time. | Start it whenever you expect multiple people to edit docs simultaneously or want to test collaborative features end-to-end. |
   | UI library (`packages/ui`) | Not a standalone page; it supplies buttons, panels, data grids, modals, and visual themes that appear across every Plane screen. | Centralizes visual design rules, interactive widgets, and accessibility patterns so each app looks and behaves consistently. | Run the watcher when you are polishing the look/feel of any frontend or developing new shared components. |