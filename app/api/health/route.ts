import { NextResponse } from "next/server";
import { getInterviewIntelligenceOrigin } from "@/lib/interview-intelligence/handoff";

export const dynamic = "force-dynamic";

export async function GET() {
  const origin = getInterviewIntelligenceOrigin();
  const candidates = [origin];
  if (origin.includes("://localhost:")) {
    candidates.push(origin.replace("://localhost:", "://127.0.0.1:"));
  }

  try {
    for (const base of candidates) {
      const upstreamRes = await fetch(`${base}/api/health`, {
        cache: "no-store",
        headers: { "Content-Type": "application/json" },
        signal: AbortSignal.timeout(4500),
      }).catch(() => null);

      if (upstreamRes && upstreamRes.ok) {
        const data = await upstreamRes.json();
        return NextResponse.json(
          {
            ...data,
            status: "ok",
            engine: "interview-intelligence",
            engineOrigin: origin,
            reachable: true,
          },
          { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
        );
      }
    }

    return NextResponse.json(
      {
        status: "degraded",
        engine: "interview-intelligence",
        engineOrigin: origin,
        reachable: false,
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "degraded",
        engine: "interview-intelligence",
        engineOrigin: origin,
        reachable: false,
        warning: err?.message || "Health check failed",
        timestamp: new Date().toISOString(),
      },
      { status: 200, headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  }
}
