CREATE TABLE IF NOT EXISTS application_attachments (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  attachment_type TEXT NOT NULL,
  file_name TEXT,
  storage_url TEXT NOT NULL,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
