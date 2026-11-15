import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { opportunityService } from "@/lib/opportunities/opportunity-service";
import { ShieldCheck, Calendar, MapPin, Briefcase, Award, ArrowRight, ExternalLink } from "lucide-react";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const opps = await opportunityService.ensureIngested();
  const opp = opps.find((o) => {
    const s = (o.id || o.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return s === slug || o.id === slug || o.normalizedTitle === slug.toLowerCase();
  });

  if (!opp) {
    return {
      title: "Opportunity Not Found — Cognalyze",
      description: "This opportunity listing could not be found or has expired.",
    };
  }

  const title = `${opp.title} at ${opp.companyName || opp.organizer} — Opportunity Radar`;
  const description = opp.description?.slice(0, 160) || `Explore ${opp.title} opportunity on Cognalyze with evidence-backed Student DNA matching.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function PublicOpportunityPage({ params }: PageProps) {
  const { slug } = await params;
  const opps = await opportunityService.ensureIngested();
  const opp = opps.find((o) => {
    const s = (o.id || o.title).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    return s === slug || o.id === slug || o.normalizedTitle === slug.toLowerCase();
  });

  if (!opp) {
    notFound();
  }

  const isLiveConnector =
    opp.sourceUrl?.includes("remotive") ||
    opp.sourceUrl?.includes("codeforces") ||
    opp.sourceUrl?.includes("github.com") ||
    opp.sourceUrl?.includes("arbeitnow") ||
    opp.verificationStatus === "VERIFIED";

  const provenanceBadge = isLiveConnector ? "Verified Live Posting" : "Curated Benchmark";

  // Google Search JSON-LD Structured Data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: opp.title,
    description: opp.description || opp.title,
    datePosted: opp.postedAt || new Date().toISOString(),
    validThrough: opp.deadline || undefined,
    employmentType: opp.employmentType === "internship" ? "INTERN" : "FULL_TIME",
    hiringOrganization: {
      "@type": "Organization",
      name: opp.companyName || opp.organizer || "Organization",
      sameAs: opp.sourceUrl,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: opp.city || opp.location || "Online",
        addressCountry: opp.country || "India",
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: opp.country || "Global",
    },
    jobLocationType: opp.remoteType === "remote" ? "TELECOMMUTE" : undefined,
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      {/* Structured Data Script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="max-w-4xl mx-auto space-y-8">
        {/* Navigation Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-slate-400">
          <Link href="/student/opportunities" className="hover:text-cyan-400 transition">
            Opportunity Radar
          </Link>
          <span>/</span>
          <span className="capitalize">{opp.opportunityType?.toLowerCase()}</span>
          <span>/</span>
          <span className="text-slate-300 truncate max-w-xs">{opp.title}</span>
        </div>

        {/* Header Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  isLiveConnector
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-cyan-500/10 text-cyan-400 border-cyan-500/30"
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                {provenanceBadge}
              </span>
              <span className="bg-slate-800 text-slate-300 px-3 py-1 rounded-full text-xs font-medium uppercase tracking-wider">
                {opp.opportunityType}
              </span>
            </div>

            <div className="text-xs text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>Deadline: {opp.deadline ? new Date(opp.deadline).toLocaleDateString() : "Rolling"}</span>
            </div>
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">{opp.title}</h1>
            <p className="text-lg text-cyan-400 font-medium mt-1">{opp.companyName || opp.organizer}</p>
          </div>

          {/* Key Meta Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" /> Location
              </div>
              <div className="font-semibold text-slate-200 mt-1 text-sm truncate">{opp.location || "Online"}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-slate-400" /> Work Mode
              </div>
              <div className="font-semibold text-slate-200 mt-1 text-sm capitalize">{opp.remoteType}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-xs text-slate-400 flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-slate-400" /> Experience
              </div>
              <div className="font-semibold text-slate-200 mt-1 text-sm capitalize">{opp.experienceLevel.replace("_", " ")}</div>
            </div>

            <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3">
              <div className="text-xs text-slate-400">Source Platform</div>
              <div className="font-semibold text-slate-200 mt-1 text-sm truncate">{opp.source}</div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-slate-800">
            {opp.applicationUrl && (
              <a
                href={opp.applicationUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-cyan-500/20"
              >
                Apply via Official Portal <ExternalLink className="w-4 h-4" />
              </a>
            )}

            <Link
              href={`/student/opportunities/${opp.id}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-sm transition"
            >
              Analyze My Student DNA Match <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href={`/interview?mode=technical&oppId=${opp.id}&title=${encodeURIComponent(opp.title)}`}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition shadow-lg shadow-indigo-600/20"
            >
              Simulate Technical Interview 🎙️
            </Link>
          </div>
        </div>

        {/* Requirements & Description */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-white">Required Capabilities</h2>
            <p className="text-xs text-slate-400 mt-0.5">Skills verified against evidence in your Student DNA.</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {(opp.requiredSkills || []).map((sk, idx) => (
                <span
                  key={idx}
                  className="bg-slate-800 text-slate-200 px-3 py-1 rounded-lg text-xs font-medium border border-slate-700"
                >
                  {sk}
                </span>
              ))}
            </div>
          </div>

          {opp.description && (
            <div className="border-t border-slate-800 pt-6">
              <h2 className="text-lg font-bold text-white mb-3">Role Intelligence & Overview</h2>
              <div className="text-sm text-slate-300 leading-relaxed whitespace-pre-line space-y-4">
                {opp.description}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
