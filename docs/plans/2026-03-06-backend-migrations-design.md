# Diseno de migraciones backend para sbjobs

## Objetivo

Definir la estructura inicial de base de datos PostgreSQL para una app donde:

- Un usuario se registra y gestiona su informacion personal.
- El usuario mantiene un CV base editable.
- Se almacenan empresas y ofertas laborales.
- Se generan CVs personalizados por candidatura (via n8n).
- El usuario aprueba y se envia la candidatura.
- Se conserva trazabilidad completa de cada candidatura.

Se implementa un modelo normalizado (sin seeds de referencia en esta fase).

## Alcance y decisiones aprobadas

- Se incluye solo modelo de negocio (sin tablas de autenticacion avanzada ni auditoria dedicada).
- Se prioriza modelo normalizado.
- No se crea `seed_reference_data.sql`.
- Numeracion de migraciones en bloques de 5 para dejar espacio a intermedias futuras.

## Arquitectura de datos

Tablas propuestas:

1. `users`
2. `user_profiles`
3. `user_cv_templates`
4. `user_cv_sections`
5. `companies`
6. `company_contacts`
7. `job_offers`
8. `job_offer_contacts`
9. `applications`
10. `application_cv_versions`
11. `application_events`
12. `application_attachments`

## Modelo por tabla

### `users`

- `id` (PK)
- `email` (UNIQUE, requerido)
- `password_hash` (requerido)
- `first_name`, `last_name`, `phone`
- `created_at`, `updated_at` (default `now()`)

Indice principal: `UNIQUE(email)`.

### `user_profiles`

- `user_id` (PK, FK -> `users.id`)
- `country`, `city`
- `linkedin_url`, `github_url`, `portfolio_url`
- `years_experience`
- `desired_salary_min`, `desired_salary_max`
- `availability`
- `updated_at`

Relacion 1:1 con usuario.

### `user_cv_templates`

- `id` (PK)
- `user_id` (FK -> `users.id`)
- `title`, `summary`
- `is_default` (boolean)
- `created_at`, `updated_at`

Regla: un solo CV por defecto por usuario (indice unico parcial por `user_id` cuando `is_default = true`).

### `user_cv_sections`

- `id` (PK)
- `cv_template_id` (FK -> `user_cv_templates.id`)
- `section_type` (check de tipos permitidos)
- `position` (orden)
- `content_json` (JSONB)
- `created_at`, `updated_at`

Indices recomendados:

- (`cv_template_id`, `section_type`)
- (`cv_template_id`, `position`)

### `companies`

- `id` (PK)
- `name` (requerido)
- `website`, `industry`, `size_range`
- `country`, `city`
- `created_at`, `updated_at`

Indices: (`name`), (`country`, `city`).

### `company_contacts`

- `id` (PK)
- `company_id` (FK -> `companies.id`)
- `full_name`, `role`, `email`, `phone`
- `is_primary` (boolean)
- `created_at`, `updated_at`

Indices: (`company_id`), (`email`).

### `job_offers`

- `id` (PK)
- `company_id` (FK -> `companies.id`)
- `title`, `description`, `requirements`
- `employment_type`, `modality`, `location_text`
- `salary_min`, `salary_max`, `currency`
- `source_url`, `external_ref`
- `status` (check: `open`, `closed`, `paused`)
- `published_at`, `created_at`, `updated_at`

Indices: (`company_id`), (`status`), (`published_at`), (`external_ref`).

### `job_offer_contacts`

- `id` (PK)
- `job_offer_id` (FK -> `job_offers.id`)
- `company_contact_id` (FK -> `company_contacts.id`)
- `email_override`, `notes`

Indice: (`job_offer_id`).

### `applications`

- `id` (PK)
- `user_id` (FK -> `users.id`)
- `job_offer_id` (FK -> `job_offers.id`)
- `status`
- `applied_at`, `submitted_at`
- `source_channel`, `external_application_id`, `notes`
- `created_at`, `updated_at`

Regla: candidatura unica por usuario/oferta (`UNIQUE(user_id, job_offer_id)`).

Indices: (`user_id`, `status`), (`job_offer_id`, `status`).

### `application_cv_versions`

- `id` (PK)
- `application_id` (FK -> `applications.id`)
- `base_cv_template_id` (FK -> `user_cv_templates.id`)
- `version_number`
- `summary_customized`
- `content_json` (JSONB)
- `generated_by` (`n8n` o `manual`)
- `created_at`

Regla: version unica por candidatura (`UNIQUE(application_id, version_number)`).

### `application_events`

- `id` (PK)
- `application_id` (FK -> `applications.id`)
- `event_type`
- `event_at`
- `actor` (`system` o `user`)
- `payload_json` (JSONB)

Modelo append-only para trazabilidad.

Indices: (`application_id`, `event_at`), (`event_type`).

### `application_attachments`

- `id` (PK)
- `application_id` (FK -> `applications.id`)
- `attachment_type`
- `file_name`, `storage_url`, `mime_type`
- `created_at`

Indices: (`application_id`), (`attachment_type`).

## Flujo funcional soportado

1. Registro de usuario y perfil.
2. Creacion/edicion de CV base.
3. Registro de empresa y oferta laboral.
4. Inicio de candidatura en `draft`.
5. Generacion de CV personalizado por n8n (`application_cv_versions`, evento `cv_generated`).
6. Aprobacion del usuario (`approved_by_user`).
7. Envio automatico (`submitted`).
8. Seguimiento de respuestas con eventos y estados.

## Estados de candidatura

Valores propuestos:

- `draft`
- `cv_generated`
- `approved_by_user`
- `submitted`
- `in_review`
- `interview`
- `offer`
- `accepted`
- `rejected`
- `withdrawn`

En esta fase: `CHECK` de valores en BD. Las transiciones validas se controlaran en backend.

## Estrategia de archivos de migracion

Ruta: `services/backend/tools/migrations/`

Orden y numeracion aprobada (saltos de 5):

- `05-create_users.sql`
- `10-create_user_profiles.sql`
- `15-create_cv_templates.sql`
- `20-create_cv_sections.sql`
- `25-create_companies.sql`
- `30-create_company_contacts.sql`
- `35-create_job_offers.sql`
- `40-create_job_offer_contacts.sql`
- `45-create_applications.sql`
- `50-create_application_cv_versions.sql`
- `55-create_application_events.sql`
- `60-create_application_attachments.sql`
- `65-create_indexes_and_uniques.sql`

## Criterios tecnicos para SQL

- Todas las FK con `ON DELETE` explicito segun relacion.
- `CREATE TABLE IF NOT EXISTS` para ejecucion repetible.
- `CREATE INDEX IF NOT EXISTS` para indices.
- Timestamps con `DEFAULT now()`.
- `CHECK` en campos de estado/tipo.
