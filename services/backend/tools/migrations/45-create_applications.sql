CREATE TABLE IF NOT EXISTS applications (
  id BIGSERIAL PRIMARY KEY,
  user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  job_offer_id BIGINT NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN (
    'draft',
    'cv_generated',
    'approved_by_user',
    'submitted',
    'in_review',
    'interview',
    'offer',
    'accepted',
    'rejected',
    'withdrawn'
  )),
  applied_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  source_channel TEXT,
  external_application_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
