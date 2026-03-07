# UserUI Service Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new `userui` web service with Vite in development and Nginx in production, including a user registration form with front-end validation and success message `usuario creado` after successful backend creation.

**Architecture:** Add `services/ui` as a standalone static frontend service built with Vite and shipped via a multi-stage Docker image. In development, use the Docker dev target with a mounted `src` volume for live edits; in production, serve the built `dist` through Nginx. Keep the app as plain HTML/CSS/JS, with validation logic in small testable modules and a single submit flow to `POST /auth/register`.

**Tech Stack:** Docker Compose, Docker multi-stage build, Vite, vanilla HTML/CSS/JavaScript, Nginx, Vitest (unit tests for validation and payload shaping).

---

### Task 1: Scaffold `services/ui` package and Vite baseline

**Files:**
- Create: `services/ui/package.json`
- Create: `services/ui/vite.config.js`
- Create: `services/ui/index.html`
- Create: `services/ui/src/main.js`
- Create: `services/ui/src/style.css`

**Step 1: Write the failing test**

```js
// services/ui/src/main.test.js
import { describe, it, expect } from 'vitest';
import { createPayload } from './payload.js';

describe('createPayload', () => {
  it('trims string values', () => {
    const payload = createPayload({ first_name: '  Ana  ' });
    expect(payload.first_name).toBe('Ana');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose run --rm userui npm run test -- src/main.test.js`
Expected: FAIL with module/function not found.

**Step 3: Write minimal implementation**

```js
// services/ui/src/payload.js
export function createPayload(values = {}) {
  return Object.fromEntries(Object.entries(values).map(([k, v]) => [k, typeof v === 'string' ? v.trim() : v]));
}
```

**Step 4: Run test to verify it passes**

Run: `docker compose run --rm userui npm run test -- src/main.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add services/ui/package.json services/ui/vite.config.js services/ui/index.html services/ui/src/main.js services/ui/src/style.css services/ui/src/main.test.js services/ui/src/payload.js
git commit -m "feat: scaffold userui vite baseline"
```

### Task 2: Add front-end validation module with tests

**Files:**
- Create: `services/ui/src/validation.js`
- Create: `services/ui/src/validation.test.js`
- Modify: `services/ui/package.json`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { validateForm } from './validation.js';

describe('validateForm', () => {
  it('requires email and password min length 8', () => {
    const result = validateForm({ email: 'bad', password: '123' });
    expect(result.isValid).toBe(false);
    expect(result.errors.email).toBeTruthy();
    expect(result.errors.password).toBeTruthy();
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose run --rm userui npm run test -- src/validation.test.js`
Expected: FAIL (missing module or assertions failing).

**Step 3: Write minimal implementation**

```js
export function validateForm(values) {
  const errors = {};
  const email = (values.email || '').trim();
  const password = values.password || '';

  if (!email) errors.email = 'El email es obligatorio';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.email = 'Email no valido';

  if (!password) errors.password = 'La password es obligatoria';
  else if (password.length < 8) errors.password = 'Minimo 8 caracteres';

  if (values.avatar && !/^https?:\/\//.test(values.avatar.trim())) {
    errors.avatar = 'Avatar debe ser URL http(s)';
  }

  return { isValid: Object.keys(errors).length === 0, errors };
}
```

**Step 4: Run test to verify it passes**

Run: `docker compose run --rm userui npm run test -- src/validation.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add services/ui/src/validation.js services/ui/src/validation.test.js services/ui/package.json
git commit -m "feat: add userui client-side registration validation"
```

### Task 3: Implement registration API client with tests

**Files:**
- Create: `services/ui/src/api.js`
- Create: `services/ui/src/api.test.js`

**Step 1: Write the failing test**

```js
import { describe, it, expect, vi } from 'vitest';
import { registerUser } from './api.js';

describe('registerUser', () => {
  it('posts to /auth/register', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({}) });
    await registerUser({ email: 'a@b.com', password: '12345678' });
    expect(fetch).toHaveBeenCalledWith('/auth/register', expect.any(Object));
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose run --rm userui npm run test -- src/api.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

```js
export async function registerUser(payload) {
  const res = await fetch('/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error('No se pudo crear el usuario');
  return res.json().catch(() => ({}));
}
```

**Step 4: Run test to verify it passes**

Run: `docker compose run --rm userui npm run test -- src/api.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add services/ui/src/api.js services/ui/src/api.test.js
git commit -m "feat: add userui register api client"
```

### Task 4: Build form UI, state handling, and success/error messages

**Files:**
- Modify: `services/ui/index.html`
- Modify: `services/ui/src/main.js`
- Modify: `services/ui/src/style.css`

**Step 1: Write the failing test**

```js
import { describe, it, expect } from 'vitest';
import { renderStatus } from './ui-state.js';

describe('renderStatus', () => {
  it('shows usuario creado on success', () => {
    document.body.innerHTML = '<p id="status"></p>';
    renderStatus('success');
    expect(document.querySelector('#status').textContent).toBe('usuario creado');
  });
});
```

**Step 2: Run test to verify it fails**

Run: `docker compose run --rm userui npm run test -- src/ui-state.test.js`
Expected: FAIL.

**Step 3: Write minimal implementation**

```js
// in main.js + extracted ui-state.js helpers
// - collect form values
// - call validateForm
// - call registerUser on valid input
// - show "usuario creado" on success
// - show error message on failure
```

**Step 4: Run test to verify it passes**

Run: `docker compose run --rm userui npm run test -- src/ui-state.test.js`
Expected: PASS.

**Step 5: Commit**

```bash
git add services/ui/index.html services/ui/src/main.js services/ui/src/style.css services/ui/src/ui-state.js services/ui/src/ui-state.test.js
git commit -m "feat: implement userui registration form experience"
```

### Task 5: Add Docker and Nginx production/development setup

**Files:**
- Create: `services/ui/Dockerfile`
- Create: `services/ui/nginx.conf`
- Create: `services/ui/.dockerignore`
- Modify: `docker-compose.yml`
- Modify: `docker-compose.override.yml`

**Step 1: Write the failing test**

```bash
docker compose config
```

Expected: currently no `userui` service exists.

**Step 2: Run verification to confirm failure/gap**

Run: `docker compose config | rg "userui"`
Expected: no matches.

**Step 3: Write minimal implementation**

```dockerfile
# multi-stage Dockerfile with dev, build, production
```

```yaml
# compose and override entries for userui
```

**Step 4: Run verification to confirm pass**

Run: `docker compose config | rg "userui|5173:5173|8080:80"`
Expected: all mappings and service entries visible.

**Step 5: Commit**

```bash
git add services/ui/Dockerfile services/ui/nginx.conf services/ui/.dockerignore docker-compose.yml docker-compose.override.yml
git commit -m "feat: add userui service for vite dev and nginx production"
```

### Task 6: End-to-end verification and docs update

**Files:**
- Modify: `TODO.md`
- Create: `services/ui/README.md`

**Step 1: Write the failing test**

```bash
docker compose up -d userui backend
curl -i http://localhost:5173
```

Expected: if setup is incomplete, page or service is unavailable.

**Step 2: Run test to verify it fails**

Run: `docker compose logs userui --no-log-prefix`
Expected: identify startup/config errors before fix completion.

**Step 3: Write minimal implementation**

```md
# services/ui/README.md
# - dev run instructions
# - production run instructions
# - form fields and validation rules
```

**Step 4: Run test to verify it passes**

Run:
- `docker compose up -d userui backend`
- `curl -i http://localhost:5173`
- `docker compose -f docker-compose.yml up -d userui`
- `curl -i http://localhost:8080`

Expected:
- Dev UI reachable on `5173`.
- Prod UI reachable on `8080`.
- Form submit success path shows `usuario creado` when backend responds success.

**Step 5: Commit**

```bash
git add TODO.md services/ui/README.md
git commit -m "docs: add userui usage and verification steps"
```

## Final Verification Checklist
- `docker compose config` includes `userui` in base + override behavior.
- `docker compose up -d userui backend` serves dev app on `http://localhost:5173`.
- `docker compose -f docker-compose.yml up -d userui` serves prod app on `http://localhost:8080`.
- Unit tests pass: `docker compose run --rm userui npm run test`.
- Build passes: `docker compose run --rm userui npm run build`.
- Manual submit test:
  - Valid payload -> visible `usuario creado`.
  - Invalid email/password -> inline validation errors.
  - Backend/network error -> visible failure message.
