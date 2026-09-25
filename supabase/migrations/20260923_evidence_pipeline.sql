-- Migration: Evidence-Based Recruitment Pipeline Schema
-- Stores individual extracted evidence items and stage decisions for auditable hiring decisions.

CREATE TABLE IF NOT EXISTS pipeline_evidence (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    source_type TEXT NOT NULL, -- resume_text, jd_text, github_repo, github_commit_stats, leetcode_stats, hackathon_submission, interview_transcript
    source_ref TEXT NOT NULL,  -- e.g. resume:line 12, github.com/user/repo#commits, leetcode.com/user, transcript:00:12:03
    quote_or_fact TEXT NOT NULL,
    extracted_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pipeline_evidence_candidate_id ON pipeline_evidence (candidate_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_evidence_source_type ON pipeline_evidence (source_type);

CREATE TABLE IF NOT EXISTS pipeline_candidate_decisions (
    id TEXT PRIMARY KEY,
    candidate_id TEXT NOT NULL,
    stage TEXT NOT NULL, -- resume_jd_match, github_review, deep_review, final_selection
    outcome TEXT NOT NULL, -- advance, reject, hold
    criteria_results JSONB NOT NULL DEFAULT '[]'::jsonb,
    overall_confidence TEXT NOT NULL, -- high, medium, low
    rejection_summary TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_pipeline_decision_candidate_stage UNIQUE (candidate_id, stage)
);

CREATE INDEX IF NOT EXISTS idx_pipeline_decision_candidate ON pipeline_candidate_decisions (candidate_id);
CREATE INDEX IF NOT EXISTS idx_pipeline_decision_stage ON pipeline_candidate_decisions (stage);
CREATE INDEX IF NOT EXISTS idx_pipeline_decision_outcome ON pipeline_candidate_decisions (outcome);
