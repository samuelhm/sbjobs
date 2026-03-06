# Diseno de linting para backend Fastify

## Objetivo

Configurar calidad de codigo para `services/backend` usando JavaScript con Fastify, aplicando lint y formato automatico sin extender el alcance a otros servicios por ahora.

## Decisiones aprobadas

- Herramienta de lint: ESLint.
- Enfoque tecnico: ESLint 9 con flat config (opcion A).
- Formateo: Prettier separado de ESLint (sin `eslint-plugin-prettier`).
- Alcance: solo `services/backend`.
- Servicios fuera de alcance por ahora: `services/postgres`, n8n y frontend.

## Alternativas evaluadas

### Opcion A (aprobada)

ESLint 9 flat config + Prettier + `eslint-config-prettier`.

- Ventajas: arquitectura moderna, menos ruido, evita conflictos entre reglas de estilo y formato.
- Riesgos: requiere usar formato de configuracion nuevo (`eslint.config.mjs`).

### Opcion B

ESLint + `eslint-plugin-prettier`.

- Ventaja: todo aparece en salida de ESLint.
- Desventaja: mas lento y mezcla responsabilidades (lint y formato en una sola salida).

### Opcion C

Configuracion minima centrada en formato.

- Ventaja: setup rapido.
- Desventaja: menor cobertura de problemas reales de codigo.

## Arquitectura de configuracion

### Dependencias de desarrollo

- `eslint`
- `@eslint/js`
- `globals`
- `prettier`
- `eslint-config-prettier`

### Archivos de configuracion

- `services/backend/eslint.config.mjs`
- `services/backend/.prettierrc`
- `services/backend/.prettierignore` (recomendado)

### Scripts npm en backend

- `lint`: ejecuta reglas ESLint.
- `lint:fix`: aplica fixes automáticos de ESLint.
- `format`: aplica formato Prettier.
- `format:check`: valida formato sin modificar archivos.

## Reglas iniciales recomendadas

- Base: `@eslint/js` recomendado.
- Entorno: Node.js + ECMAScript moderno.
- Reglas:
  - `no-unused-vars`: `warn` con excepcion para argumentos con prefijo `_`.
  - `no-console`: `off` (válido para backend).
  - `prefer-const`: `error`.
  - `eqeqeq`: `error`.

## Formato de codigo

Configuracion inicial de Prettier:

- `singleQuote: true`
- `semi: true`
- `trailingComma: es5`
- `printWidth: 100`

## Verificacion esperada

Despues de implementar:

1. `npm run lint` en `services/backend` sin errores.
2. `npm run format:check` sin diferencias de formato.
3. `npm run lint:fix` y `npm run format` disponibles para autofix.

## Alcance futuro (no incluido ahora)

- Definir estrategia de linting para frontend (Vite + Nginx runtime) cuando exista codigo.
- Evaluar linting para automatizaciones n8n solo si se crea codigo custom.
- Revisar hooks de pre-commit cuando el flujo de equipo lo requiera.
