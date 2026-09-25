-- COGNALYZE EVIDENCE OPERATING SYSTEM — EVIDENCE LAYER TABLE (Part 2)
-- Stores all verified external and internal evidence records.
-- Downstream systems (scoring, ranking, decision room) read exclusively from this table.

CREATE TABLE IF NOT EXISTS evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID REFERENCES candidates(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  source TEXT NOT NULL,              -- 'github' | 'leetcode' | 'codeforces' | 'resume' | 'interview' | 'behavioral'
  claim TEXT NOT NULL,               -- e.g. "backend API development"
  raw_data JSONB,                    -- unmodified API response, kept for audit trail
  normalized_facts JSONB,            -- code-layer-extracted structured facts
  extracted_summary TEXT,            -- LLM Step 1 output — facts only, no verdict
  status TEXT NOT NULL,              -- established | partial | unknown | conflicting
  status_reason TEXT,                -- LLM Step 2 output — one line, evidence-cited
  role_relevance TEXT,               -- which JD requirement this maps to
  fetched_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS evidence_candidate_role_idx ON evidence (candidate_id, role_id);
