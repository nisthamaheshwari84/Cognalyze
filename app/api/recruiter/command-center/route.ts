import { NextResponse } from "next/server";
import { getActionQueue, getAllCandidates, getAllRoles, getHireOutcomeRecords } from "@/lib/recruiter-store";

export async function GET() {
  try {
    const [actionQueue, candidates, roles, hireOutcomes] = await Promise.all([
      getActionQueue(),
      getAllCandidates(),
      getAllRoles(),
      getHireOutcomeRecords()
    ]);

    const activePositions = roles.filter(r => r.status === "active").length;
    const pendingEvaluations = actionQueue.filter(a => a.type === "evaluate_work_sample").length;
    const conflictsCount = actionQueue.filter(a => a.type === "resolve_conflict").length;
    const decisionRoomCount = actionQueue.filter(a => a.type === "decision_room_ready").length;

    return NextResponse.json({
      success: true,
      commandCenter: {
        kpis: {
          activePositions,
          totalCandidates: candidates.length,
          pendingActionItems: actionQueue.length,
          pendingEvaluations,
          conflictsCount,
          decisionRoomCount,
          completed90DayReviews: hireOutcomes.filter(h => h.day90Milestone !== undefined).length
        },
        actionQueue,
        openPositions: roles.map(r => ({
          id: r.id,
          title: r.title,
          department: r.department,
          seniority: r.seniority,
          targetHires: r.targetHires,
          applicantsCount: candidates.filter(c => c.appliedRoleId === r.id).length,
          criticalRequirementsCount: r.tieredRequirements.filter(req => req.tier === "Critical").length
        })),
        recentCandidates: candidates.slice(0, 6).map(c => ({
          id: c.id,
          name: c.name,
          roleTitle: c.appliedRoleTitle,
          sourceType: c.sourceType,
          currentStage: c.currentStage,
          appliedAt: c.appliedAt
        }))
      }
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
