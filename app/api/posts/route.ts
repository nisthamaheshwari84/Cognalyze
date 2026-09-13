import { NextRequest, NextResponse } from "next/server";
import { getAllUnifiedPosts, createCommunityPost, PostType } from "@/lib/posts-store";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const typeFilter = searchParams.get("type") || "all";
    const searchQuery = searchParams.get("search") || searchParams.get("q") || "";
    const candidateId = searchParams.get("candidateId") || "student-demo";
    
    // Check role from param or fallback to cookie
    const roleCookie = req.cookies.get("cognalyze_role")?.value;
    const role = (searchParams.get("role") || roleCookie || "student") as "student" | "recruiter" | "admin";
    
    const limitParam = searchParams.get("limit");
    const limit = limitParam ? parseInt(limitParam, 10) : undefined;

    const posts = await getAllUnifiedPosts({
      typeFilter,
      searchQuery,
      candidateId,
      role,
      limit
    });

    return NextResponse.json({
      success: true,
      count: posts.length,
      posts,
      role,
      active_filter: typeFilter
    });
  } catch (err: any) {
    console.error("[api/posts GET] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      type,
      title,
      content,
      author_name = "Community Member",
      author_role = "Engineer",
      author_avatar = "💬",
      company_or_org,
      tags = [],
      domain_tags = [],
      deadline,
      source_url,
      metadata = {}
    } = body;

    if (!type || !title || !content) {
      return NextResponse.json(
        { success: false, error: "Fields 'type', 'title', and 'content' are required." },
        { status: 400 }
      );
    }

    if (!["hiring", "opportunity", "professional", "collaboration"].includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid post type: ${type}. Must be hiring, opportunity, professional, or collaboration.` },
        { status: 400 }
      );
    }

    const created = await createCommunityPost({
      type: type as PostType,
      title,
      content,
      author_name,
      author_role,
      author_avatar,
      company_or_org,
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      domain_tags: Array.isArray(domain_tags) ? domain_tags : [domain_tags].filter(Boolean),
      deadline,
      source_url,
      metadata: {
        ...metadata,
        upvotes: 1,
        replies_count: 0
      }
    });

    return NextResponse.json({
      success: true,
      post: created
    }, { status: 201 });
  } catch (err: any) {
    console.error("[api/posts POST] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to create post" },
      { status: 500 }
    );
  }
}
