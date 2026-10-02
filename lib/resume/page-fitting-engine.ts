/**
 * COGNALYZE RESUME INTELLIGENCE — PAGE FITTING & DENSITY ENGINE
 * 
 * Ensures realistic page utilization (target: 85–95%)
 * Avoids the "half-page empty" failure mode.
 * Balances content density, spacing tokens, and intelligent section distribution.
 */

import { ResumeDocument, ExperienceItem, ProjectItem, EducationItem, SkillCategory } from './types';

export interface PageBudgetResult {
  totalPageHeightPx: number;
  estimatedContentHeightPx: number;
  usedHeightPt: number;
  utilizationPercent: number;
  isBalanced: boolean;
  status: 'OPTIMAL' | 'SPARSE' | 'OVERFLOW';
  pageCount: number;
  recommendation: string;
}

/**
 * Calculates page utilization percentage based on actual font tokens, lines, and section count.
 * A standard A4 sheet at 96 DPI is 1123px high.
 * Margins: ~16mm top and bottom = ~120px total vertical margin.
 * Usable height: ~1000px per page.
 */
export function calculatePageUtilization(doc: ResumeDocument): PageBudgetResult {
  const isLetter = doc.settings.paperSize === 'Letter';
  const pageHeightPx = isLetter ? 1056 : 1123;
  const usableHeightPerPage = isLetter ? 940 : 1000;

  let totalContentHeight = 0;

  // 1. Header estimate
  // Name (32px) + Title (20px) + Contact line (18px) + Bottom margin (18px)
  totalContentHeight += 90;

  // 2. Summary (if present and visible in sections)
  if (doc.summary?.text && doc.sections.some(s => s.type === 'summary' && s.visible)) {
    const summaryLines = Math.ceil(doc.summary.text.length / 95);
    totalContentHeight += 30 + summaryLines * 18 + 14; // heading + text + margin
  }

  // 3. Sections
  const visibleSections = doc.sections.filter(s => s.visible && s.type !== 'summary');
  for (const sec of visibleSections) {
    // Section title + divider line + spacing
    totalContentHeight += 32;

    if (sec.type === 'experience') {
      const items = (sec.items || []) as ExperienceItem[];
      for (const item of items) {
        totalContentHeight += 24; // Title & company line + dates
        if (item.bullets) {
          for (const b of item.bullets) {
            const lines = Math.ceil((b.text.length + 5) / 88);
            totalContentHeight += lines * 18 + 4; // text line + bullet margin
          }
        }
        totalContentHeight += 8; // item gap
      }
    } else if (sec.type === 'projects') {
      const items = (sec.items || []) as ProjectItem[];
      for (const item of items) {
        totalContentHeight += 24; // Project title & tech stack line
        if (item.bullets) {
          for (const b of item.bullets) {
            const lines = Math.ceil((b.text.length + 5) / 88);
            totalContentHeight += lines * 18 + 4;
          }
        }
        totalContentHeight += 8;
      }
    } else if (sec.type === 'education') {
      const items = (sec.items || []) as EducationItem[];
      for (const item of items) {
        totalContentHeight += 24; // Degree & college line
        if (item.coursework && item.coursework.length > 0) {
          const courseLines = Math.ceil(item.coursework.join(', ').length / 90);
          totalContentHeight += courseLines * 16 + 4;
        }
        if (item.bullets) {
          for (const b of item.bullets) {
            const lines = Math.ceil((b.text.length + 5) / 88);
            totalContentHeight += lines * 18 + 4;
          }
        }
        totalContentHeight += 6;
      }
    } else if (sec.type === 'skills') {
      const items = (sec.items || []) as SkillCategory[];
      for (const item of items) {
        const text = `${item.name}: ${item.items.join(', ')}`;
        const lines = Math.ceil(text.length / 90);
        totalContentHeight += lines * 18 + 4;
      }
    } else if (sec.type === 'achievements') {
      const items = (sec.items || []) as string[];
      for (const ach of items) {
        const lines = Math.ceil(ach.length / 88);
        totalContentHeight += lines * 18 + 4;
      }
    } else if (sec.type === 'certifications') {
      const items = (sec.items || []) as any[];
      for (const cert of items) {
        totalContentHeight += 20;
      }
    }
  }

  const pageCount = Math.max(1, Math.ceil(totalContentHeight / usableHeightPerPage));
  const utilizationPercent = Math.min(
    100,
    Math.round((totalContentHeight / (pageCount * usableHeightPerPage)) * 100)
  );

  const isBalanced = (utilizationPercent >= 80 && utilizationPercent <= 98) || (pageCount > 1 && totalContentHeight >= usableHeightPerPage);
  const status: 'OPTIMAL' | 'SPARSE' | 'OVERFLOW' =
    isBalanced ? 'OPTIMAL' : utilizationPercent < 60 ? 'SPARSE' : 'OVERFLOW';
  const usedHeightPt = Math.round(totalContentHeight * 0.75);

  let recommendation = 'Page utilization is healthy (80%–95%). Professional Overleaf vertical rhythm achieved.';
  if (utilizationPercent < 60) {
    recommendation =
      'Resume occupies less than 60% of available page space. Include additional verified projects, academic coursework, or technical skills from your Master Profile.';
  } else if (utilizationPercent < 80) {
    recommendation =
      'Moderate page utilization (60%–80%). Expand technical project bullets with engineering architecture details to reach optimal balance.';
  } else if (totalContentHeight > usableHeightPerPage && doc.settings.singlePageMode) {
    recommendation =
      'Content exceeds 1 page boundary. Consider switching to compact spacing token or allow natural multi-page flow.';
  }

  return {
    totalPageHeightPx: pageHeightPx * pageCount,
    estimatedContentHeightPx: totalContentHeight,
    usedHeightPt,
    utilizationPercent,
    isBalanced,
    status,
    pageCount,
    recommendation,
  };
}

/**
 * Automatically optimizes spacing tokens and pulls omitted content if resume is too sparse.
 */
export function optimizeResumeBalance(doc: ResumeDocument): ResumeDocument {
  const budget = calculatePageUtilization(doc);

  // If sparse and masterProfile exists, ensure all projects and coursework are utilized
  if (budget.utilizationPercent < 75 && doc.masterProfile) {
    const master = doc.masterProfile;
    let currentProjSec = doc.sections.find(s => s.type === 'projects');
    if (!currentProjSec) {
      currentProjSec = {
        id: 'sec-projects',
        type: 'projects',
        title: 'Technical Projects',
        visible: true,
        order: 3,
        items: master.projects,
      };
      doc.sections.push(currentProjSec);
      doc.sections.sort((a, b) => a.order - b.order);
    } else if (currentProjSec.items && currentProjSec.items.length < master.projects.length) {
      currentProjSec.items = master.projects;
    }

    const currentEduSec = doc.sections.find(s => s.type === 'education');
    if (currentEduSec && currentEduSec.items && master.education[0]?.coursework) {
      (currentEduSec.items as EducationItem[])[0].coursework = master.education[0].coursework;
    }
  }

  return doc;
}
