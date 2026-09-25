// lib/collab/types.ts
//
// Core types for Recruiter Role -> Collaboration Feed -> Student Apply (with Auto-DNA)

export interface Role {
  id: string;
  recruiter_id: string;
  title: string;
  description: string;
  required_skills: string[];
  feed_type: "post" | "collaboration";
  status: "open" | "closed";
  created_at: string;
}

export interface RoleApplication {
  id: string;
  role_id: string;
  student_id: string;
  resume_id: string;
  github_url: string | null;
  dna_snapshot: Record<string, unknown>; // frozen copy of the student's `analyses` row at apply time
  dna_snapshot_source_analysis_id: string | null;
  applied_at: string;
}

export interface CreateRoleInput {
  title: string;
  description: string;
  required_skills: string[];
  // NOTE: no `feed_type` field here on purpose — roles created through this flow are ALWAYS collaboration feed.
}

export interface ApplyToRoleInput {
  role_id: string;
  resume_id: string;
  github_url?: string;
}

export interface CollaborationFeedRole extends Role {
  already_applied: boolean;
  recruiter_name?: string;
  applicant_count?: number;
}
