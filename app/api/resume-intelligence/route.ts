import { NextRequest, NextResponse } from 'next/server';
import { analyzeResumeIntelligence } from '@/lib/ai/resume-intelligence-engine';

export const maxDuration = 60; // Allow sufficient duration for thorough intelligence audit

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const resumeText = body.resumeText || body.resume || '';
    const jobDescription = body.jobDescription || body.jd || '';
    const candidateProfile = body.candidateProfile || {};

    if (!resumeText || typeof resumeText !== 'string' || !resumeText.trim()) {
      return NextResponse.json(
        { success: false, error: 'Resume text is required for evidence-grounded intelligence audit.' },
        { status: 400 }
      );
    }

    const report = await analyzeResumeIntelligence(resumeText, jobDescription, candidateProfile);

    return NextResponse.json({
      success: true,
      report,
    });
  } catch (error: any) {
    console.error('[API /api/resume-intelligence] Error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to process resume intelligence audit.',
      },
      { status: 500 }
    );
  }
}
