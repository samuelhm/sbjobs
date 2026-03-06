# Backend Linting Setup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Configurar linting y formateo en `services/backend` con ESLint 9 (flat config) y Prettier, listos para uso diario en desarrollo.

**Architecture:** Se agregaran configuraciones dedicadas dentro de `services/backend` para mantener el alcance local al backend. ESLint detectara errores de codigo y Prettier sera el unico responsable del formato, evitando conflicto mediante `eslint-config-prettier`. La validacion final se hara con scripts npm (`lint` y `format:check`).

**Tech Stack:** Node.js, Fastify, ESLint 9, Prettier

---

### Task 1: Instalar dependencias de lint y formato

**Files:**
- Modify: `services/backend/package.json`
- Modify: `services/backend/package-lock.json`

**Step 1: Agregar dependencias de desarrollo**

Run: `npm install --save-dev eslint @eslint/js globals prettier eslint-config-prettier`
Workdir: `services/backend`
Expected: dependencias agregadas a `devDependencies`.

**Step 2: Verificar `package.json` actualizado**

Run: `npm pkg get devDependencies`
Workdir: `services/backend`
Expected: aparecen `eslint`, `@eslint/js`, `globals`, `prettier`, `eslint-config-prettier`.

### Task 2: Configurar ESLint flat config

**Files:**
- Create: `services/backend/eslint.config.mjs`

**Step 1: Crear configuracion base de ESLint**

Contenido esperado:

```js
import js from '@eslint/js';
import globals from 'globals';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['node_modules/**', 'dist/**', 'build/**', 'coverage/**'],
  },
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'prefer-const': 'error',
      eqeqeq: ['error', 'always'],
    },
  },
  eslintConfigPrettier,
];
```

**Step 2: Verificar sintaxis de configuracion**

Run: `node -e "import('./eslint.config.mjs').then(()=>console.log('ok')).catch(err=>{console.error(err);process.exit(1);})"`
Workdir: `services/backend`
Expected: imprime `ok`.

### Task 3: Configurar Prettier

**Files:**
- Create: `services/backend/.prettierrc`
- Create: `services/backend/.prettierignore`

**Step 1: Crear `.prettierrc`**

Contenido esperado:

```json
{
  "singleQuote": true,
  "semi": true,
  "trailingComma": "es5",
  "printWidth": 100
}
```

**Step 2: Crear `.prettierignore`**

Contenido esperado:

```text
node_modules
dist
build
coverage
```

**Step 3: Verificar deteccion de configuracion de Prettier**

Run: `npx prettier --check src/server.js`
Workdir: `services/backend`
Expected: comando ejecuta sin error de configuracion.

### Task 4: Agregar scripts npm de calidad

**Files:**
- Modify: `services/backend/package.json`

**Step 1: Agregar scripts**

Agregar dentro de `scripts`:

```json
{
  "lint": "eslint .",
  "lint:fix": "eslint . --fix",
  "format": "prettier . --write",
  "format:check": "prettier . --check"
}
```

Respetar scripts existentes (`dev`, `start`, `test`).

**Step 2: Validar scripts disponibles**

Run: `npm run`
Workdir: `services/backend`
Expected: aparecen `lint`, `lint:fix`, `format`, `format:check`.

### Task 5: Ejecutar verificacion funcional

**Files:**
- Test: `services/backend/src/server.js`
- Test: `services/backend/eslint.config.mjs`
- Test: `services/backend/.prettierrc`

**Step 1: Ejecutar lint**

Run: `npm run lint`
Workdir: `services/backend`
Expected: salida sin errores (warnings permitidos si no bloquean).

**Step 2: Ejecutar chequeo de formato**

Run: `npm run format:check`
Workdir: `services/backend`
Expected: salida `All matched files use Prettier code style!`.

**Step 3: Corregir si hay desalineaciones**

Run: `npm run lint:fix && npm run format`
Workdir: `services/backend`
Expected: archivos corregidos automaticamente.

**Step 4: Re-verificar en limpio**

Run: `npm run lint && npm run format:check`
Workdir: `services/backend`
Expected: ambos comandos pasan.

### Task 6: Documentar resultado operativo

**Files:**
- Modify: `docs/plans/2026-03-07-backend-linting-implementation.md` (si se ajusto algun detalle durante ejecucion)

**Step 1: Validar cambios finales**

Run: `git status --short -- services/backend docs/plans`
Expected: solo archivos de configuracion esperados.

**Step 2: Preparar mensaje de commit (cuando el usuario lo solicite)**

Mensaje sugerido:

```text
chore: configure eslint and prettier for backend javascript service
```
