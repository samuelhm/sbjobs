# Backend Migrations Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Crear las migraciones SQL del backend para levantar el modelo de datos completo de sbjobs en PostgreSQL.

**Architecture:** Se implementara un esquema normalizado por dominios (usuarios, CV, empresas/ofertas, candidaturas) en archivos SQL versionados dentro de `services/backend/tools/migrations`. Las tablas se crean primero y luego se aplican indices/uniques en un archivo final para mantener orden y facilitar insercion de migraciones intermedias.

**Tech Stack:** PostgreSQL 16, Docker Compose, SQL (`psql`)

---

### Task 1: Preparar estructura de migraciones

**Files:**
- Delete: `services/backend/tools/migrations/01-create_user_table.sql`
- Create: `services/backend/tools/migrations/05-create_users.sql`
- Create: `services/backend/tools/migrations/10-create_user_profiles.sql`
- Create: `services/backend/tools/migrations/15-create_cv_templates.sql`
- Create: `services/backend/tools/migrations/20-create_cv_sections.sql`
- Create: `services/backend/tools/migrations/25-create_companies.sql`
- Create: `services/backend/tools/migrations/30-create_company_contacts.sql`
- Create: `services/backend/tools/migrations/35-create_job_offers.sql`
- Create: `services/backend/tools/migrations/40-create_job_offer_contacts.sql`
- Create: `services/backend/tools/migrations/45-create_applications.sql`
- Create: `services/backend/tools/migrations/50-create_application_cv_versions.sql`
- Create: `services/backend/tools/migrations/55-create_application_events.sql`
- Create: `services/backend/tools/migrations/60-create_application_attachments.sql`
- Create: `services/backend/tools/migrations/65-create_indexes_and_uniques.sql`

**Step 1: Eliminar migracion inicial vacia**

Run: `rm services/backend/tools/migrations/01-create_user_table.sql`

**Step 2: Crear archivos vacios con numeracion de 5 en 5**

Run: `touch services/backend/tools/migrations/{05-create_users.sql,10-create_user_profiles.sql,15-create_cv_templates.sql,20-create_cv_sections.sql,25-create_companies.sql,30-create_company_contacts.sql,35-create_job_offers.sql,40-create_job_offer_contacts.sql,45-create_applications.sql,50-create_application_cv_versions.sql,55-create_application_events.sql,60-create_application_attachments.sql,65-create_indexes_and_uniques.sql}`

**Step 3: Verificar orden de archivos**

Run: `ls -1 services/backend/tools/migrations`
Expected: Lista ordenada desde `05-...` hasta `65-...`.

### Task 2: Crear dominio de usuarios y perfil

**Files:**
- Modify: `services/backend/tools/migrations/05-create_users.sql`
- Modify: `services/backend/tools/migrations/10-create_user_profiles.sql`

**Step 1: Escribir `05-create_users.sql`**

```sql
CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 2: Escribir `10-create_user_profiles.sql`**

```sql
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  country TEXT,
  city TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  portfolio_url TEXT,
  years_experience INTEGER,
  desired_salary_min NUMERIC(12,2),
  desired_salary_max NUMERIC(12,2),
  availability TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 3: Ejecutar ambas migraciones**

Run: `for f in services/backend/tools/migrations/05-create_users.sql services/backend/tools/migrations/10-create_user_profiles.sql; do docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_ADMIN" -d "$DB_NAME" < "$f"; done`
Expected: `CREATE TABLE` en ambas.

### Task 3: Crear dominio CV base

**Files:**
- Modify: `services/backend/tools/migrations/15-create_cv_templates.sql`
- Modify: `services/backend/tools/migrations/20-create_cv_sections.sql`

**Step 1: Escribir `15-create_cv_templates.sql`**

```sql
CREATE TABLE IF NOT EXISTS user_cv_templates (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  summary TEXT,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 2: Escribir `20-create_cv_sections.sql`**

```sql
CREATE TABLE IF NOT EXISTS user_cv_sections (
  id BIGSERIAL PRIMARY KEY,
  cv_template_id BIGINT NOT NULL REFERENCES user_cv_templates(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL CHECK (section_type IN (
    'experience', 'education', 'skills', 'languages', 'projects', 'certifications', 'custom'
  )),
  position INTEGER NOT NULL,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 3: Ejecutar migraciones de CV**

Run: `for f in services/backend/tools/migrations/15-create_cv_templates.sql services/backend/tools/migrations/20-create_cv_sections.sql; do docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_ADMIN" -d "$DB_NAME" < "$f"; done`
Expected: `CREATE TABLE` en ambas.

### Task 4: Crear dominio de empresas y ofertas

**Files:**
- Modify: `services/backend/tools/migrations/25-create_companies.sql`
- Modify: `services/backend/tools/migrations/30-create_company_contacts.sql`
- Modify: `services/backend/tools/migrations/35-create_job_offers.sql`
- Modify: `services/backend/tools/migrations/40-create_job_offer_contacts.sql`

**Step 1: Escribir `25-create_companies.sql`**

```sql
CREATE TABLE IF NOT EXISTS companies (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  industry TEXT,
  size_range TEXT,
  country TEXT,
  city TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 2: Escribir `30-create_company_contacts.sql`**

```sql
CREATE TABLE IF NOT EXISTS company_contacts (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  full_name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 3: Escribir `35-create_job_offers.sql`**

```sql
CREATE TABLE IF NOT EXISTS job_offers (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES companies(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  requirements TEXT,
  employment_type TEXT,
  modality TEXT,
  location_text TEXT,
  salary_min NUMERIC(12,2),
  salary_max NUMERIC(12,2),
  currency TEXT,
  source_url TEXT,
  external_ref TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'paused')),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 4: Escribir `40-create_job_offer_contacts.sql`**

```sql
CREATE TABLE IF NOT EXISTS job_offer_contacts (
  id BIGSERIAL PRIMARY KEY,
  job_offer_id BIGINT NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  company_contact_id BIGINT REFERENCES company_contacts(id) ON DELETE SET NULL,
  email_override TEXT,
  notes TEXT
);
```

**Step 5: Ejecutar migraciones de empresas/ofertas**

Run: `for f in services/backend/tools/migrations/25-create_companies.sql services/backend/tools/migrations/30-create_company_contacts.sql services/backend/tools/migrations/35-create_job_offers.sql services/backend/tools/migrations/40-create_job_offer_contacts.sql; do docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_ADMIN" -d "$DB_NAME" < "$f"; done`
Expected: `CREATE TABLE` en todas.

### Task 5: Crear dominio de candidaturas

**Files:**
- Modify: `services/backend/tools/migrations/45-create_applications.sql`
- Modify: `services/backend/tools/migrations/50-create_application_cv_versions.sql`
- Modify: `services/backend/tools/migrations/55-create_application_events.sql`
- Modify: `services/backend/tools/migrations/60-create_application_attachments.sql`

**Step 1: Escribir `45-create_applications.sql`**

```sql
CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_offer_id BIGINT NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft', 'cv_generated', 'approved_by_user', 'submitted', 'in_review',
    'interview', 'offer', 'accepted', 'rejected', 'withdrawn'
  )),
  applied_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  source_channel TEXT,
  external_application_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 2: Escribir `50-create_application_cv_versions.sql`**

```sql
CREATE TABLE IF NOT EXISTS application_cv_versions (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  base_cv_template_id BIGINT REFERENCES user_cv_templates(id) ON DELETE SET NULL,
  version_number INTEGER NOT NULL,
  summary_customized TEXT,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_by TEXT NOT NULL DEFAULT 'n8n' CHECK (generated_by IN ('n8n', 'manual')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 3: Escribir `55-create_application_events.sql`**

```sql
CREATE TABLE IF NOT EXISTS application_events (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT NOT NULL CHECK (actor IN ('system', 'user')),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb
);
```

**Step 4: Escribir `60-create_application_attachments.sql`**

```sql
CREATE TABLE IF NOT EXISTS application_attachments (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL,
  file_name TEXT,
  storage_url TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

**Step 5: Ejecutar migraciones de candidaturas**

Run: `for f in services/backend/tools/migrations/45-create_applications.sql services/backend/tools/migrations/50-create_application_cv_versions.sql services/backend/tools/migrations/55-create_application_events.sql services/backend/tools/migrations/60-create_application_attachments.sql; do docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_ADMIN" -d "$DB_NAME" < "$f"; done`
Expected: `CREATE TABLE` en todas.

### Task 6: Crear indices y restricciones finales

**Files:**
- Modify: `services/backend/tools/migrations/65-create_indexes_and_uniques.sql`

**Step 1: Escribir indices/uniques**

```sql
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_email ON users (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS ux_applications_user_offer ON applications (user_id, job_offer_id);
CREATE UNIQUE INDEX IF NOT EXISTS ux_cv_default_per_user ON user_cv_templates (user_id) WHERE is_default = true;
CREATE UNIQUE INDEX IF NOT EXISTS ux_application_cv_version ON application_cv_versions (application_id, version_number);

CREATE INDEX IF NOT EXISTS ix_cv_sections_template_type ON user_cv_sections (cv_template_id, section_type);
CREATE INDEX IF NOT EXISTS ix_cv_sections_template_position ON user_cv_sections (cv_template_id, position);
CREATE INDEX IF NOT EXISTS ix_companies_name ON companies (name);
CREATE INDEX IF NOT EXISTS ix_companies_location ON companies (country, city);
CREATE INDEX IF NOT EXISTS ix_company_contacts_company_id ON company_contacts (company_id);
CREATE INDEX IF NOT EXISTS ix_company_contacts_email ON company_contacts (email);
CREATE INDEX IF NOT EXISTS ix_job_offers_company_id ON job_offers (company_id);
CREATE INDEX IF NOT EXISTS ix_job_offers_status ON job_offers (status);
CREATE INDEX IF NOT EXISTS ix_job_offers_published_at ON job_offers (published_at);
CREATE INDEX IF NOT EXISTS ix_job_offers_external_ref ON job_offers (external_ref);
CREATE INDEX IF NOT EXISTS ix_job_offer_contacts_job_offer_id ON job_offer_contacts (job_offer_id);
CREATE INDEX IF NOT EXISTS ix_applications_user_status ON applications (user_id, status);
CREATE INDEX IF NOT EXISTS ix_applications_offer_status ON applications (job_offer_id, status);
CREATE INDEX IF NOT EXISTS ix_application_events_app_time ON application_events (application_id, event_at);
CREATE INDEX IF NOT EXISTS ix_application_events_type ON application_events (event_type);
CREATE INDEX IF NOT EXISTS ix_application_attachments_app_id ON application_attachments (application_id);
CREATE INDEX IF NOT EXISTS ix_application_attachments_type ON application_attachments (attachment_type);
```

**Step 2: Ejecutar la migracion de indices**

Run: `docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_ADMIN" -d "$DB_NAME" < services/backend/tools/migrations/65-create_indexes_and_uniques.sql`
Expected: `CREATE INDEX` / `CREATE UNIQUE INDEX`.

### Task 7: Verificacion end-to-end de esquema

**Files:**
- Test: `services/backend/tools/migrations/*.sql`

**Step 1: Ejecutar todas las migraciones en orden**

Run: `for f in $(ls -1 services/backend/tools/migrations/*.sql | sort); do echo "==> $f"; docker compose exec -T postgres psql -v ON_ERROR_STOP=1 -U "$DB_ADMIN" -d "$DB_NAME" < "$f"; done`
Expected: Ningun error SQL.

**Step 2: Verificar tablas creadas**

Run: `docker compose exec -T postgres psql -U "$DB_ADMIN" -d "$DB_NAME" -c "\dt"`
Expected: aparecen las 12 tablas del modelo.

**Step 3: Verificar indices clave**

Run: `docker compose exec -T postgres psql -U "$DB_ADMIN" -d "$DB_NAME" -c "\di"`
Expected: aparecen los indices `ux_users_email`, `ux_applications_user_offer`, `ux_cv_default_per_user` y `ux_application_cv_version`.

### Task 8: Control de cambios

**Files:**
- Modify: `docs/plans/2026-03-06-backend-migrations-implementation.md` (si se ajusta algo durante ejecucion)

**Step 1: Revisar diff final**

Run: `git status && git diff -- services/backend/tools/migrations docs/plans`
Expected: solo cambios esperados de migraciones y plan.

**Step 2: Commit de migraciones**

Run: `git add services/backend/tools/migrations docs/plans/2026-03-06-backend-migrations-implementation.md && git commit -m "feat: add normalized postgres migrations for users, cvs, jobs and applications"`
Expected: commit creado correctamente.
