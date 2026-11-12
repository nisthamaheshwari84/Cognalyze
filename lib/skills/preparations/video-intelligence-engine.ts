/**
 * COGNALYZE VIDEO LEARNING INTELLIGENCE ENGINE
 *
 * Inspects YouTube video resources legitimately using oEmbed availability checks
 * and public timedtext caption retrieval where available.
 *
 * STRICT INVARIANTS:
 * - NEVER fabricate transcripts, timestamps, or quotations.
 * - If captions are inaccessible or offline, explicitly report transcriptStatus: "unavailable" | "not_analyzed".
 * - Cache analyzed results safely to avoid repeated network fetches.
 */

import fs from "fs";
import path from "path";
import { RealExperienceResource, VideoTimestampSegment } from "./types";

const VIDEO_CACHE_PATH = path.join(process.cwd(), "data", "video-intelligence-cache.json");

export interface VideoInspectionResult {
  videoId: string | null;
  url: string;
  isAccessible: boolean;
  verifiedTitle?: string;
  verifiedAuthor?: string;
  transcriptStatus: "verified_captions" | "unavailable" | "not_analyzed";
  extractedTranscriptSnippet?: string;
  timestamps: VideoTimestampSegment[];
  checkedAt: string;
  diagnosticNote: string;
}

export function extractYouTubeVideoId(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) {
      return u.pathname.replace(/^\//, "").split("/")[0] || null;
    }
    if (u.hostname.includes("youtube.com")) {
      return u.searchParams.get("v");
    }
  } catch {}
  return null;
}

function loadVideoCache(): Record<string, VideoInspectionResult> {
  try {
    if (fs.existsSync(VIDEO_CACHE_PATH)) {
      return JSON.parse(fs.readFileSync(VIDEO_CACHE_PATH, "utf-8"));
    }
  } catch {}
  return {};
}

function saveVideoCache(cache: Record<string, VideoInspectionResult>): void {
  try {
    const dir = path.dirname(VIDEO_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(VIDEO_CACHE_PATH, JSON.stringify(cache, null, 2), "utf-8");
  } catch {}
}

function formatSeconds(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export class VideoIntelligenceEngine {
  private static instance: VideoIntelligenceEngine;

  private constructor() {}

  public static getInstance(): VideoIntelligenceEngine {
    if (!VideoIntelligenceEngine.instance) {
      VideoIntelligenceEngine.instance = new VideoIntelligenceEngine();
    }
    return VideoIntelligenceEngine.instance;
  }

  /**
   * Verifies accessibility via YouTube oEmbed and inspects captions if available.
   */
  public async inspectVideoResource(
    url: string,
    options: { allowNetwork?: boolean } = {}
  ): Promise<VideoInspectionResult> {
    const allowNetwork = options.allowNetwork ?? true;
    const videoId = extractYouTubeVideoId(url);
    const checkedAt = new Date().toISOString();

    if (!videoId) {
      return {
        videoId: null,
        url,
        isAccessible: false,
        transcriptStatus: "unavailable",
        timestamps: [],
        checkedAt,
        diagnosticNote: "Invalid YouTube URL; cannot extract video ID.",
      };
    }

    const cache = loadVideoCache();
    const cached = cache[videoId];
    if (cached && Date.now() - new Date(cached.checkedAt).getTime() < 1000 * 60 * 60 * 24 * 7) {
      return cached;
    }

    if (!allowNetwork) {
      return {
        videoId,
        url,
        isAccessible: false,
        transcriptStatus: "not_analyzed",
        timestamps: [],
        checkedAt,
        diagnosticNote: "Transcript not analyzed offline; open original video directly to watch.",
      };
    }

    let isAccessible = false;
    let verifiedTitle: string | undefined;
    let verifiedAuthor: string | undefined;
    let transcriptStatus: VideoInspectionResult["transcriptStatus"] = "unavailable";
    let extractedSnippet: string | undefined;
    const timestamps: VideoTimestampSegment[] = [];
    let diagnosticNote = "Video availability checked.";

    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 3500);
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(`https://www.youtube.com/watch?v=${videoId}`)}&format=json`,
        { signal: controller.signal }
      );
      clearTimeout(timer);

      if (oembedRes.ok) {
        isAccessible = true;
        const meta = await oembedRes.json();
        verifiedTitle = meta.title;
        verifiedAuthor = meta.author_name;
      } else {
        diagnosticNote = `YouTube oEmbed returned status ${oembedRes.status}; video may be private or unavailable.`;
      }
    } catch {
      return {
        videoId,
        url,
        isAccessible: false,
        transcriptStatus: "not_analyzed",
        timestamps: [],
        checkedAt,
        diagnosticNote: "Network sandbox blocked YouTube oEmbed check; transcript has not been analyzed.",
      };
    }

    // Attempt public timedtext XML caption retrieval if accessible
    if (isAccessible) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 3500);
        const capRes = await fetch(
          `https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`,
          { signal: controller.signal }
        );
        clearTimeout(timer);

        if (capRes.ok) {
          const xml = await capRes.text();
          if (xml && xml.includes("<text ")) {
            const matches = Array.from(xml.matchAll(/<text start="([^"]+)"[^>]*>([\s\S]*?)<\/text>/g));
            if (matches.length > 0) {
              transcriptStatus = "verified_captions";
              const decodedLines = matches.map(m => ({
                start: Math.floor(parseFloat(m[1]) || 0),
                text: m[2]
                  .replace(/&amp;/g, "&")
                  .replace(/&#39;/g, "'")
                  .replace(/&quot;/g, '"')
                  .replace(/<[^>]+>/g, "")
                  .trim(),
              }));

              extractedSnippet = decodedLines.slice(0, 8).map(l => l.text).join(" ");

              // Extract meaningful checkpoints every ~180s or keyword hit
              const keywords = ["branch", "commit", "pull request", "fork", "merge", "test", "issue", "proposal"];
              let lastAddedSec = -120;
              for (const line of decodedLines) {
                if (line.start - lastAddedSec >= 180 || keywords.some(k => line.text.toLowerCase().includes(k) && line.start - lastAddedSec >= 60)) {
                  lastAddedSec = line.start;
                  timestamps.push({
                    seconds: line.start,
                    formattedTime: formatSeconds(line.start),
                    topic: line.text.slice(0, 60),
                    preparationStage: "Technical Walkthrough",
                    summary: line.text,
                    watchAtTimestampUrl: `https://www.youtube.com/watch?v=${videoId}&t=${line.start}s`,
                  });
                  if (timestamps.length >= 6) break;
                }
              }
              diagnosticNote = `Verified accessibility and extracted ${timestamps.length} caption-grounded timestamp markers.`;
            }
          }
        }
      } catch {
        // Leave transcriptStatus as unavailable honestly
      }

      if (transcriptStatus !== "verified_captions") {
        diagnosticNote = "Video is accessible on YouTube, but public timedtext captions were unavailable via automated request (marked transcript unavailable without fabrication).";
      }
    }

    const result: VideoInspectionResult = {
      videoId,
      url,
      isAccessible,
      verifiedTitle,
      verifiedAuthor,
      transcriptStatus,
      extractedTranscriptSnippet: extractedSnippet,
      timestamps,
      checkedAt,
      diagnosticNote,
    };

    cache[videoId] = result;
    saveVideoCache(cache);
    return result;
  }

  /**
   * Enriches video entries in a resource array with cached or live caption inspection results.
   */
  public async enrichVideoResources(
    resources: RealExperienceResource[],
    options: { allowNetwork?: boolean } = {}
  ): Promise<RealExperienceResource[]> {
    const out: RealExperienceResource[] = [];
    for (const r of resources) {
      if (r.resourceType !== "youtube_video") {
        out.push(r);
        continue;
      }
      const inspection = await this.inspectVideoResource(r.url, options);
      out.push({
        ...r,
        verificationStatus: inspection.isAccessible ? "verified_accessible" : r.verificationStatus,
        transcriptStatus: inspection.transcriptStatus,
        extractedTranscriptSnippet: inspection.extractedTranscriptSnippet,
        videoTimestamps: inspection.timestamps.length > 0 ? inspection.timestamps : undefined,
        lastVerifiedDate: inspection.checkedAt.split("T")[0],
      });
    }
    return out;
  }
}

export const videoIntelligenceEngine = VideoIntelligenceEngine.getInstance();

