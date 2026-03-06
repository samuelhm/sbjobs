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
