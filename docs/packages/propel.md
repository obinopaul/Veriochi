## @plane/propel — UI component library

Summary
-------

`@plane/propel` is the design-system / component library used across frontends. It exposes many focused components (buttons, modals, inputs, charts, tables, calendar, icons, etc.) via a granular `exports` map so apps can import only the pieces they need.

Where to look
-------------

- `packages/propel/package.json` — lists a large `exports` map that points to `dist/*` bundles for each component.
- `packages/propel/src/` — component source (read individual component folders like `src/button`, `src/modal`).
- `packages/propel/README.md` or Storybook (`scripts.storybook`) — interactive component examples.

How apps import
---------------

Prefer importing specific component entrypoints to reduce bundle size:

```ts
import Button from '@plane/propel/button'
import { AreaChart } from '@plane/propel/charts/area-chart'
```

Build & test
------------

- Build: `pnpm --filter @plane/propel build` (runs `tsdown`).
- Storybook: `pnpm --filter @plane/propel storybook` (dev) or `build-storybook`.

Improvement suggestions
-----------------------

- Add per-component README files documenting props, accessibility notes, and examples.
- Add unit tests (Jest/Testing Library) for interactive components (forms, menus, keyboard interactions).
- Enforce visual regression testing (Chromatic or Storybook snapshots) for core components.

Notes
-----
- `propel` depends on `@plane/constants`, `@plane/hooks`, and `@plane/types`. Keep those packages stable when changing shared primitives.
