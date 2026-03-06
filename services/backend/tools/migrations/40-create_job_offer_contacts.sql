CREATE TABLE IF NOT EXISTS job_offer_contacts (
  id BIGSERIAL PRIMARY KEY,
  job_offer_id BIGINT NOT NULL REFERENCES job_offers(id) ON DELETE CASCADE,
  company_contact_id BIGINT REFERENCES company_contacts(id) ON DELETE SET NULL,
  email_override TEXT,
  notes TEXT
);
