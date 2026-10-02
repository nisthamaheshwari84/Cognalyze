import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedContext } from "@/lib/auth/server";
import { getStudentDNAFull, setUserTargetRole, getUserTargetRole } from "@/lib/dna/store";

export async function GET(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to access Student DNA." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts are restricted from accessing Student DNA." },
        { status: 403 }
      );
    }

    // Strictly scope query to the authenticated student's permanent user ID
    const candidateId = auth.user.id;
    const dna = await getStudentDNAFull(candidateId);

    return NextResponse.json({
      success: true,
      data: dna
    });
  } catch (error: any) {
    console.error("GET /api/student-dna error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to fetch student DNA" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthenticatedContext(req);
    if (!auth) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. Please sign in to update Student DNA." },
        { status: 401 }
      );
    }

    if (auth.user.accountType === "recruiter") {
      return NextResponse.json(
        { success: false, error: "Forbidden. Recruiter accounts cannot modify Student DNA." },
        { status: 403 }
      );
    }

    const candidateId = auth.user.id;
    const body = await req.json();

    if (body.targetRoleKey) {
      setUserTargetRole(candidateId, body.targetRoleKey);
    }

    const dna = await getStudentDNAFull(candidateId);

    return NextResponse.json({
      success: true,
      data: dna
    });
  } catch (error: any) {
    console.error("POST /api/student-dna error:", error);
    return NextResponse.json({ success: false, error: error.message || "Failed to update student DNA" }, { status: 500 });
  }
}
