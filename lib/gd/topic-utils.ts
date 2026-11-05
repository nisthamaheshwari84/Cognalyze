/**
 * Group Discussion Topic Utilities
 */

// Deterministic token-based similarity check to reject exact & near-duplicates
export function isDuplicateOrSimilar(newTitle: string, existingTitles: string[]): boolean {
  const normalize = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim().split(/\s+/).filter(w => w.length > 2);

  const newWords = new Set(normalize(newTitle));
  if (newWords.size === 0) return true;

  for (const existing of existingTitles) {
    if (newTitle.trim().toLowerCase() === existing.trim().toLowerCase()) {
      return true;
    }
    const existWords = new Set(normalize(existing));
    let intersection = 0;
    for (const w of newWords) {
      if (existWords.has(w)) intersection++;
    }
    const union = new Set([...newWords, ...existWords]).size;
    const similarity = union > 0 ? intersection / union : 0;
    if (similarity > 0.55) {
      return true;
    }
  }
  return false;
}

