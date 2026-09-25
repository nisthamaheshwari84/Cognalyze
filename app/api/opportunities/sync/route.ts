import { NextResponse } from "next/server";
import {
  syncAggregatedHackathons,
  getLastHackathonSyncTimestamp,
  getAllOpportunities
} from "@/lib/placement-store";

export async function GET() {
  try {
    const all = await getAllOpportunities();
    const lastSyncedAt = getLastHackathonSyncTimestamp();

    const counts = {
      total: all.length,
      unstop: all.filter(o => o.extracted_context?.platform === "Unstop" || o.source_url?.includes("unstop")).length,
      hack2skill: all.filter(o => o.extracted_context?.platform === "Hack2Skill" || o.source_url?.includes("hack2skill")).length,
      devnovate: all.filter(o => o.extracted_context?.platform === "Devnovate" || o.source_url?.includes("devnovate")).length,
      devpost: all.filter(o => o.extracted_context?.platform === "Devpost" || o.source_url?.includes("devpost")).length,
      past: all.filter(o => o.extracted_context?.is_past === true || o.extracted_context?.status === "ended" || !o.is_active).length,
      active: all.filter(o => (o.extracted_context?.is_past !== true && o.extracted_context?.status !== "ended") && o.is_active !== false).length
    };

    return NextResponse.json({
      success: true,
      last_synced_at: lastSyncedAt,
      counts
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const res = await syncAggregatedHackathons();
    return NextResponse.json({
      success: true,
      message: `Successfully synchronized ${res.count} hackathons across Unstop, Hack2Skill, Devnovate, and Devpost.`,
      count: res.count,
      last_synced_at: res.synced_at
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
