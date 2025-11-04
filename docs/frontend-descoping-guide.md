# Frontend de-scoping plan — removing project management tooling

Use this playbook when you want to repurpose the Plane frontend as a B2B product shell without the heavy project-management stack. The steps below describe how to peel away those features while preserving authentication, dashboards, notifications, and any shared UI patterns.

---

## Guardrails

- **Keep intact**: sign-up/sign-in, workspace shell, high-level dashboard widgets, account settings, notifications, and the design system packages.
- **Safe to remove**: all issue tracking surfaces (boards, lists, calendars, gantt, spreadsheet), saved views, modules, cycles, stickies, public sharing (apps/space), and realtime collaborative editing.
- **Guiding principle**: delete UX entry points first (navigation, routes, feature flags) before ripping out shared stores. This prevents runtime 404s while you progressively shrink the code surface.

---

## Removal sequence (easy ➜ hard)

| Order | Target | Why it is safe early | Key steps | Watch for |
| --- | --- | --- | --- | --- |
| 1 | Public sharing app (`apps/space`) | Runs as a standalone Next.js app; nothing else imports it. | Remove `apps/space` from `pnpm-workspace.yaml`, delete the folder, and drop `space` references from `docker-compose*` and docs. | Any marketing links to public views; update `docs/` and dashboards that referenced “Share view”. |
| 2 | Realtime server (`apps/live`) | Only needed for collaborative editor and issue comments. | Remove `apps/live` from workspace, docker compose, and `pnpm` scripts. Delete the service from `docker-compose-*.yml`. | Rich-text comments fall back to single-user mode; ensure editor still mounts without websockets. |
| 3 | Saved views & public view publishing | View navigation is additive; the app works fine defaulting to base lists. | Delete `View` entries from sidebar constants (`@plane/constants`), remove `workspace-views` routes, prune `GlobalViewStore`. | Dashboard widgets that reference saved views; replace with default filters. |
| 4 | Stickies personal notes | Isolated feature with its own store and routes. | Remove `stickies` routes, components under `core/components/stickies/`, and sidebar shortcuts. | Home dashboard widget expecting stickies; drop it from `HOME_WIDGETS_LIST`. |
| 5 | Modules (roadmaps) | Feature sits on top of the issue system; can be toggled out. | Remove routes under `app/(projects)/projects/(detail)/[projectId]/modules/`, delete `core/components/modules/`, and strip module types from `@plane/types`. | Ensure API calls no longer request module data; update stores (`module.store.ts`). |
| 6 | Cycles (sprints) | Similar isolation to modules. | Remove cycle routes and components, delete cycle types, and clean up `CycleStore`. | Dashboard widgets referencing cycle burndown; swap to simple status counts. |
| 7 | Issue saved filters and rich expressions | Layouts can run with default filters only. | Remove filter drawers (`core/components/work-item-filters`), delete hooks that load filter state, and hardcode default groupings in layout wrappers. | Command palette actions that relied on saved filters; remove commands. |
| 8 | Spreadsheet layout | Optional view. | Delete `spreadsheet/` components and remove references from layout switches. | Make sure default layout fallbacks no longer point to spreadsheet. |
| 9 | Calendar layout | Optional view. | Remove `calendar/` components and prune imports from layout root. | The “Calendar” option in any view selectors; update UI copy. |
| 10 | Gantt layout | Optional view. | Delete `gantt/` directory and references. | Module analytics that expected gantt; already removed with modules. |
| 11 | Kanban & list layouts (core issue engine) | Central piece; remove last. | Remove `KanBanLayout`, `ListLayout`, and `BaseIssuesStore`. Replace main workspace routes with alternative content (e.g., simple dashboards or custom pages). | Anything that tried to fetch issues—dashboard widgets, notifications, inbox—needs either removal or redesign. |
| 12 | Issue detail overlays (peek, full page) | After issue layouts are gone, purge detail UIs. | Delete `peek-overview/`, issue detail routes, and dependent stores. | Comments, attachments, reactions features become inaccessible—plan replacements before removing. |
| 13 | Shared issue types & services (`@plane/types`, `@plane/services`) | Last step: remove the data contracts and API clients to shrink build size. | Delete issue-related types, prune service methods, and adjust API layer to expose only the entities you keep (e.g., users, workspaces). | Any leftover component referencing issue enums; run type-checks to catch stragglers. |

---

## Detailed guidance by component

### 1. Public sharing (`apps/space`)

- Delete the package folder and any references in `pnpm-workspace.yaml`, `turbo.json`, and CI workflows.
- Remove routes or buttons that linked to public sharing (`Publish view`, `Share workspace`).
- Update documentation to reflect the feature removal so end users do not see broken links.

### 2. Collaboration backend (`apps/live`)

- Remove compose services (`apps/live`, `live-redis`) and clean `.env` variables (`LIVE_*`).
- In the editor components (`@plane/editor` consumers), gate collaborative widgets behind feature flags or gracefully degrade to single-user editing.
- Trim sentry/instrumentation configs that referenced the live server.

### 3. Views, filters, and sidebar navigation

- Remove entries from `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` so users no longer see the views tab.
- Delete the routes under `app/(projects)/workspace-views/` and the store `workspace-views.store.ts`.
- Replace view creation buttons with a simple “Filter coming soon” message or remove them entirely.

### 4. Modules & cycles

- Remove module and cycle menu items, peek drawers, and analytics widgets.
- In `@plane/types`, delete module/cycle interfaces; run `pnpm -w tsc -b` to expose missing references.
- Update home dashboard widgets to drop modules/cycles metrics.

### 5. Issue layout engine

- Replace `ProjectLayoutRoot` usage with a custom placeholder (e.g., a simple list of documents or tasks you plan to keep).
- Delete `core/store/issue/` and related hooks; this will cascade type errors anywhere issues were consumed.
- Update command palette actions that previously opened boards or issues.

### 6. Issue detail experience

- After removing layouts, delete peek/detail components to avoid dead code.
- Remove registered modals / portals for issue detail components in the workspace layout.
- Replace notifications and inbox entries that previously linked to issue detail with alternative summaries.

### 7. Types and services clean-up

- Purge issue/project-specific services from `@plane/services` to avoid unused API calls.
- Keep only user/workspace/org service clients needed for auth, settings, and dashboards.
- Re-run lint/type checks; any lingering imports will show up as build errors.

---

## Validation checklist

- `pnpm -w lint` and `pnpm -w tsc -b` pass without issue-related imports.
- Next.js dev servers (`apps/web`, `apps/admin`) boot without hitting removed routes.
- Dashboard/home pages render successfully using the remaining data sources.
- Authentication, account management, and notifications flows remain untouched.

Following this sequence keeps the product shell functioning while you strip away project-management tooling, letting you repurpose the codebase as a foundation for a different B2B offering.
