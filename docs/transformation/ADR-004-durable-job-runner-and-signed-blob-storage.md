# ADR-004: Durable Job Runner and Signed Blob Storage on Vercel

## Context
PART 13 Decision 2 required selecting the durable job processing strategy and blob storage provider compatible with Vercel serverless limits.
The user approved the recommendation on 2026-09-20.

## Decision
1. **Durable Job Execution**:
   - Jobs are stored in the PostgreSQL `jobs` table with states: `queued`, `running`, `completed`, `failed`, `cancelled`.
   - Execution is chunked, idempotent, and resumable. Each step commits its progress (e.g., `processed_items`, `total_items`, `cost_usd`, `error_log`).
   - Long operations (such as multi-resume splitting and parsing) run in iterative batches within the 60-second execution window, allowing seamless continuation without job loss.
2. **Blob Storage**:
   - Resume PDFs, work sample submissions, and audit attachments are stored in a private Supabase Storage bucket (`evidence-blobs`).
   - Access is restricted through short-lived (15-minute) signed URLs generated on-demand with row-level organization scoping. No public bucket URLs.

## Consequences
- No extra third-party queue dependencies needed.
- Full durability and progress tracking visible in database rows and UI progress bars.
- Secure, compliant handling of candidate documents.
