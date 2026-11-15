import type { MetadataRoute } from "next";
import { opportunityService } from "@/lib/opportunities/opportunity-service";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cognalyze.com";
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteUrl}`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/student/opportunities`,
      lastModified: new Date(),
      changeFrequency: "hourly",
      priority: 0.9,
    },
  ];

  try {
    const opps = await opportunityService.ensureIngested();
    const publicOpps = opps.slice(0, 500).map((opp) => {
      const slug = (opp.id || opp.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
      return {
        url: `${siteUrl}/o/${slug}`,
        lastModified: opp.updatedAt ? new Date(opp.updatedAt) : new Date(),
        changeFrequency: "weekly" as const,
        priority: 0.8,
      };
    });

    return [...staticRoutes, ...publicOpps];
  } catch (err) {
    console.warn("[sitemap] Dynamic sitemap generation error:", err);
    return staticRoutes;
  }
}
