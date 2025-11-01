## @plane/logger — structured logging helpers

Summary
-------

`@plane/logger` provides a thin wrapper around `winston`/`express-winston` to standardize logs across services.

Where to look
-------------

- `packages/logger/package.json` — dependencies and exports.
- `packages/logger/src/` — logger configuration and helpers.

How to use
----------

```ts
import logger from '@plane/logger'
logger.info('started', { service: 'web' })
```

Improvement suggestions
-----------------------

- Add structured log schemas and an optional sink adapter to forward logs to external systems (Datadog, ELK, etc.).
- Provide examples of configuring different formats for dev vs production (console pretty vs JSON).
