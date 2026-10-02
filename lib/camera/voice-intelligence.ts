/**
 * COGNALYZE — VOICE & ANSWER DELIVERY INTELLIGENCE
 * 
 * Evaluates observable speech pacing, filler words, speaking duration,
 * and delivery structure.
 * 
 * Rules:
 * - NO psychological inferences (never say "you were anxious").
 * - Actionable metrics (WPM, filler word count, duration).
 */

import { VoiceMetrics } from "./types";

const COMMON_FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "basically",
  "actually",
  "sort of",
  "kind of",
  "literally",
  "honestly",
  "so yeah",
  "i mean",
];

export function analyzeVoiceDelivery(
  transcript: string,
  speakingDurationSec: number,
  volumeSamples: number[] = []
): VoiceMetrics {
  const clean = (transcript || "").trim().toLowerCase();
  if (!clean || speakingDurationSec <= 0) {
    return {
      speakingDurationSec: Math.max(0, speakingDurationSec),
      wordCount: 0,
      wordsPerMinute: 0,
      fillerWordsFound: [],
      fillerWordCount: 0,
      longPausesCount: 0,
      averageVolume: 0,
      clarityAssessment: "No vocal response captured.",
    };
  }

  const words = clean.split(/\s+/).filter(Boolean);
  const wordCount = words.length;

  const minutes = Math.max(0.1, speakingDurationSec / 60);
  const wordsPerMinute = Math.round(wordCount / minutes);

  // Identify filler words
  const foundFillers: string[] = [];
  let fillerCount = 0;

  for (const filler of COMMON_FILLER_WORDS) {
    if (filler.includes(" ")) {
      // Multi-word filler (e.g. "you know")
      const regex = new RegExp(`\\b${filler}\\b`, "gi");
      const matches = clean.match(regex);
      if (matches) {
        fillerCount += matches.length;
        foundFillers.push(`${filler} (${matches.length}x)`);
      }
    } else {
      // Single-word filler
      const count = words.filter((w) => w.replace(/[^\w]/g, "") === filler).length;
      if (count > 0) {
        fillerCount += count;
        foundFillers.push(`${filler} (${count}x)`);
      }
    }
  }

  // Volume metrics
  let averageVolume = 0;
  let longPausesCount = 0;
  if (volumeSamples.length > 0) {
    const sum = volumeSamples.reduce((a, b) => a + b, 0);
    averageVolume = Math.round(sum / volumeSamples.length);

    // Count long pauses (consecutive silence windows)
    let silentStreak = 0;
    for (const v of volumeSamples) {
      if (v < 8) {
        silentStreak++;
        if (silentStreak === 6) {
          // ~3 seconds of silence at 2Hz sampling
          longPausesCount++;
        }
      } else {
        silentStreak = 0;
      }
    }
  }

  // Practical clarity assessment
  let clarityAssessment = "";
  if (wordsPerMinute > 175) {
    clarityAssessment = `Speaking rate was fast (${wordsPerMinute} WPM, target: 130–160 WPM). Pacing your technical explanation allows complex architecture points to register clearly.`;
  } else if (wordsPerMinute < 100 && wordCount > 15) {
    clarityAssessment = `Pacing was measured (${wordsPerMinute} WPM). Increasing cadence slightly maintains engaging interviewer rapport.`;
  } else {
    clarityAssessment = `Well-calibrated delivery pace (${wordsPerMinute} WPM). Natural rhythm with comfortable technical cadence.`;
  }

  if (fillerCount >= 4) {
    clarityAssessment += ` Used ${fillerCount} filler words (${foundFillers.slice(0, 3).join(", ")}). Replacing filler words with a brief 1-second pause projects clarity.`;
  }

  if (speakingDurationSec > 150) {
    clarityAssessment += ` Answer duration (${Math.round(speakingDurationSec)}s) exceeded recommended 60–90 second target. Focus on an immediate executive summary followed by 2 supporting technical pillars.`;
  }

  return {
    speakingDurationSec: Math.round(speakingDurationSec),
    wordCount,
    wordsPerMinute,
    fillerWordsFound: foundFillers,
    fillerWordCount: fillerCount,
    longPausesCount,
    averageVolume,
    clarityAssessment,
  };
}
