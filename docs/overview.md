# Project overview — Veriochi ("plane")

Summary
-------

Veriochi is a monorepo web platform originally named "plane". It combines:

- Multiple Next.js frontends (`apps/web`, `apps/admin`, `apps/space`) for public and admin UIs.
- A Django backend API in `apps/api` for data, auth, and business logic.
- A Node/TypeScript realtime server in `apps/live` (Yjs/Hocuspocus-style collaboration).
- A proxy service `apps/proxy` (Caddy) used for TLS, routing and static delivery in some deployments.
- Shared workspace packages under `packages/` providing UI components, editor features, shared services, and TypeScript config.

Why this repo matters
---------------------

This codebase is a production-grade template for SaaS applications that want:

- a modern React/Next.js stack (server/client rendering),
- a robust Python/Django API backend for operations, background workers (Celery/RabbitMQ) and migrations,
- a real-time collaboration subsystem for document editing or shared boards,
- a modular monorepo structure with workspace packages (pnpm + Turbo) to share code between apps.

High-level goals for documentation
----------------------------------

1. Explain each app and package purpose.
2. Provide steps to run locally and in Docker (compose + Dockerfiles).
3. Provide guidance to rename the project safely from `plane` → `Veriochi`.
4. Call out licensing (AGPL-3.0) and implications for reuse.
