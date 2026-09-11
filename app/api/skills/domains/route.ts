import { NextRequest, NextResponse } from "next/server";
import { skillHubStore } from "@/lib/skill-hub-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const candidateId = searchParams.get("candidateId") || "student-demo";
    const tracksParam = searchParams.get("tracks");

    let activeTracks: Array<"service_mass" | "service_elite" | "product_mid" | "product_faang">;

    if (tracksParam) {
      activeTracks = tracksParam.split(",").map(t => t.trim()) as any;
    } else {
      activeTracks = skillHubStore.getStudentTracks(candidateId);
    }

    const filteredDomains = skillHubStore.getDomainsForTracks(activeTracks);
    const filteredResources = skillHubStore.getResourcesForTracks(activeTracks);

    // Group resources by domain slug
    const domainDetails = filteredDomains.map(domain => {
      const domainRes = filteredResources.filter((r: any) => r.domain === domain.slug);
      return {
        ...domain,
        resourcesCount: domainRes.length,
        depth: domainRes.length > 0 ? "interview_deep" : "basic",
        resources: domainRes
      };
    });

    return NextResponse.json({
      success: true,
      candidateId,
      activeTracks,
      domains: domainDetails,
      totalDomains: domainDetails.length,
      totalResources: filteredResources.length
    });
  } catch (err: any) {
    console.error("Error fetching skill domains:", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
