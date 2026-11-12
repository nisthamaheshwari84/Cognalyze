/**
 * app/api/recruitment/companies/route.ts
 * 
 * Universal Companies Registry API.
 * GET: Search and filter across 25+ enterprises and custom organizations.
 * POST: Dynamically register a new startup or company into the universal catalog.
 */

import { NextRequest, NextResponse } from "next/server";
import {
  searchCompanies,
  getAllUniversalCompanies,
  registerCustomCompany,
  CANONICAL_ROLE_FAMILIES,
  SUPPORTED_GEOGRAPHIES,
  HIRING_CHANNELS_LIST,
} from "@/lib/recruitment/universal-company-registry";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") || "";
    const tier = searchParams.get("tier");
    const role = searchParams.get("role");
    const channel = searchParams.get("channel");

    let companies = query ? searchCompanies(query) : getAllUniversalCompanies();

    if (tier) {
      companies = companies.filter((c) => c.tierCategory === tier);
    }
    if (role) {
      companies = companies.filter((c) => c.supportedRoleFamilies.includes(role as any));
    }
    if (channel) {
      companies = companies.filter((c) => c.supportedChannels.includes(channel as any));
    }

    return NextResponse.json({
      success: true,
      count: companies.length,
      companies,
      roleTaxonomy: CANONICAL_ROLE_FAMILIES,
      geographies: SUPPORTED_GEOGRAPHIES,
      hiringChannels: HIRING_CHANNELS_LIST,
    });
  } catch (err: any) {
    console.error("[GET /api/recruitment/companies] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to search companies." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, domain, overview, headquarters, tierCategory, officialCareersUrl, supportedRoles, supportedChannels, hiringGeographies } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Company name is required." },
        { status: 400 }
      );
    }

    const created = registerCustomCompany({
      name: name.trim(),
      domain,
      overview,
      headquarters,
      tierCategory,
      officialCareersUrl,
      supportedRoles,
      supportedChannels,
      hiringGeographies,
    });

    return NextResponse.json({
      success: true,
      company: created,
    }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/recruitment/companies] Error:", err);
    return NextResponse.json(
      { success: false, error: err.message || "Failed to register custom company." },
      { status: 500 }
    );
  }
}

