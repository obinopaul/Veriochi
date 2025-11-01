## @plane/editor — rich editor core

Summary
-------

`@plane/editor` implements the collaborative rich-text editor used by the web apps and the live server. It integrates Yjs and TipTap and exposes adapters and helpers for CRDT syncing.

Where to look
-------------

- `packages/editor/package.json` — main exports and build scripts.
- `packages/editor/src/` — editor adapters, Yjs integration and style assets.

How apps import
---------------

```ts
import { createEditor, EditorProvider } from '@plane/editor'
```

Build & test
------------

- Build: `pnpm --filter @plane/editor build`.
- Editor is a critical package for realtime; add E2E tests for collaborative flows if possible.

Improvement suggestions
-----------------------

- Add examples showing how to wire the editor with `apps/live` using the provider and awareness protocols.
- Add tests for serialization/deserialization and conflict resolution edge cases.
