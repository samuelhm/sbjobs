# AGENTS.md

## Purpose
Operational context for AI/code agents working in this repository.
Keep edits minimal, preserve architecture decisions, and avoid unnecessary refactors.

## Project Snapshot
- Stack: Node.js (ESM) + Fastify + PostgreSQL.
- Services: `backend` and `postgres` via Docker Compose.
- Backend entrypoint loads secrets, runs SQL migrations, then starts server.

## Source Layout
- `backend/src/app.js`: Fastify bootstrap and plugin registration.
- `backend/src/server.js`: process start/listen.
- `backend/src/config/index.js`: required config + secret resolution.
- `backend/src/init/database.js`: Postgres pool lifecycle.
- `backend/src/routes/**`: HTTP routes.
- `backend/src/services/**`: business/data access logic.
- `backend/src/constants/messages.js`: API/domain messages.
- `backend/migrations/*.sql`: schema migrations, alphabetical execution.

## Non-Negotiable Decisions
- Backend must NOT use Postgres admin credentials.
- Only backend secrets loaded in backend container: `DB_PASSWORD`, `JWT_SECRET`.
- Auth model: global private-by-default guard.
  Public routes are only `/health`, `/auth/login`, `/auth/register`.
- Email uniqueness is enforced in base migration (`02-create_user_table.sql`).
- Rate limiting is intentionally not implemented yet.

## Runtime Behavior
- Plugin order is explicit in `backend/src/app.js`:
  1) cookie
  2) jwt
  3) auth guard
  4) routes autoload
- Cookie auth token is read from `token` cookie.
- Health endpoint checks DB connectivity.

## Docker and Environments
- Base compose (`docker-compose.yml`) defines shared/default behavior.
- Override compose (`docker-compose.override.yml`) is development-focused:
  - bind mounts backend code
  - exposes ports
  - forces `NODE_ENV=development`
- Internal backend port is `3000`; host port comes from `BACKEND_PORT`.

## Agent Rules for Changes
- Prefer the smallest possible diff.
- Do not reintroduce removed legacy auth files/plugins.
- Do not add broad logging of secrets or `/run/secrets` contents.
- Keep API-facing strings centralized in `backend/src/constants/messages.js`.
- If schema assumptions change, add a migration instead of ad-hoc SQL in handlers/services.

## Useful Commands
- Start/rebuild: `docker compose up -d --build`
- Reset DB volume: `docker compose down -v && docker compose up -d --build`
- Backend logs: `docker compose logs --no-color --tail=120 backend`
- Running services: `docker compose ps`

## Validation Smoke Test
- `GET /health` -> 200 when DB is reachable.
- `POST /auth/register` -> 201 (new email), 409 (duplicate email).
- `POST /auth/login` -> 200 + cookie.
- `GET /users/me` -> 200 with cookie, 401 without cookie.
