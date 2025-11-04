# Frontend UI Reference

This document maps the Veriochi/Plane frontend surface area. It should help you orient yourself when working on landing flows, signed-in workspace screens, or the public sharing experience. The focus is on the JavaScript/TypeScript UI that lives under `apps/web` (internal product UI) and `apps/space` (public views), with references to the MobX stores and shared packages that power them.

---

## 1. Applications and Entry Points

- **`apps/web`** – The primary authenticated product. It uses the Next.js App Router (`app/`) with client components under `core/` and `ce/` (community edition) while reserving `ee/` for enterprise-specific overrides. Shared styling imports live in `app/(all)/layout.tsx`.
- **`apps/space`** – A slim Next.js app for publicly published boards and pages. Visitors can authenticate just enough to view a shared workspace (`apps/space/app/views/[anchor]/page.tsx`).
- **`apps/admin`** – Separate admin-only Next.js application (`docs/apps/admin.md`). It reuses many of the `@plane/*` packages documented below.
- **Supporting runtimes** – Realtime collaboration (`apps/live`), reverse proxy (`apps/proxy`), and the Django API feed data to every frontend. Docker targets for each app are defined in `apps/*/Dockerfile.*` and described in `docs/docker-development.md`.

Each Next.js application consumes the shared packages declared in `package.json` (e.g. `@plane/ui`, `@plane/services`, `@plane/types`) so the UI surface is consistent.

---

## 2. Landing, Authentication, and Onboarding

Landing in `apps/web` is handled by the route defined in `app/(home)/page.tsx`. The page wraps `AuthBase` (`core/components/auth-screens/auth-base.tsx`) in `AuthenticationWrapper` so the marketing shell can render sign-in, sign-up, or magic-link screens without pulling the full workspace chrome.

The core authentication flow is implemented in `apps/web/core/components/account/auth-forms/auth-root.tsx`:

- **Email-first flow** – `AuthRoot` starts with an email check (`SitesAuthService.emailCheck`) and decides whether to continue in sign-in or sign-up mode (`EAuthModes` and `EAuthSteps`).
- **Password vs. magic code** – The app supports SMTP-backed magic codes (`generateEmailUniqueCode`) and classic password entry (`AuthPasswordForm`). Error codes are normalized through `authErrorHandler` (`core/helpers/authentication.helper.ts`).
- **OAuth providers** – Google, GitHub, and GitLab buttons are wired via `OAuthOptions` and `API_BASE_URL` so redirects land back with `next_path` intact.
- **Legal and messaging** – `TermsAndConditions`, `AuthBanner`, and `AuthHeader` components handle regulatory copy and animated banners.

When an already authenticated visitor hits `/`, `UserLoggedIn` from `apps/space/core/components/account/user-logged-in.tsx` nudges them to open the intended workspace while keeping the public shell.

Onboarding past authentication uses dedicated routes under `apps/web/app/(all)/onboarding/`. The `TourRoot` overlay (`core/components/onboarding/tour`) is triggered from the workspace dashboard as soon as `useUserProfile` detects `is_tour_completed === false`.

---

## 3. Workspace Shell and Navigation Frame

Once authenticated, almost every page flows through the `(all)` layout tree:

1. `app/(all)/layout.tsx` loads shared CSS (`emoji.css`, command palette styles) and defers to children.
2. `app/(all)/[workspaceSlug]/layout.tsx` wraps the workspace area in `AppRailProvider` (see `hooks/context/app-rail-context.ts`) and `WorkspaceContentWrapper` (`apps/web/ce/components/workspace/content-wrapper.tsx`).
3. Feature routes under `(projects)` apply the authenticated chrome:
   - `app/(all)/[workspaceSlug]/(projects)/layout.tsx` ensures the user is signed in (`AuthenticationWrapper`), mounts the `CommandPalette`, and renders the sidebar + main pane inside `WorkspaceAuthWrapper`.
   - The app shell injects a “full screen” portal (`<div id="full-screen-portal" />`) for modals and editors.

### 3.1 Sidebar System

The shell is built around `ProjectAppSidebar` (`app/(all)/[workspaceSlug]/(projects)/_sidebar.tsx`):

- **Resizable frame** – `ResizableSidebar` (`core/components/sidebar/resizable-sidebar.tsx`) persists width in local storage (`useLocalStorage("sidebarWidth", SIDEBAR_WIDTH)`) and supports peek, collapse, and extended modes.
- **Primary navigation** – `AppSidebar` (`sidebar.tsx`) renders:
  - Workspace quick actions (`workspace/sidebar/quick-actions.tsx`).
  - Pinned items (`workspace/sidebar/favorites/favorites-menu.tsx`).
  - Team and project listings (`plane-web/components/workspace/sidebar/teams-sidebar-list.tsx`, `workspace/sidebar/projects-list.tsx`).
  - Permission checks are handled via `useUserPermissions`, ensuring guests cannot access admin-only items.
- **Extended navigation** – `ExtendedAppSidebar` reads `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` from `@plane/constants` and lets users reorder sections by updating preferences (`useWorkspace.updateSidebarPreference`). Drag/drop sorting calculates fractional `sort_order` values to maintain order (see `extended-sidebar.tsx`).
- **Mobile/header integration** – `AppHeader` (`core/components/core/app-header.tsx`) uses `ExtendedAppHeader` to surface a sidebar toggle when the nav is collapsed and injects route-specific headers such as `WorkspaceDashboardHeader`.

### 3.2 Layout Helpers

`ContentWrapper` wraps scrollable content to avoid double scroll bars, while `PageHead` (`core/components/core/page-title.tsx`) updates the document title server-side and client-side. The entire shell is theme-aware via `useAppTheme` and `ThemeStore` (`core/store/theme.store.ts`).

---

## 4. Workspace Home Dashboard

`WorkspaceDashboardPage` (`app/(projects)/page.tsx`) renders the first-stop dashboard for an authenticated workspace. It is composed of:

- **Greeting & tour overlay** – `WorkspaceHomeView` (`core/components/home/root.tsx`) pulls the current user and profile (`useUser`, `useUserProfile`) to show `UserGreetingsView` (localized, time-zone-aware greetings) and the product tour overlay (`TourRoot`).
- **Peek infrastructure** – `HomePeekOverviewsRoot` (`apps/web/ce/components/home/peek-overviews.tsx`) mounts the issue peek modal so notifications can deep-link into work items even from the dashboard.
- **Widget stack** – `DashboardWidgets` orchestrates the widgets registered in `HOME_WIDGETS_LIST`:
  - `quick_links` → `DashboardQuickLinks` for navigation shortcuts (`core/components/home/widgets/links`).
  - `recents` → `RecentActivityWidget` summarizing issue/project activity (`widgets/recents/`).
  - `my_stickies` → Personal notes via `StickiesWidget` (quick add button, modal search, truncated preview).
  - `new_at_plane` & `quick_tutorial` → Placeholder slots for release notes or tutorials.
- **Customization** – `ManageWidgetsModal` toggles widget visibility and order, while the fallback `SimpleEmptyState` encourages enabling widgets if none are active. Widget state lives in `dashboard.store.ts` (`useHome`).

The dashboard reuses `@plane/ui` primitives (`ContentWrapper`, `Row`) and aligns with the analytics layer in `packages/types/dashboard.ts` for consistent widget keys and filter types.

---

## 5. Workspaces, Members, and Organization Structure

Workspace types and permissions are defined in `packages/types/src/workspace.ts`:

- **Roles** – `EUserWorkspaceRoles` (Admin, Member, Guest) feed into `useUserPermissions` checks.
- **Metadata** – `IWorkspace` exposes slug, logo, counts, and membership details, which populate the sidebar header (`workspace/sidebar/workspace-menu-header.tsx`).
- **Invitations & onboarding** – `IWorkspaceMemberInvitation` and `EOnboardingSteps` types power the invite modal (`workspace/invite-modal/`) and guided onboarding flows under `app/(all)/create-workspace/` and `onboarding/`.
- **Navigation preferences** – `IWorkspaceSidebarNavigation` stores per-workspace ordering for the extended sidebar, persisted by `useWorkspace` store (`core/store/workspace`).

The workspace settings surface (`app/(projects)/[workspaceSlug]/(projects)/settings/`) includes billing (`workspace/billing/`), access control, and default view configuration, all backed by MobX stores (`core/store/workspace/*`).

---

## 6. Projects, Modules, and Cycles

Projects are the main container for work items. The types in `packages/types/src/project/projects.ts` describe identifiers, optional modules/pages/cycles toggles, and favorites. Relevant UI components include:

- **Project list & detail routes** – `app/(projects)/projects/(list)/page.tsx` (not shown) and `projects/(detail)/[projectId]/` subroutes for issues, modules, cycles, pages, intake, and archives.
- **Project stores** – `core/store/project` keeps a denormalized map of projects, membership, and preferences. `ProjectViewStore` manages saved per-project views.
- **Modules** – Defined in `packages/types/src/module/modules.ts`, modules represent roadmap segments with progress snapshots, assignee/label distributions, and estimate tracking. UI lives in `core/components/modules/` (cards, analytics sidebar, quick actions) and offers gantt charts (`modules/gantt-chart`) and detailed peek panels (`module-peek-overview.tsx`).
- **Cycles (sprints)** – `packages/types/src/cycle/cycle.ts` models progress, burndown data, and status groups. Corresponding UI is under `core/components/cycles/` and `app/(projects)/projects/(detail)/[projectId]/cycles/`.

Each project feature reuses the work item layout system so modules/cycles can display scoped boards, lists, or calendars using shared infrastructure.

---

## 7. Work Item Layout System

The bulk of the application is built on the issue/work-item layout engine. All layouts sit under `core/components/issues/issue-layouts/`.

### 7.1 Layout Root

`ProjectLayoutRoot` (`roots/project-layout-root.tsx`) is representative of every scope (workspace, module, cycle, view):

- Wraps content in `IssuesStoreContext` with the appropriate `EIssuesStoreType` (project, module, global, etc.).
- Uses the corresponding work-item filter HOC (`ProjectLevelWorkItemFiltersHOC`, `WorkspaceLevelWorkItemFiltersHOC`, etc.) to hydrate filters via `issuesFilter.fetchFilters` and persist user choices (`displayFilters`, `kanbanFilters`, `richFilters`).
- Switches between `ListLayout`, `KanBanLayout`, `CalendarLayout`, `BaseGanttRoot`, and `ProjectSpreadsheetLayout` according to `EIssueLayoutTypes`.
- Keeps the peek drawer (`IssuePeekOverview`) mounted so row/card clicks can open detail views.

### 7.2 Kanban

`BaseKanBanRoot` implements a highly interactive board:

- **Grouping & swimlanes** – Supports `group_by` and `sub_group_by` options from `displayFilters`, rendering either `KanBan` columns or `KanBanSwimLanes`.
- **Drag-and-drop** – Uses Atlaskit’s `pragmatic-drag-and-drop` and `autoScrollForElements` to handle card moves. `useGroupIssuesDragNDrop` recalculates ordering and triggers updates.
- **Permissions** – Inline editing and quick actions honour both workspace- and project-level roles via `canEditProperties` callbacks.
- **Quick actions** – Each card surfaces `ProjectIssueQuickActions` (update, archive, remove from view, delete). Deleting can be triggered by dropping a card onto the trash drop zone pinned at the top of the board.
- **Quick create / add to view** – Boards can inline-create issues (`quickAddIssue`) or add existing issues to views when `addIssuesToView` is provided (custom views and modules).
- **State** – Kanban filters (collapsed columns, show empty groups) stored in `issuesFilter.issueFilters.kanbanFilters` for a per-view experience.

### 7.3 List

`ListLayout` renders grouped lists with virtualized loading:

- `List` (`list/default.tsx`) fetches group definitions via `getGroupByColumns` (supporting state, assignee, cycle, module, priority, label, created_by).
- `ListGroup` handles sticky headers, collapse toggles, infinite scroll detection (`useIntersectionObserver`), and the “load more” row.
- `IssueBlocksList` (not shown) displays rows with property chips composed by `IssueProperties`.
- Display properties can be toggled through view filters, flowing into `WithDisplayPropertiesHOC` to hide or show chips.

### 7.4 Calendar

The calendar stack (`calendar/*`) supports monthly and weekly views, quick issue creation inside day tiles (`quick-add-issue-actions.tsx`), and context filtering (project-wide, module-scoped, cycle-scoped roots). The layout honours the same filter infrastructure so date-based workflows are in sync with board/list filters.

### 7.5 Gantt

`BaseGanttRoot` renders timeline blocks with draggable start/end dates (see `gantt/blocks.tsx`). It reuses the issue store to hydrate dependencies and respects display/filter selections.

### 7.6 Spreadsheet

`ProjectSpreadsheetLayout` (and the shared components in `spreadsheet/`) provides a grid-like view similar to Airtable:

- Columns are defined in `spreadsheet/columns` and can be toggled.
- Rows use `issue-row.tsx` with inline editors for text, selects, dates, etc.
- Infinite scroll and group headers mirror the list layout while enabling bulk edits.

### 7.7 Issue Properties & Chips

`IssueProperties` (`properties/all-properties.tsx`) collates state, priority, labels, dates, assignees, modules, cycles, estimate counts, sub-issue counts, attachments, and link chips. Every property respects `displayProperties` toggles and uses design-system icons (`@plane/propel`).

---

## 8. Filters, Saved Views, and Rich Expressions

Filters appear everywhere, but the building blocks are consistent:

- **UI row** – `WorkItemFiltersRow` (`core/components/work-item-filters/filters-row.tsx`) displays active filters, search, and view actions (save/update).
- **Applied chips** – `IssueAppliedFilters` and `AppliedFiltersList` render currently applied state/priority/label filters with remove buttons and a “clear all” action.
- **Filter HOCs** – `ProjectLevelWorkItemFiltersHOC`, `WorkspaceLevelWorkItemFiltersHOC`, and view-specific variants manage persistence via `WorkItemFilterStore` (`@plane/shared-state`), exposing `updateFilterExpression` to the layout root.
- **Saved views** – The workspace-level “Views” page (`app/(projects)/workspace-views/page.tsx`) lists static views (`DEFAULT_GLOBAL_VIEWS_LIST`) and user-created views from `GlobalViewStore`. Each view has rich filter expressions (`TWorkItemFilterExpression`), stored display layouts, and optional public anchors (`IPublishedProjectView`).
- **Routing** – Query parameters like `board`, `states`, and `priority` are synchronized via helpers inside `IssueAppliedFilters`, keeping the URL shareable.

---

## 9. Issue Peek and Detail Experiences

Clicking any issue renders `IssuePeekOverview` (`core/components/issues/peek-overview/layout.tsx`):

- **Modes** – Side drawer, modal dialog, and full-screen modes switch based on `issueDetailStore.peekMode`. The component listens to `peekId` query params and fetches data via `issueDetailStore.fetchIssueDetails`.
- **Routing** – Closing the peek cleans up query parameters (`board`, `state`, `priority`, `labels`) to keep the view-state consistent.
- **Details** – `PeekOverviewIssueDetails` shows project key + issue number, title, and read-only rich description via `RichTextEditor`. Reactions are displayed with `IssueReactions` (`issue-reaction.tsx`).
- **Widgets** – Sidebars inside the peek (not shown) include properties, activity timelines, comments (`peek-overview/comment`), and relations.

Full-page issue detail routes live under `app/(projects)/projects/(detail)/[projectId]/issues/(detail)/` and reuse the same stores/components for consistency.

---

## 10. Issue Store Architecture and Data Flow

Every layout consumes the shared MobX stores defined under `apps/web/core/store/issue/`:

- **`BaseIssuesStore`** – Handles grouping, pagination, loader state, and denormalized issue maps. It centralizes `processIssueResponse`, `updateGroupedIssueIds`, and cursor management so all views behave the same way.
- **`IssueStore` subclasses** – Project, workspace, module, cycle, draft, epic, and public stores extend `BaseIssuesStore` to add API-specific fetch methods (see `issue.store.ts`, `apps/space/core/store/issue.store.ts`).
- **Services** – API clients live in `@plane/services` (e.g. `SitesIssueService`). All fetch methods accept `IssuePaginationOptions` from `@plane/types` to standardize grouping, filters, and per-page limits.
- **Actions** – `useIssuesActions` orchestrates mutations (quick add, update, archive) and publishes telemetry through `captureSuccess`/`captureError` so analytics capture retention events.

---

## 11. Modules, Cycles, Stickies, Pages, and Supporting Apps

Beyond the core board experience, several feature areas share patterns:

- **Modules** – `core/components/modules/` exposes lists, peek overview, quick actions, analytics sidebars, and gantt charts. Module filters and saved views plug into the same filter infrastructure (`view_props.filters`).
- **Cycles** – `core/components/cycles/` provides burndown charts, timeline snapshots, and board/list views grouped by cycle status. Cycle-specific quick actions gate editing when a cycle is completed.
- **Stickies** – `core/components/stickies/` offers a lightweight personal note system surfaced on the dashboard and dedicated workspace routes (`app/(projects)/stickies/`). The MobX store lives in `core/store/sticky/sticky.store.ts`.
- **Pages/Wiki** – `core/components/pages/` and routes under `app/(projects)/projects/(detail)/[projectId]/pages/` implement a hierarchical knowledge base using the shared rich-text editor (`@plane/editor`).
- **Inbox & Notifications** – `core/components/inbox/` and `workspace-notifications/` pair with stores in `core/store/notifications` to present batched activity, actionable updates, and digests.
- **Automation & Integrations** – Folders like `core/components/automation/` and `integration/` surface Zapier, GitHub, Slack, and webhook integrations, all driven by types in `packages/types/src/integration.ts`.

---

## 12. Analytics, Dashboards, and Reporting

Data contracts for dashboard widgets live in `packages/types/src/dashboard.ts`. Key concepts:

- **Widgets** – Keys (`TWidgetKeys`) align with API-resolved data (overview stats, assigned issues, created issues, issues by state/priority, recent activity/projects/collaborators). Both read (`widget_filters`) and write (`filters`) payloads are typed to prevent mismatches.
- **Stores** – `dashboard.store.ts` orchestrates widget visibility and fetch cycles, while `analytics.store.ts` (Plane Web store) handles trend charts, burndown data, and other BI visualizations.
- **UI** – `core/components/chart/`, `analytics/`, and `home/widgets/` contain the actual charts, filter drawers, and empty states.

---

## 13. Command Palette, Search, and Productivity Enhancers

- **Command palette** – Mounted in every authenticated layout via `<CommandPalette />`, backed by `core/store/base-command-palette.store.ts` and extended by `plane-web/store/command-palette.store.ts`.
- **Global search** – Exposed through the workspace header (`workspace/views/header.tsx`) and the command palette, using types from `packages/types/src/workspace.ts` for result buckets (workspaces, projects, issues, cycles, modules, pages).
- **Multiple select & bulk operations** – Managed by `core/store/multiple_select.store.ts` and UI components under `core/components/issues/bulk-operations/`.

---

## 14. Public Sharing (`apps/space`)

`apps/space` provides a constrained UI for read-only viewers:

- **Routing** – Visiting `/views/[anchor]` resolves a published project view through `SitesProjectPublishService` (`apps/space/app/[workspaceSlug]/[projectId]/page.tsx` redirects from canonical workspace/project URLs). `publishSettings` hold toggles like comments/reactions/votes (`packages/types/src/views.ts`).
- **Authentication** – `AuthView` in `apps/space/core/components/views/auth.tsx` mirrors the email/OAuth flows but strips workspace chrome. `UserLoggedIn` guides fully signed-in users to open the main app for editing.
- **Issue layouts** – `IssuesLayoutsRoot` (`apps/space/core/components/issues/issue-layouts/root.tsx`) fetches grouped public issues with SWR and renders list or kanban layouts using the same display components as the internal app, with editing disabled.
- **Peek overlays** – Public viewers still get `IssuePeekOverview` (`apps/space/core/components/issues/peek-overview`) with description, reactions, and properties, subject to publish settings.

This app is intended for embedding or sharing curated views without exposing the entire product shell.

---

## 15. Shared Packages and Design System

- **`@plane/ui`** – Design system providing `ContentWrapper`, `Row`, buttons, inputs, modals, tables, and utilities like `Tooltip`. Many components reference Tailwind classes but rely on these primitives for consistency.
- **`@plane/propel`** – Iconography and chart primitives (`PlaneLockup`, `PriorityIcon`, `CycleGroupIcon`). Styles are imported in `app/(all)/layout.tsx`.
- **`@plane/services`** – Typed API client for the Django backend (`SitesIssueService`, `SitesAuthService`, `SitesProjectPublishService`, etc.).
- **`@plane/types`** – Shared TypeScript contracts for issues, workspaces, modules, cycles, analytics, pages, and integrations.
- **`@plane/utils`** – Utility helpers (`cn`, `isValidNextPath`, grouping helpers) used by almost every component.

The frontends rely on MobX (`makeObservable`, `action`, `runInAction`) and SWR (`useSWR`) for state and data fetching, combined with Tailwind CSS for layout.

---

## 16. Extending the Frontend

When adding new UI features, follow these patterns:

1. **New dashboard widget** – Add it to `HOME_WIDGETS_LIST` (`core/components/home/home-dashboard-widgets.tsx`), create a component under `core/components/home/widgets/<name>/`, and wire fetch logic into `dashboard.store.ts`. Provide translations via `@plane/i18n` keys.
2. **New issue layout** – Extend `EIssueLayoutTypes` in `packages/types/src/issues/issue.ts`, create a root component under `issue-layouts/<layout>/roots`, and register it in the switch statements (`ProjectIssueLayout`, `WorkspaceActiveLayout`). Ensure filters, display properties, and quick actions integrate via the shared HOCs.
3. **Sidebar navigation item** – Update `WORKSPACE_SIDEBAR_DYNAMIC_NAVIGATION_ITEMS_LINKS` and supply a component in `plane-web/components/workspace/sidebar/extended-sidebar-item.tsx`. Persist drag/drop order through `updateSidebarPreference`.
4. **Public view capability** – When exposing a feature to published spaces, duplicate or wrap the existing component in `apps/space/core/components/`, ensuring all mutations and privileged actions are disabled.
5. **Stores and types** – Define new data contracts in `@plane/types` first, update the relevant MobX store (`core/store/...`), then consume the store in UI components using the established `useX` hooks under `core/hooks/store/`.

---

## 17. Useful File Map

| Area | Key Files |
| --- | --- |
| Landing & Auth | `apps/web/app/(home)/page.tsx`, `core/components/account/auth-forms/` |
| Workspace Shell | `app/(all)/[workspaceSlug]/(projects)/layout.tsx`, `.../_sidebar.tsx`, `core/components/core/app-header.tsx` |
| Dashboard Widgets | `core/components/home/`, `core/store/dashboard.store.ts` |
| Issue Layouts | `core/components/issues/issue-layouts/`, `core/store/issue/` |
| Filters & Views | `core/components/work-item-filters/`, `@plane/shared-state` |
| Peek Overview | `core/components/issues/peek-overview/` |
| Modules & Cycles | `core/components/modules/`, `core/components/cycles/`, `packages/types/src/module/`, `.../cycle/` |
| Stickies | `core/components/stickies/`, `core/store/sticky/sticky.store.ts` |
| Public Space | `apps/space/app/`, `apps/space/core/components/` |

This reference should make it easier to trace any UI feature back to its entry point, store, and type definitions so you can extend or audit the frontend with confidence.
