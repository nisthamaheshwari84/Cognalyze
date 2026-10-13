import { NextRequest, NextResponse } from "next/server";
import { searchLocations, normalizeLocation } from "@/lib/geo/location-service";

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

    const results = await searchLocations(q);

    return NextResponse.json({
      success: true,
      query: q,
      results
    });
  } catch (error: any) {
    console.error("GET /api/student/location/search error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search locations." },
      { status: 500 }
    );
  }
}
