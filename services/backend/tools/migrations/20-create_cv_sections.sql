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
