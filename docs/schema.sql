-- JobTrack public demo schema
-- This schema documents the intended structure behind data/sample_applications.json.
-- The static demo does not create a real database.

CREATE TABLE applications (
  application_id TEXT PRIMARY KEY,
  company_name TEXT NOT NULL,
  position_title TEXT NOT NULL,
  department TEXT NOT NULL,
  job_level TEXT NOT NULL,
  employment_type TEXT NOT NULL,
  location TEXT NOT NULL,
  work_mode TEXT NOT NULL CHECK (work_mode IN ('Remote', 'Hybrid', 'On-site')),
  platform TEXT NOT NULL,
  source_url TEXT,
  saved_at DATE NOT NULL,
  applied_at DATE,
  current_status TEXT NOT NULL CHECK (
    current_status IN (
      'saved',
      'applied',
      'screening',
      'interview',
      'offer',
      'rejected',
      'withdrawn'
    )
  ),
  current_stage_started_at DATE NOT NULL,
  last_updated_at DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),
  salary_min_twd INTEGER NOT NULL CHECK (salary_min_twd >= 0),
  salary_max_twd INTEGER NOT NULL CHECK (salary_max_twd >= salary_min_twd),
  recruiter_contacted BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NOT NULL
);

CREATE INDEX idx_applications_status ON applications (current_status);
CREATE INDEX idx_applications_platform ON applications (platform);
CREATE INDEX idx_applications_applied_at ON applications (applied_at);
CREATE INDEX idx_applications_last_updated_at ON applications (last_updated_at);

-- Optional future table for Version 3 status-history simulation.
CREATE TABLE application_status_history (
  history_id TEXT PRIMARY KEY,
  application_id TEXT NOT NULL REFERENCES applications (application_id),
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_at DATE NOT NULL,
  change_note TEXT
);
