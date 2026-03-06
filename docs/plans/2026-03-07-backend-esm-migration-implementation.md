# Backend ESM Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrar `services/backend` de CommonJS a ESM de forma minima y segura, manteniendo comportamiento y scripts operativos.

**Architecture:** Se aplicara una migracion acotada a tres puntos: metadata de modulo en `package.json`, sintaxis de import en runtime (`src/server.js`) y ajuste de `sourceType` en ESLint. No se renombraran archivos a `.mjs`; se usara `.js` con `"type": "module"` para minimizar ruido.

**Tech Stack:** Node.js 22, Fastify 5, ESLint 9, Prettier

---

### Task 1: Cambiar metadata de modulo en backend

**Files:**
- Modify: `services/backend/package.json`

**Step 1: Actualizar tipo de modulo**

Cambiar:

```json
"type": "commonjs"
```

por:

```json
"type": "module"
```

**Step 2: Verificar JSON valido**

Run: `node -e "JSON.parse(require('fs').readFileSync('package.json','utf8')); console.log('ok')"`
Workdir: `services/backend`
Expected: imprime `ok`.

### Task 2: Migrar import de runtime a ESM

**Files:**
- Modify: `services/backend/src/server.js`

**Step 1: Cambiar import principal**

Reemplazar:

```js
const Fastify = require('fastify');
```

por:

```js
import Fastify from 'fastify';
```

Mantener el resto del archivo sin cambios funcionales.

**Step 2: Verificar sintaxis de modulo**

Run: `node --check src/server.js`
Workdir: `services/backend`
Expected: sin errores.

### Task 3: Ajustar ESLint para source type module

**Files:**
- Modify: `services/backend/eslint.config.mjs`

**Step 1: Actualizar `sourceType`**

Cambiar:

```js
sourceType: 'commonjs'
```

por:

```js
sourceType: 'module'
```

**Step 2: Verificar carga de config**

Run: `node -e "import('./eslint.config.mjs').then(()=>console.log('ok')).catch(err=>{console.error(err);process.exit(1)})"`
Workdir: `services/backend`
Expected: imprime `ok`.

### Task 4: Verificacion funcional de calidad

**Files:**
- Test: `services/backend/package.json`
- Test: `services/backend/src/server.js`
- Test: `services/backend/eslint.config.mjs`

**Step 1: Ejecutar lint**

Run: `npm run lint`
Workdir: `services/backend`
Expected: comando exitoso.

**Step 2: Ejecutar format check**

Run: `npm run format:check`
Workdir: `services/backend`
Expected: `All matched files use Prettier code style!`.

**Step 3: Verificar arranque del servidor**

Run: `npm run start`
Workdir: `services/backend`
Expected: Fastify inicia sin errores de modulo (`require/import`).

### Task 5: Verificacion de integracion con Docker

**Files:**
- Test: `services/backend/src/server.js`
- Test: `services/backend/package.json`

**Step 1: Rebuild backend image**

Run: `docker compose build backend`
Workdir: repo root
Expected: build exit 0.

**Step 2: Reiniciar backend**

Run: `docker compose up -d backend`
Workdir: repo root
Expected: backend container running.

**Step 3: Verificar logs de arranque**

Run: `docker compose logs backend --since=2m`
Workdir: repo root
Expected: servidor levantado; sin errores ESM.

### Task 6: Cierre y control de cambios

**Files:**
- Modify: `docs/plans/2026-03-07-backend-esm-migration-implementation.md` (si se requieren ajustes)

**Step 1: Revisar estado final**

Run: `git status --short -- services/backend docs/plans`
Expected: solo cambios esperados.

**Step 2: Mensaje de commit sugerido (si usuario solicita commit)**

```text
refactor: migrate backend runtime from commonjs to esm
```
