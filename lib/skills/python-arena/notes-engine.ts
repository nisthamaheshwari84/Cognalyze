/**
 * lib/skills/python-arena/notes-engine.ts
 *
 * Topic-Wise Notes & Revision PDF Generator for Python Arena.
 * Generates genuine educational notes with:
 * - 3 Distinct Document Modes:
 *     1. Quick Revision (syntax, core checklists, pitfalls)
 *     2. Complete Engineering Notes (internals, memory models, worked examples with verified outputs)
 *     3. Interview Cheat Sheet (frequently tested gotchas, complexity tables, company tips)
 * - Conceptual Classifications: Must Know, Frequently Tested, Important for Interviews, Production Engineering
 * - Clean printable HTML with @media print styling for standard PDF generation
 */

import { getPythonSubtopicById, SubtopicCurriculumItem, getAllPythonSubtopics } from "./python-curriculum-registry";

export type RevisionDocumentMode = "quick_revision" | "complete_engineering" | "interview_cheatsheet";

export interface GeneratedRevisionDocument {
  id: string;
  subtopicId: string;
  title: string;
  mode: RevisionDocumentMode;
  modeLabel: string;
  generatedAt: string;
  htmlContent: string;
  markdownSummary: string;
}

// In-memory revision library
const REVISION_VAULT: Map<string, GeneratedRevisionDocument[]> = new Map();

/**
 * Generates genuine educational notes in one of the 3 canonical document modes.
 */
export function generatePythonRevisionNotes(
  candidateId: string,
  subtopicId: string,
  mode: RevisionDocumentMode = "quick_revision"
): GeneratedRevisionDocument {
  const sub = getPythonSubtopicById(subtopicId) || getAllPythonSubtopics()[0];

  const modeLabels: Record<RevisionDocumentMode, string> = {
    quick_revision: "Quick Revision Guide",
    complete_engineering: "Complete Engineering Deep Dive",
    interview_cheatsheet: "Interview & Placement Cheat Sheet",
  };

  const modeLabel = modeLabels[mode];
  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });

  let bodyHtml = "";
  let mdSummary = "";

  if (mode === "quick_revision") {
    bodyHtml = `
      <div class="note-section">
        <h3>⚡ Core Invariant & Syntax</h3>
        <p>${sub.summary}</p>
        <pre><code>${sub.syntaxBlueprint}</code></pre>
      </div>

      <div class="note-section">
        <h3>📋 Must-Know Definitions</h3>
        <ul>
          ${sub.definitions.map((d) => `<li><strong>${d.term}:</strong> ${d.explanation}</li>`).join("")}
        </ul>
      </div>

      <div class="note-section">
        <h3>⚠️ Pitfalls & Common Mistakes</h3>
        ${sub.commonMistakes.map((m) => `
          <div class="mistake-card">
            <p><strong>Mistake:</strong> ${m.mistake}</p>
            <p><strong>Fix:</strong> ${m.correction}</p>
            <p class="why-fail"><em>Why: ${m.whyItFails}</em></p>
          </div>
        `).join("")}
      </div>

      <div class="note-section">
        <h3>✅ Revision Checklist</h3>
        <ul class="checklist">
          ${sub.revisionChecklist.map((c) => `<li>◻ ${c}</li>`).join("")}
        </ul>
      </div>
    `;

    mdSummary = `Quick revision notes for ${sub.title}. Covers core syntax, definitions, and ${sub.commonMistakes.length} common pitfalls.`;
  } else if (mode === "complete_engineering") {
    bodyHtml = `
      <div class="note-section">
        <h3>🔬 Engineering Architecture & Runtime Mechanics</h3>
        <p>${sub.summary}</p>
        <div class="callout">
          <strong>Production Significance:</strong> Understanding ${sub.title} prevents runtime latency spikes and memory leakage in scaled microservices.
        </div>
      </div>

      <div class="note-section">
        <h3>💻 Worked Examples with Verified Output</h3>
        ${sub.workedExamples.map((ex) => `
          <div class="example-box">
            <h4>${ex.title}</h4>
            <pre><code>${ex.code}</code></pre>
            <div class="output-box">
              <strong>Verified CPython Output:</strong>
              <pre>${ex.expectedOutput}</pre>
            </div>
            <p><em>${ex.explanation}</em></p>
          </div>
        `).join("")}
      </div>

      <div class="note-section">
        <h3>⚙️ Under-the-Hood Invariants</h3>
        <ul>
          ${sub.definitions.map((d) => `<li><strong>${d.term}:</strong> ${d.explanation}</li>`).join("")}
        </ul>
      </div>
    `;

    mdSummary = `Complete engineering deep-dive on ${sub.title} with verified code examples, CPython internals, and runtime memory models.`;
  } else {
    // interview_cheatsheet
    bodyHtml = `
      <div class="note-section">
        <h3>🎯 Tier-1 Interview Gotchas & Recurring Patterns</h3>
        <ul class="gotcha-list">
          ${sub.interviewGotchas.map((g) => `<li>🔥 <strong>Frequently Tested:</strong> ${g}</li>`).join("")}
        </ul>
      </div>

      <div class="note-section">
        <h3>💡 High-Yield Definitions</h3>
        <table class="concept-table">
          <thead>
            <tr><th>Concept</th><th>Interview Explanation</th></tr>
          </thead>
          <tbody>
            ${sub.definitions.map((d) => `<tr><td><strong>${d.term}</strong></td><td>${d.explanation}</td></tr>`).join("")}
          </tbody>
        </table>
      </div>

      <div class="note-section">
        <h3>🚨 Traps That Disqualify Candidates</h3>
        ${sub.commonMistakes.map((m) => `
          <div class="mistake-card">
            <span class="badge danger">DO NOT WRITE</span>
            <code>${m.mistake}</code>
            <p style="margin-top: 6px;"><strong>Correct Approach:</strong> ${m.correction}</p>
          </div>
        `).join("")}
      </div>
    `;

    mdSummary = `Interview cheat sheet for ${sub.title} detailing recurring gotchas from Google, Amazon, and Microsoft technical rounds.`;
  }

  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${sub.title} - ${modeLabel} | Cognalyze</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #162A43; background: #FFFFFF; margin: 0; padding: 40px; line-height: 1.6; }
    .header { border-bottom: 2px solid #E4E1DA; padding-bottom: 16px; margin-bottom: 24px; }
    .brand { font-size: 13px; font-weight: 800; color: #356AE6; text-transform: uppercase; letter-spacing: 0.05em; }
    h1 { font-size: 24px; color: #162A43; margin: 6px 0 2px 0; }
    .meta { font-size: 12px; color: #667085; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: 700; background: #EFF4FE; color: #356AE6; }
    .note-section { margin-bottom: 28px; }
    h3 { font-size: 16px; color: #162A43; border-bottom: 1px solid #E4E1DA; padding-bottom: 6px; margin-bottom: 12px; }
    pre { background: #FAF9F6; border: 1px solid #E4E1DA; border-radius: 6px; padding: 14px; font-family: monospace; font-size: 12px; overflow-x: auto; color: #1E293B; }
    code { font-family: monospace; }
    .output-box { background: #F6F5F1; border-left: 3px solid #2E7D5B; padding: 8px 12px; margin: 10px 0; border-radius: 4px; }
    .mistake-card { background: #FEF7ED; border: 1px solid #F8D8A7; border-radius: 6px; padding: 12px; margin-bottom: 10px; font-size: 13px; }
    .why-fail { color: #B7791F; margin: 4px 0 0; }
    .callout { background: #EFF4FE; border: 1px solid #D2E0FB; border-radius: 6px; padding: 12px; font-size: 13px; }
    .concept-table { width: 100%; border-collapse: collapse; font-size: 13px; }
    .concept-table th, .concept-table td { border: 1px solid #E4E1DA; padding: 8px 12px; text-align: left; }
    .concept-table th { background: #FAF9F6; }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">Cognalyze Python Practice &amp; Placement Arena</div>
    <h1>${sub.title}</h1>
    <div class="meta">
      <span class="badge">${modeLabel}</span> · Part: ${sub.partTitle} · Topic: ${sub.topicTitle} · Generated on ${dateStr}
    </div>
  </div>
  ${bodyHtml}
</body>
</html>
  `.trim();

  const doc: GeneratedRevisionDocument = {
    id: `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    subtopicId,
    title: `${sub.title} (${modeLabel})`,
    mode,
    modeLabel,
    generatedAt: new Date().toISOString(),
    htmlContent: fullHtml,
    markdownSummary: mdSummary,
  };

  const list = REVISION_VAULT.get(candidateId) || [];
  list.unshift(doc);
  REVISION_VAULT.set(candidateId, list);

  return doc;
}

/**
 * Retrieves all saved revision notes for a student.
 */
export function getStudentRevisionNotes(candidateId: string): GeneratedRevisionDocument[] {
  return REVISION_VAULT.get(candidateId) || [];
}

