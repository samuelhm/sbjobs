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
