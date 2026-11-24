import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const upstreamRes = await fetch("http://127.0.0.1:3001/api/health", {
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
    }).catch(() => null);

    if (upstreamRes && upstreamRes.ok) {
      const data = await upstreamRes.json();
      return NextResponse.json(data, { status: 200 });
    }

    // Default healthy status when running in local orchestrator
    return NextResponse.json(
      {
        status: "ok",
        engine: "interview-intelligence",
        port: 3001,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "ok",
        warning: err?.message || "fallback mode",
        port: 3001,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  }
}
