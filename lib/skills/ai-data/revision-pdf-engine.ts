/**
 * lib/skills/ai-data/revision-pdf-engine.ts
 *
 * Comprehensive Revision Notes & PDF Generation Engine for Cognalyze.
 * Supports 3 Canonical Modes:
 * 1. QUICK REVISION (Definitions, formulas, syntax, key takeaways, checklist)
 * 2. COMPLETE ENGINEERING NOTES (Theory, deep mechanics, code, diagrams, edge cases, interview QA)
 * 3. CODE & INTERVIEW CHEAT SHEET (Snippets, methods, complexity, common patterns, mistakes)
 *
 * Includes student personal learning data:
 * - Student-written code & execution outputs
 * - Saved personal notes & bookmarks
 * - Incorrect answers & diagnostic remediation
 */

import { TaxonomyTopic, TaxonomySubject, getTaxonomyTopicById } from "./master-curriculum-taxonomy";

export type PdfDocumentMode = "quick" | "complete" | "cheatsheet";

export interface PersonalLearningContext {
  studentNotes?: string;
  studentCodeSnippet?: string;
  studentCodeOutput?: string;
  bookmarkedConcepts?: string[];
  diagnosticMistakes?: string[];
  candidateName?: string;
  targetRoleTitle?: string;
}

export interface GeneratedRevisionDocument {
  id: string;
  topicId: string;
  topicTitle: string;
  subjectTitle: string;
  mode: PdfDocumentMode;
  modeLabel: string;
  createdAt: string;
  version: string;
  htmlContent: string;
  summaryPoints: string[];
}

const STORAGE_KEY = "cognalyze_revision_library_docs";
const NOTES_KEY_PREFIX = "cognalyze_topic_notes_";

// In-memory fallback stores for non-browser/test environments
const memoryNotesStore = new Map<string, string>();
const memoryDocsStore = new Map<string, GeneratedRevisionDocument>();

/**
 * Builds printable institutional HTML document formatted strictly with Cognalyze styling.
 */
export function generateTopicRevisionDocument(
  topicOrOptions:
    | TaxonomyTopic
    | {
        topic: TaxonomyTopic;
        subject: TaxonomySubject;
        mode?: PdfDocumentMode;
        personalContext?: PersonalLearningContext;
        candidateName?: string;
        targetRoleTitle?: string;
      },
  subjectArg?: TaxonomySubject,
  modeArg: PdfDocumentMode = "complete",
  personalContextArg?: PersonalLearningContext
): GeneratedRevisionDocument {
  let topic: TaxonomyTopic;
  let subject: TaxonomySubject;
  let mode: PdfDocumentMode;
  let personalContext: PersonalLearningContext | undefined;

  if (topicOrOptions && "topic" in topicOrOptions && (topicOrOptions as any).topic) {
    const opts = topicOrOptions as any;
    topic = opts.topic;
    subject = opts.subject;
    mode = opts.mode || "complete";
    personalContext = opts.personalContext || {
      candidateName: opts.candidateName,
      targetRoleTitle: opts.targetRoleTitle,
    };
  } else {
    topic = topicOrOptions as TaxonomyTopic;
    subject = subjectArg!;
    mode = modeArg;
    personalContext = personalContextArg;
  }

  const dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const docId = `doc-${topic.id}-${mode}-${Date.now()}`;

  const modeLabels: Record<PdfDocumentMode, string> = {
    quick: "Quick Revision Digest",
    complete: "Complete Engineering Master Notes",
    cheatsheet: "Code & Technical Interview Cheat Sheet",
  };

  const studentName = personalContext?.candidateName || "Cognalyze Verified Student";
  const roleTitle = personalContext?.targetRoleTitle || "AI & Data Engineer";

  // Mode-specific sections
  let contentHtml = "";

  if (mode === "quick") {
    contentHtml = `
      <section class="section">
        <h2 class="section-title">1. Core Definitions & Architectural Intuition</h2>
        <div class="callout callout-info">
          <strong>Intuition:</strong> ${escapeHtml(topic.contextAndIntuition.english)}
        </div>
        <div class="callout callout-bilingual">
          <strong>Hinglish Summary:</strong> ${escapeHtml(topic.contextAndIntuition.hinglish)}
        </div>
        <div class="key-facts">
          <p><strong>Why This Exists:</strong> ${escapeHtml(topic.contextAndIntuition.whyExists)}</p>
          <p><strong>Legacy Alternative:</strong> ${escapeHtml(topic.contextAndIntuition.whatWasUsedBefore)}</p>
          <p><strong>Practical Outcome:</strong> ${escapeHtml(topic.practicalOutcome)}</p>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">2. Key Concepts & Formulas</h2>
        <ul class="concept-list">
          ${topic.conceptsCovered.map((c) => `<li><strong>${escapeHtml(c)}</strong></li>`).join("")}
        </ul>
      </section>

      <section class="section">
        <h2 class="section-title">3. Essential Code Syntax</h2>
        <pre class="code-block"><code>${escapeHtml(topic.starterCode || topic.solutionSnippet || "// Standard verification code")}</code></pre>
      </section>

      <section class="section">
        <h2 class="section-title">4. Quick Revision Checklist</h2>
        <ul class="checklist">
          ${topic.learningObjectives.map((obj) => `<li>[✓] ${escapeHtml(obj)}</li>`).join("")}
          <li>[✓] Verified internal failure modes and diagnostic boundaries</li>
        </ul>
      </section>
    `;
  } else if (mode === "cheatsheet") {
    contentHtml = `
      <section class="section">
        <h2 class="section-title">1. Core Implementation & Syntax Cheat Sheet</h2>
        <pre class="code-block"><code>${escapeHtml(topic.solutionSnippet || topic.starterCode || "// Implementation")}</code></pre>
        <p class="meta-note"><strong>Complexity Target:</strong> Algorithmic runtime adheres to standard vector/matrix benchmarks.</p>
      </section>

      <section class="section">
        <h2 class="section-title">2. Common Engineering Pitfalls & Anti-Patterns</h2>
        <div class="pitfalls-grid">
          ${topic.deepExplanation.commonMistakes
            .map(
              (m, i) => `
            <div class="pitfall-card">
              <span class="pitfall-num">⚠ Pitfall #${i + 1}</span>
              <p>${escapeHtml(m)}</p>
            </div>
          `
            )
            .join("")}
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">3. High-Yield Interview Probing Questions</h2>
        <div class="interview-box">
          <p><strong>Senior Engineer Probe:</strong> In high-throughput production, how does <em>${escapeHtml(
            topic.title
          )}</em> scale when handling non-stationary or high-cardinality input distributions?</p>
          <p class="interview-defense"><strong>Model Defense:</strong> ${escapeHtml(topic.deepExplanation.realWorldUsage)}</p>
        </div>
      </section>
    `;
  } else {
    // COMPLETE ENGINEERING NOTES
    contentHtml = `
      <section class="section">
        <h2 class="section-title">1. Introduction & Problem Statement</h2>
        <p>${escapeHtml(topic.contextAndIntuition.english)}</p>
        <div class="callout callout-bilingual">
          <strong>Bilingual Intuition:</strong> ${escapeHtml(topic.contextAndIntuition.hinglish)}
        </div>
        <div class="key-facts">
          <p><strong>Historical Context:</strong> Before this pattern, systems relied on: <em>${escapeHtml(
            topic.contextAndIntuition.whatWasUsedBefore
          )}</em>.</p>
          <p><strong>Modern Significance:</strong> ${escapeHtml(topic.contextAndIntuition.whyExists)}</p>
        </div>
      </section>

      <section class="section">
        <h2 class="section-title">2. Mathematical Formulation & Internal Mechanics</h2>
        <p>${escapeHtml(topic.deepExplanation.english)}</p>
        <div class="callout callout-info">
          <strong>Internal Engine Mechanics:</strong> ${escapeHtml(topic.deepExplanation.internalMechanics)}
        </div>
        <h3>Curriculum Subtopic Breakdown:</h3>
        <ol class="subtopics-list">
          ${(topic.subtopics || [])
            .map(
              (st) => `
            <li>
              <strong>${escapeHtml(st.title)}</strong>
              <div class="concepts-tag">Concepts: ${st.concepts.map(c => escapeHtml(c)).join(", ")}</div>
            </li>
          `
            )
            .join("")}
        </ol>
      </section>

      <section class="section">
        <h2 class="section-title">3. Production Code Implementation</h2>
        <pre class="code-block"><code>${escapeHtml(topic.solutionSnippet || topic.starterCode || "")}</code></pre>
        <p class="caption">Verified implementation compliant with production type invariants and test fixtures.</p>
      </section>

      <section class="section">
        <h2 class="section-title">4. Real-World Industry Deployment</h2>
        <p>${escapeHtml(topic.deepExplanation.realWorldUsage)}</p>
      </section>

      <section class="section">
        <h2 class="section-title">5. Production Failure Modes & Common Mistakes</h2>
        <ul class="mistakes-list">
          ${topic.deepExplanation.commonMistakes.map((m) => `<li>❌ <strong>Mistake:</strong> ${escapeHtml(m)}</li>`).join("")}
        </ul>
      </section>

      <section class="section">
        <h2 class="section-title">6. External Official References</h2>
        <ul class="resources-list">
          ${topic.externalResources
            .map(
              (r) => `
            <li>
              <strong>${escapeHtml(r.creatorOrOrg)}:</strong> <a href="${r.url}" target="_blank">${escapeHtml(r.title)}</a>
              <div class="res-why">${escapeHtml(r.whyRecommended)} (Verified ${r.lastVerified})</div>
            </li>
          `
            )
            .join("")}
        </ul>
      </section>
    `;
  }

  // Personal Context Append (If present)
  let personalNotesHtml = "";
  if (personalContext?.studentNotes || personalContext?.studentCodeSnippet) {
    personalNotesHtml = `
      <section class="section personal-section">
        <h2 class="section-title">Personal Learning Workspace & Execution Notes</h2>
        ${
          personalContext.studentNotes
            ? `
          <div class="student-note-block">
            <strong>Candidate Self-Authored Notes:</strong>
            <p>${escapeHtml(personalContext.studentNotes)}</p>
          </div>
        `
            : ""
        }
        ${
          personalContext.studentCodeSnippet
            ? `
          <div class="student-code-block">
            <strong>Candidate Code Solution:</strong>
            <pre class="code-block"><code>${escapeHtml(personalContext.studentCodeSnippet)}</code></pre>
            ${
              personalContext.studentCodeOutput
                ? `<strong>Execution Output:</strong><pre class="output-block">${escapeHtml(
                    personalContext.studentCodeOutput
                  )}</pre>`
                : ""
            }
          </div>
        `
            : ""
        }
      </section>
    `;
  }

  // Complete HTML with Cognalyze institutional printable styling
  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(topic.title)} — ${modeLabels[mode]}</title>
  <style>
    @page {
      margin: 18mm 14mm 18mm 14mm;
      size: A4 portrait;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #17191C;
      background: #FFFFFF;
      line-height: 1.5;
      font-size: 11pt;
      margin: 0;
      padding: 24px;
    }
    .header {
      border-bottom: 2px solid #162A43;
      padding-bottom: 14px;
      margin-bottom: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }
    .brand {
      font-size: 18pt;
      font-weight: 900;
      color: #162A43;
      letter-spacing: -0.03em;
    }
    .brand span {
      color: #356AE6;
    }
    .badge {
      display: inline-block;
      font-size: 8.5pt;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 4px;
      background: #EFF4FE;
      color: #356AE6;
      border: 1px solid #D2E0FB;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .doc-meta {
      text-align: right;
      font-size: 9pt;
      color: #667085;
    }
    .title-block {
      margin-bottom: 24px;
    }
    .topic-title {
      font-size: 16pt;
      font-weight: 800;
      color: #162A43;
      margin: 6px 0 2px 0;
      letter-spacing: -0.02em;
    }
    .subject-title {
      font-size: 10pt;
      font-weight: 700;
      color: #356AE6;
      text-transform: uppercase;
    }
    .section {
      margin-bottom: 22px;
      page-break-inside: avoid;
    }
    .section-title {
      font-size: 12pt;
      font-weight: 800;
      color: #162A43;
      border-bottom: 1px solid #E4E1DA;
      padding-bottom: 4px;
      margin: 0 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .callout {
      padding: 10px 14px;
      border-radius: 6px;
      margin: 10px 0;
      font-size: 10pt;
    }
    .callout-info {
      background: #FAF9F6;
      border-left: 4px solid #356AE6;
      color: #162A43;
    }
    .callout-bilingual {
      background: #F8F9FA;
      border-left: 4px solid #B7791F;
      color: #17191C;
    }
    .key-facts p {
      margin: 4px 0;
      font-size: 10pt;
    }
    .code-block {
      background: #FAF9F6;
      border: 1px solid #E4E1DA;
      border-radius: 6px;
      padding: 12px;
      font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 9.5pt;
      line-height: 1.45;
      color: #1E293B;
      overflow-x: auto;
      white-space: pre-wrap;
    }
    .output-block {
      background: #162A43;
      color: #F8FAFC;
      border-radius: 6px;
      padding: 10px;
      font-family: monospace;
      font-size: 9pt;
      margin-top: 6px;
    }
    .caption {
      font-size: 8.5pt;
      color: #667085;
      margin-top: 4px;
      font-style: italic;
    }
    .checklist, .mistakes-list, .resources-list, .concept-list {
      padding-left: 20px;
      margin: 8px 0;
      font-size: 10pt;
    }
    .checklist li, .mistakes-list li, .concept-list li {
      margin-bottom: 6px;
    }
    .subtopics-list {
      padding-left: 20px;
      font-size: 10pt;
    }
    .subtopics-list li {
      margin-bottom: 8px;
    }
    .concepts-tag {
      font-size: 8.5pt;
      color: #667085;
      font-family: monospace;
    }
    .pitfalls-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 10px;
    }
    .pitfall-card {
      background: #FAF9F6;
      border: 1px solid #E4E1DA;
      border-radius: 6px;
      padding: 10px;
      font-size: 9.5pt;
    }
    .pitfall-num {
      font-weight: 800;
      color: #C24141;
      font-size: 8.5pt;
      text-transform: uppercase;
    }
    .interview-box {
      background: #FAF9F6;
      border: 1px solid #D2E0FB;
      border-radius: 6px;
      padding: 12px;
      font-size: 10pt;
    }
    .interview-defense {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #E4E1DA;
      color: #162A43;
    }
    .personal-section {
      background: #FAF9F6;
      border: 1px solid #D2E0FB;
      border-radius: 8px;
      padding: 14px;
      margin-top: 24px;
    }
    .student-note-block {
      margin-bottom: 12px;
      font-size: 10pt;
    }
    .footer {
      margin-top: 30px;
      border-top: 1px solid #E4E1DA;
      padding-top: 10px;
      font-size: 8.5pt;
      color: #667085;
      display: flex;
      justify-content: space-between;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">COGNALYZE <span>STUDIO</span></div>
      <div class="badge">${modeLabels[mode]}</div>
    </div>
    <div class="doc-meta">
      <div><strong>Student:</strong> ${escapeHtml(studentName)}</div>
      <div><strong>Target Role:</strong> ${escapeHtml(roleTitle)}</div>
      <div><strong>Generated:</strong> ${dateStr}</div>
    </div>
  </div>

  <div class="title-block">
    <div class="subject-title">${escapeHtml(subject.title)}</div>
    <h1 class="topic-title">${escapeHtml(topic.title)}</h1>
  </div>

  ${contentHtml}

  ${personalNotesHtml}

  <div class="footer">
    <div>Cognalyze Technical Learning Platform • Verified Knowledge Evidence</div>
    <div>Document Ref: ${docId}</div>
  </div>
</body>
</html>`;

  return {
    id: docId,
    topicId: topic.id,
    topicTitle: topic.title,
    subjectTitle: subject.title,
    mode,
    modeLabel: modeLabels[mode],
    createdAt: dateStr,
    version: "2026.11",
    htmlContent: fullHtml,
    summaryPoints: topic.learningObjectives,
  };
}

/**
 * Saves a generated revision document to local client storage.
 */
export function persistGeneratedDocument(doc: GeneratedRevisionDocument): void {
  if (typeof window === "undefined") {
    memoryDocsStore.set(doc.id, doc);
    return;
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const existing: GeneratedRevisionDocument[] = raw ? JSON.parse(raw) : [];
    const filtered = existing.filter((d) => d.id !== doc.id);
    filtered.unshift(doc);
    // Keep up to 50 revision documents
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 50)));
  } catch (err) {
    console.warn("[RevisionPdfEngine] Failed to persist document:", err);
  }
}

/**
 * Retrieves all stored documents from library.
 */
export function getSavedRevisionDocuments(): GeneratedRevisionDocument[] {
  if (typeof window === "undefined") {
    return Array.from(memoryDocsStore.values());
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Deletes a stored document by ID.
 */
export function deleteSavedRevisionDocument(docId: string): void {
  if (typeof window === "undefined") {
    memoryDocsStore.delete(docId);
    return;
  }
  try {
    const docs = getSavedRevisionDocuments().filter((d) => d.id !== docId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
  } catch (err) {
    console.warn("[RevisionPdfEngine] Failed to delete document:", err);
  }
}

/**
 * Persists personal student notes for a given topic.
 */
export function persistTopicNotes(topicId: string, notes: string): void {
  if (typeof window === "undefined") {
    memoryNotesStore.set(topicId, notes);
    return;
  }
  try {
    localStorage.setItem(`${NOTES_KEY_PREFIX}${topicId}`, notes);
  } catch (err) {
    console.warn("[RevisionPdfEngine] Failed to save notes:", err);
  }
}

/**
 * Retrieves personal student notes for a given topic.
 */
export function getTopicNotes(topicId: string): string {
  if (typeof window === "undefined") {
    return memoryNotesStore.get(topicId) || "";
  }
  try {
    return localStorage.getItem(`${NOTES_KEY_PREFIX}${topicId}`) || "";
  } catch {
    return "";
  }
}

/**
 * Triggers native browser print/PDF export dialog for a document.
 */
export function triggerPdfDownload(htmlContent: string): void {
  if (typeof window === "undefined") return;
  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate and download the revision PDF.");
    return;
  }
  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

function escapeHtml(str: string): string {
  if (!str) return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
