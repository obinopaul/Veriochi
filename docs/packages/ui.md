## @plane/ui — shared UI utilities and patterns

Summary
-------

`@plane/ui` contains shared UI patterns, layout primitives and higher-level integrations used across the Next.js apps. It composes lower-level components (often implemented in `@plane/propel`) and provides app-level CSS/utility glue.

Where to look
-------------

- `packages/ui/package.json` — scripts, peer deps and Storybook.
- `packages/ui/src/` — layout primitives, theme providers and wrappers.

How to import
-------------

```ts
import { PageLayout, AppHeader } from '@plane/ui'
```

Build & test
------------

- Build: `pnpm --filter @plane/ui build`.
- Storybook available for visual checks.

Improvement suggestions
-----------------------

- Add a small README that explains the theme provider, design tokens and how to change global styles.
- Document what is exported as the public contract (avoid exporting deep internals).
