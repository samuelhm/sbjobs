CREATE TABLE IF NOT EXISTS application_events (
  id BIGSERIAL PRIMARY KEY,
  application_id BIGINT NOT NULL REFERENCES applications(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor TEXT NOT NULL CHECK (actor IN ('system', 'user')),
  payload_json JSONB NOT NULL DEFAULT '{}'::jsonb
);
