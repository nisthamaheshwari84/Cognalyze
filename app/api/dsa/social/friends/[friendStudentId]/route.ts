import { NextResponse } from "next/server";
import { getStudentConnections, getStudentDsaProgress, getAllTopics, getAllProblems } from "@/lib/dsa-store";

export async function GET(
  req: Request,
  context: { params: Promise<{ friendStudentId: string }> }
) {
  try {
    const { friendStudentId } = await context.params;
    const { searchParams } = new URL(req.url);
    const requesterId = searchParams.get("studentId") || "student-demo";

    // 1. Verify mutual accepted connection
    const connections = await getStudentConnections(requesterId);
    const hasMutualConnection = connections.some(
      c =>
        c.status === "accepted" &&
        ((c.requester_student_id === requesterId && c.recipient_student_id === friendStudentId) ||
         (c.requester_student_id === friendStudentId && c.recipient_student_id === requesterId))
    );

    if (!hasMutualConnection) {
      return NextResponse.json(
        {
          error: "Access Denied: Progress is strictly private and only visible after mutual opt-in connection.",
          is_connected: false
        },
        { status: 403 }
      );
    }

    // 2. Return comparative stats
    const [friendProgress, myProgress, topics, problems] = await Promise.all([
      getStudentDsaProgress(friendStudentId),
      getStudentDsaProgress(requesterId),
      getAllTopics(),
      getAllProblems()
    ]);

    const friendSolved = Object.values(friendProgress).filter(p => p.status === "solved").length;
    const mySolved = Object.values(myProgress).filter(p => p.status === "solved").length;

    const topicBreakdown = topics.map(t => {
      const tProbs = problems.filter(p => p.topic_id === t.id);
      const friendTopicSolved = tProbs.filter(p => friendProgress[p.id]?.status === "solved").length;
      const myTopicSolved = tProbs.filter(p => myProgress[p.id]?.status === "solved").length;

      return {
        topic_name: t.name,
        total: tProbs.length,
        my_solved: myTopicSolved,
        friend_solved: friendTopicSolved
      };
    });

    return NextResponse.json({
      requester_id: requesterId,
      friend_id: friendStudentId,
      my_total_solved: mySolved,
      friend_total_solved: friendSolved,
      topic_breakdown: topicBreakdown
    });
  } catch (error: any) {
    console.error("GET /api/dsa/social/friends/[friendStudentId] error:", error);
    return NextResponse.json({ error: error.message || "Failed to compare progress" }, { status: 500 });
  }
}
