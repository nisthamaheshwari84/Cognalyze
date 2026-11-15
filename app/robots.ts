import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://cognalyze.com";
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/o/", "/about", "/pricing"],
        disallow: [
          "/api/",
          "/student/",
          "/admin/",
          "/recruiter/",
          "/interview/",
          "/login",
          "/signup",
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
