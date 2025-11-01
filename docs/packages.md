## Packages — workspace libraries and what they provide

This section gives a concise summary of important packages under `packages/` and what they are responsible for.

- `@plane/propel` — UI component library. Exports many components (button, modal, form controls, charts, calendar, icon set). Look under `packages/propel/src` for components and `package.json` exports map.

- `@plane/ui` — (if present) general UI utilities and shared visual patterns. Used by Next.js apps for consistent layout and theme.

- `@plane/editor` — Rich editor and document features used by the realtime server and frontends. If this package integrates Yjs, it will include CRDT-aware adapters and serializers.

- `@plane/services` — Client-side wrappers and API service utilities that encapsulate REST calls, auth handling and typed fetch patterns.

- `@plane/constants`, `@plane/types`, `@plane/shared-state` — Provide types, enums, and state utilities shared across apps.

- `@plane/logger` — Structured logging utilities for frontend and/or backend (useful to standardize telemetry).

- `@plane/tailwind-config` — Shared Tailwind configuration used by Next.js apps to maintain design consistency.

How to inspect each package

1. Open `packages/<package>/package.json` to see version, exports and build scripts.
2. Read `src/index.ts` or `src/index.tsx` for public API exports.
3. Check `README.md` (if present) for usage examples.

Improvement suggestions

- Add or update per-package README.md with public API, examples, and migration notes.
- Add unit tests for critical helpers in `@plane/services` and `@plane/utils`.
- Document breaking changes in `packages/CHANGELOG.md` when evolving core packages.
