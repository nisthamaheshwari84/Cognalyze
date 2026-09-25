// app/api/roles/route.ts
//
// RULE ENFORCED HERE: any role created through this endpoint is automatically
// feed_type = 'collaboration'. There is no request field that lets a caller set
// feed_type to 'post' — this route only ever creates collaboration-feed roles,
// so an open role can never end up in the wrong feed by a UI bug or recruiter error.

import { NextRequest, NextResponse } from "next/server";
import { getCollabUser } from "@/lib/collab/auth";
import { createRole, getRolesByRecruiter } from "@/lib/collab/store";
import { CreateRoleInput } from "@/lib/collab/types";

export async function POST(req: NextRequest) {
  const user = await getCollabUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Confirm caller is a recruiter, not a student posting as themselves
  if (user.role !== "recruiter" && user.role !== "admin") {
    return NextResponse.json({ error: "Only recruiters can post roles" }, { status: 403 });
  }

  try {
    const body: CreateRoleInput = await req.json();

    if (!body.title?.trim() || !body.description?.trim()) {
      return NextResponse.json(
        { error: "title and description are required" },
        { status: 400 }
      );
    }

    const role = await createRole({
      recruiter_id: user.id,
      title: body.title.trim(),
      description: body.description.trim(),
      required_skills: Array.isArray(body.required_skills) ? body.required_skills : [],
      // feed_type is hardcoded to 'collaboration' inside createRole
    });

    return NextResponse.json({ role }, { status: 201 });
  } catch (err: any) {
    console.error("[roles POST] Error:", err);
    return NextResponse.json({ error: err.message || "Failed to create role" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const user = await getCollabUser(req);
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const roles = await getRolesByRecruiter(user.id);
    return NextResponse.json({ roles });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch roles" }, { status: 500 });
  }
}
