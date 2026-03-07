# UserUI Design

## Context
- Add a new `userui` service to the current Docker-based stack.
- UI must be very simple: plain HTML, CSS, and JavaScript.
- Two runtime modes are required:
  - Development: Vite server with persistent source volume.
  - Production: Nginx serving built static assets from `dist`.
- Initial feature scope: user creation form with front-end validation.
- On successful user creation, show: `usuario creado`.

## Decisions

### 1) Container and Compose Architecture
- Use one multi-stage Dockerfile for `services/ui` with stages:
  - `dev`: runs Vite dev server (`npm run dev -- --host 0.0.0.0`).
  - `build`: generates `dist` (`npm run build`).
  - `production`: Nginx image serving `dist`.
- `docker-compose.yml` defines `userui` using production target and port mapping `8080:80`.
- `docker-compose.override.yml` switches `userui` to dev target, maps `5173:5173`, and mounts `./services/ui/src:/app/src`.
- Service directory layout:
  - `services/ui/src/`
  - `services/ui/package.json`
  - `services/ui/vite.config.js`
  - `services/ui/nginx.conf`
  - `services/ui/Dockerfile`

### 2) Form Fields, Validation, and API Flow
- Form fields (aligned with backend register schema):
  - `email` (required)
  - `password` (required)
  - `first_name` (optional)
  - `last_name` (optional)
  - `phone` (optional)
  - `avatar` (optional)
- Front-end validation:
  - `email`: required, valid email format.
  - `password`: required, minimum 8 characters.
  - Optional fields are trimmed; `avatar` is validated as URL when provided.
- Submit behavior:
  - Send `POST` to backend endpoint `/auth/register`.
  - Use JSON payload with the exact field names above.
- Feedback behavior:
  - On success (2xx): display `usuario creado`.
  - On error/network failure: show clear error message; keep current form values.
- Out of scope:
  - No login after register.
  - No redirects.
  - No additional features.

### 3) Visual Design
- Single-page, card-based composition with a soft gradient background.
- Distinct typography and clear spacing hierarchy for a clean, intentional look.
- Inputs with explicit visual states (`focus`, error, disabled).
- Primary action button with hover and loading/disabled state.
- Mobile-first responsive layout that also scales cleanly to desktop.

## Non-Functional Expectations
- Keep implementation simple and maintainable.
- Keep front-end in vanilla JS/CSS/HTML (no framework UI layer).
- Match existing repository Docker environment conventions.

## Open Items
- None for this phase.
