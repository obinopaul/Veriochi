## @plane/types — shared TypeScript types

Summary
-------

`@plane/types` stores shared TypeScript types and interfaces used across frontends and packages. Keeping types centralized ensures consistent contracts between UI, services, and editor.

Where to look
-------------

- `packages/types/package.json` — build and export settings.
- `packages/types/src/` — main type definitions, DTOs and interfaces.

How to use
----------

Import types where needed to avoid duplication and drift:

```ts
import { User, Space } from '@plane/types'
```

Improvement suggestions
-----------------------

- Add a public `README.md` with the main domain types and examples of usage across the repo.
- Add a `CHANGELOG.md` for breaking type changes and a migration guide.
