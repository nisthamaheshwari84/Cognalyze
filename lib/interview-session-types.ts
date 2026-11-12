/**
 * lib/interview-session-types.ts
 * 
 * Pure TypeScript types for Interview Sessions.
 * Safe to import in both client and server components.
 * ZERO imports of Node.js native modules or server-only SDKs.
 */

export interface InterviewSession {
  id: string;
  candidate_id: string;
  session_type: "mock_interview" | "assessment_arena";
  experience_mode: string;
  target_role: string;
  target_company?: string;
  opportunity_id?: string;
  topics_covered: string[];
  answer_distribution: {
    strong: number;
    adequate: number;
    shallow: number;
    off_topic: number;
  };
  security_flags: {
    tab_switches: number;
    face_violations: number;
  };
  overall_score: number;
  weak_topics_identified: string[];
  created_at: string;
  interview_type?: string;
  track?: string;
  difficulty?: string;
  duration_minutes?: number;
  report?: any;
  milestone5Report?: any;
  transcript?: Array<{ role: string; content: string; time?: string; isFollowUp?: boolean }>;
}

export type SaveSessionInput = Partial<InterviewSession> & {
  candidate_id: string;
  target_role: string;
  overall_score: number;
};

