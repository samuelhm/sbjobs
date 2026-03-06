# Diseno de migracion a ESM en backend

## Objetivo

Migrar el backend Fastify de CommonJS a ESM con impacto minimo, manteniendo los mismos scripts de ejecucion y la configuracion de lint/format ya establecida.

## Decisiones aprobadas

- Usar ESM con archivos `.js` (sin renombrar a `.mjs`).
- Configurar `package.json` con `"type": "module"`.
- Convertir imports de runtime de `require` a `import`.
- Ajustar ESLint a `sourceType: 'module'`.

## Alternativas evaluadas

### Opcion A (aprobada)

Migracion minima a ESM con `.js` + `"type": "module"`.

- Ventajas: simple, limpia, consistente con enfoque moderno.
- Riesgos: futuros paquetes solo CJS pueden requerir adaptaciones puntuales.

### Opcion B

Estrategia hibrida (CJS + ESM por etapas).

- Ventaja: transicion gradual.
- Desventaja: mezcla de estilos y mayor complejidad cognitiva.

### Opcion C

Migrar a `.mjs`.

- Ventaja: explicito.
- Desventaja: ruido innecesario para estado actual del proyecto.

## Alcance tecnico

Archivos en alcance:

- `services/backend/package.json`
- `services/backend/src/server.js`
- `services/backend/eslint.config.mjs`

## Cambios propuestos

### 1) package.json

- Cambiar `"type": "commonjs"` a `"type": "module"`.
- Mantener scripts `dev` y `start` sin cambios (`node src/server.js`).

### 2) server runtime

- Cambiar `const Fastify = require('fastify')` por `import Fastify from 'fastify'`.
- Mantener logica del servidor igual.

### 3) ESLint

- Cambiar `sourceType: 'commonjs'` a `sourceType: 'module'`.
- Mantener reglas y globals actuales.

## Verificacion

Comandos de validacion:

1. `npm run lint`
2. `npm run format:check`
3. `npm run start`
4. (opcional) `curl /` al endpoint base

Resultado esperado:

- Sin errores de modulos ESM/CJS.
- Backend levantando y respondiendo como antes.

## Rollback

Si se requiere revertir rapidamente:

- Volver `"type": "commonjs"`.
- Revertir `import` a `require`.
- Restaurar ESLint a `sourceType: 'commonjs'`.
