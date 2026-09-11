import { NextResponse } from "next/server";
import {
  getStudentConnections,
  createConnectionInvite,
  acceptConnectionInvite,
  getStudentDsaProgress
} from "@/lib/dsa-store";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get("studentId") || "student-demo";

    const connections = await getStudentConnections(studentId);
    const acceptedFriends = connections.filter(c => c.status === "accepted");

    // Fetch friend stats only for accepted mutual connections
    const friendsData = await Promise.all(
      acceptedFriends.map(async conn => {
        const friendId = conn.requester_student_id === studentId ? conn.recipient_student_id : conn.requester_student_id;
        const pMap = await getStudentDsaProgress(friendId);
        let solved = 0;
        Object.values(pMap).forEach(p => { if (p.status === "solved") solved++; });

        return {
          connection_id: conn.id,
          friend_student_id: friendId,
          display_name: `Peer #${friendId.slice(-4)}`,
          status: conn.status,
          solved_count: solved,
          streak_days: solved > 0 ? Math.min(14, Math.ceil(solved / 2)) : 0,
          connected_since: conn.updated_at
        };
      })
    );

    const pendingInvites = connections.filter(c => c.status === "pending" && c.requester_student_id === studentId);

    return NextResponse.json({
      student_id: studentId,
      friends_count: friendsData.length,
      friends: friendsData,
      active_invite_codes: pendingInvites.map(p => p.connection_code)
    });
  } catch (error: any) {
    console.error("GET /api/dsa/social/friends error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch friends" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, studentId = "student-demo", code } = body;

    if (action === "create_invite") {
      const result = await createConnectionInvite(studentId);
      return NextResponse.json({
        success: true,
        message: "Invite code generated. Share this with your peer to establish mutual progress viewing.",
        ...result
      });
    }

    if (action === "accept_invite") {
      if (!code) {
        return NextResponse.json({ error: "Missing connection code." }, { status: 400 });
      }
      const conn = await acceptConnectionInvite(studentId, code.trim().toUpperCase());
      return NextResponse.json({
        success: true,
        message: "Connection accepted! You can now mutually compare practice progress.",
        connection: conn
      });
    }

    return NextResponse.json({ error: "Invalid action. Use 'create_invite' or 'accept_invite'." }, { status: 400 });
  } catch (error: any) {
    console.error("POST /api/dsa/social/friends error:", error);
    return NextResponse.json({ error: error.message || "Failed to process friend request" }, { status: 400 });
  }
}
