import { NextRequest, NextResponse } from "next/server";
import { searchInstitutions, normalizeInstitution } from "@/lib/institution/institution-service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const q = searchParams.get("q") || "";

    if (!q || q.trim().length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
        query: q
      });
    }

    const results = await searchInstitutions(q);

    return NextResponse.json({
      success: true,
      query: q,
      results
    });
  } catch (error: any) {
    console.error("GET /api/student/institution/search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search institutions." },
      { status: 500 }
    );
  }
}
