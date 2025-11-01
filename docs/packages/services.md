## @plane/services — client-side API services

Summary
-------

`@plane/services` contains typed client API wrappers and helper functions used by the frontends to call the Django backend. It centralizes fetch, auth token handling, and typed responses.

Where to look
-------------

- `packages/services/package.json` — build scripts and exports (`dist/index.*`).
- `packages/services/src/` — high level API clients and helpers.

How to import
---------------

```ts
import api from '@plane/services'
// or
import { getSpaces } from '@plane/services'
```

Build & test
------------

- Build: `pnpm --filter @plane/services build`.
- Add unit tests for request/response handling and error paths.

Improvement suggestions
-----------------------

- Add retry/backoff patterns for network resilience.
- Centralize and document expected API error formats and how clients should surface errors.
