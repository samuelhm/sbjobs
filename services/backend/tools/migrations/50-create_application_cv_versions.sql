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
