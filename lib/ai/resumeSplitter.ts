/**
 * RESUME SPLITTER — turns one bulk-uploaded PDF (up to 500 resumes,
 * variable page lengths) into a clean candidates[] array for bulkQueue.ts
 */

import fs from "fs";
const pdfParse = require("pdf-parse");

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
const PHONE_REGEX = /(\+?\d[\d\s-]{8,14}\d)/;

export async function extractPagesText(pdfBuffer: Buffer): Promise<string[]> {
  const pages: string[] = [];
  await pdfParse(pdfBuffer, {
    pagerender: async (pageData: any) => {
      const textContent = await pageData.getTextContent();
      const text = textContent.items.map((item: any) => item.str).join(" ");
      pages.push(text);
      return text;
    },
  });
  return pages;
}

export function looksLikeResumeStart(pageText: string): boolean {
  const firstChunk = pageText.slice(0, 600); // header area only
  const hasEmail = EMAIL_REGEX.test(firstChunk);
  const hasPhone = PHONE_REGEX.test(firstChunk);
  // A resume's first page almost always has contact info near the top.
  return hasEmail || hasPhone;
}

export function extractCandidateName(pageText: string): string {
  // Heuristic: first non-empty line that isn't an email/phone/url
  const lines = pageText.split("\n").map((l) => l.trim()).filter(Boolean);
  for (const line of lines.slice(0, 5)) {
    if (
      !EMAIL_REGEX.test(line) &&
      !PHONE_REGEX.test(line) &&
      !/https?:\/\//.test(line) &&
      line.length > 2 &&
      line.length < 60
    ) {
      return line;
    }
  }
  return "Unknown";
}

export interface SplitCandidate {
  id: string;
  name: string;
  resumeText: string;
}

/**
 * Splits raw page texts into resume chunks.
 * Returns: [{ id, name, resumeText }]
 */
export function splitIntoResumes(pageTexts: string[]): SplitCandidate[] {
  const resumes: { name: string; pages: string[] }[] = [];
  let currentChunk: string[] = [];
  let currentName: string | null = null;

  pageTexts.forEach((pageText, idx) => {
    const isStart = looksLikeResumeStart(pageText);

    if (isStart && currentChunk.length > 0) {
      // close out previous resume
      resumes.push({ name: currentName || "Unknown", pages: currentChunk });
      currentChunk = [];
    }

    if (isStart || currentChunk.length === 0) {
      currentName = extractCandidateName(pageText);
    }

    currentChunk.push(pageText);

    // last page — flush
    if (idx === pageTexts.length - 1) {
      resumes.push({ name: currentName || "Unknown", pages: currentChunk });
    }
  });

  return resumes.map((r, i) => ({
    id: `Candidate_${i + 1}`,
    name: r.name, // kept separately for UI display, never sent to scoring prompt
    resumeText: r.pages.join("\n\n"),
  }));
}

/**
 * TXT splitting — recruiters often paste/upload one combined .txt file
 * with multiple resumes separated by a delimiter, OR upload multiple
 * separate .txt files (one per candidate — no splitting needed there).
 */
export function splitTxtIntoResumes(rawText: string): SplitCandidate[] {
  const trimmed = rawText.trim();

  // 1. Check if rawText is valid JSON array of resumes
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((item, idx) => {
          if (typeof item === "string") {
            return {
              id: `Candidate_${idx + 1}`,
              name: extractCandidateName(item),
              resumeText: item.trim(),
            };
          }
          const text = item.resume || item.resumeText || item.text || JSON.stringify(item);
          return {
            id: item.id || `Candidate_${idx + 1}`,
            name: item.name || extractCandidateName(text),
            resumeText: text.trim(),
          };
        });
      }
    } catch {
      // Fallback to text splitting if JSON parse fails
    }
  }

  // 2. Delimiter patterns (explicit dividers or candidate markers)
  const DELIMITER_REGEX = /\n\s*(?:[-=*_]{3,}|(?:Candidate|Resume)\s*#?\d+[:\s\n]|---+|===+)\s*\n/i;

  let chunks = trimmed
    .split(DELIMITER_REGEX)
    .map(c => c.trim())
    .filter(c => c.length > 40 && !/^[-=*_]{3,}$/.test(c));

  // 3. If single chunk found, check for repeated candidate header patterns
  if (chunks.length <= 1) {
    const candidateBlockRegex = /(?:^|\n)(?=(?:Candidate\s*#?\d+|Resume\s*#?\d+|[A-Z][a-z]+ [A-Z][a-z]+\s*\|\s*[a-zA-Z0-9._%+-]+@))/i;
    const splitByHeader = trimmed.split(candidateBlockRegex).map(c => c.trim()).filter(c => c.length > 40);
    if (splitByHeader.length > 1) {
      chunks = splitByHeader;
    }
  }

  // 4. Fallback to header-detection heuristic applied to paragraph blocks
  if (chunks.length <= 1) {
    const blocks = trimmed.split(/\n{2,}/);
    chunks = [];
    let current: string[] = [];
    blocks.forEach((block, idx) => {
      if (looksLikeResumeStart(block) && current.length > 0) {
        chunks.push(current.join("\n\n"));
        current = [];
      }
      current.push(block);
      if (idx === blocks.length - 1 && current.length) {
        chunks.push(current.join("\n\n"));
      }
    });
  }

  // If still only 1 chunk or none, return single candidate if long enough
  if (chunks.length === 0 && trimmed.length > 30) {
    chunks = [trimmed];
  }

  return chunks
    .map((text) => text.trim())
    .filter((text) => text.length > 30)
    .map((text, i) => ({
      id: `Candidate_${i + 1}`,
      name: extractCandidateName(text),
      resumeText: text,
    }));
}

/**
 * Single .txt file = single candidate (no splitting needed)
 */
export function singleTxtAsCandidate(rawText: string, idHint = "Candidate_1"): SplitCandidate[] {
  return [
    {
      id: idHint,
      name: extractCandidateName(rawText),
      resumeText: rawText.trim(),
    },
  ];
}

/**
 * Main entry point: file path + type -> candidates[] ready for bulkQueue.js
 */
export async function buildCandidates(filePath: string, fileType = "pdf_bulk"): Promise<SplitCandidate[]> {
  let candidates: SplitCandidate[] = [];

  if (fileType === "pdf_bulk") {
    const buffer = fs.readFileSync(filePath);
    const pageTexts = await extractPagesText(buffer);
    if (pageTexts.length === 0) {
      throw new Error("Could not extract any text — PDF may be scanned/image-based. Run OCR first.");
    }
    candidates = splitIntoResumes(pageTexts);
  } else if (fileType === "txt_bulk") {
    const rawText = fs.readFileSync(filePath, "utf-8");
    candidates = splitTxtIntoResumes(rawText);
  } else if (fileType === "txt_single") {
    const rawText = fs.readFileSync(filePath, "utf-8");
    candidates = singleTxtAsCandidate(rawText);
  } else {
    throw new Error(`Unknown fileType: ${fileType}`);
  }

  if (candidates.length === 0) {
    throw new Error("No resumes detected — check file format/content.");
  }

  // Sanity guard: if "resumes" detected look way too short, splitting likely failed
  const tooShort = candidates.filter((c) => c.resumeText.length < 150);
  if (tooShort.length > candidates.length * 0.3) {
    console.warn(
      `Warning: ${tooShort.length}/${candidates.length} candidates have very short extracted text — verify split quality.`
    );
  }

  return candidates.map(({ id, name, resumeText }) => ({
    id,
    name, // for displaying in ranking UI only, never sent to scoring prompt
    resumeText,
  }));
}
