import { NextResponse } from "next/server";
import { getAllRoles, getAllCandidates } from "@/lib/recruiter-store";
import { discoverRediscoveryCandidates } from "@/lib/recruiter/recruiter-intelligence";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roleId = searchParams.get("roleId");

    const [roles, candidates] = await Promise.all([
      getAllRoles(),
      getAllCandidates()
    ]);

    if (roleId) {
      const targetRole = roles.find((r) => r.id === roleId);
      if (!targetRole) {
        return NextResponse.json({ error: "Role not found" }, { status: 404 });
      }

      const matches = discoverRediscoveryCandidates(targetRole, candidates);
      return NextResponse.json({
        success: true,
        roleId,
        roleTitle: targetRole.title,
        matches,
        count: matches.length,
      });
    }

    // Scan across all open roles
    const allMatches = roles.flatMap((role) => discoverRediscoveryCandidates(role, candidates));

    return NextResponse.json({
      success: true,
      matches: allMatches,
      count: allMatches.length,
    });
  } catch (err: any) {
    console.error("GET /api/recruiter/rediscovery error:", err);
    return NextResponse.json({ error: err.message || "Failed to find rediscovery candidates" }, { status: 500 });
  }
}
