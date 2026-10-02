/**
 * COGNALYZE RESUME INTELLIGENCE — 10 REAL PROFESSIONAL LAYOUT TEMPLATES
 * 
 * Inspired by the structural principles of Overleaf, LaTeX single-column engineering resumes,
 * Teal, and FlowCV.
 * 
 * Provides:
 * - Proper page dimensions (A4 & Letter) with realistic margins (0.55in–0.7in).
 * - Rigorous typographic hierarchy and vertical rhythm.
 * - Hanging bullet lists with aligned text wrapping.
 * - Right-aligned dates on the same baseline.
 * - Zero decorative clutter on the actual resume document.
 */

import { AccentColor, DesignSettings, FontFamily, FontSize, PaperSize, SpacingScale, TemplateId } from './types';

export interface TemplateDefinition {
  id: TemplateId;
  name: string;
  category: 'ATS-Classic' | 'Tech' | 'Fresher' | 'Executive' | 'Academic' | 'Minimal' | 'Creative';
  description: string;
  bestFor: string;
  atsCompatibility: 'MAXIMUM (100%)' | 'HIGH (96%)' | 'GOOD (92%)';
  defaultFont: FontFamily;
  defaultPaper: PaperSize;
  supportsMultiPage: boolean;
  idealRole: string;
  accentPalette: Record<AccentColor, string>;
}

export const RESUME_TEMPLATES: TemplateDefinition[] = [
  {
    id: 'ats-classic',
    name: 'ATS Classic (Overleaf Engineering)',
    category: 'ATS-Classic',
    description: 'The golden standard single-column Overleaf/LaTeX engineering template. High contrast, clean horizontal rules, zero parsing friction.',
    bestFor: 'Software Engineering, Corporate, Banking, Internships, Standard Enterprise ATS',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'Georgia',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Software Engineers, Full-Stack, Backend, Systems, Corporate',
    accentPalette: {
      black: '#111827',
      charcoal: '#1f2937',
      navy: '#0f172a',
      blue: '#1e3a8a',
      green: '#064e3b',
      burgundy: '#4c0519',
      purple: '#3b0764',
      neutral: '#334155',
    },
  },
  {
    id: 'modern-tech',
    name: 'Modern Tech (Developer & Systems)',
    category: 'Tech',
    description: 'Modern developer hierarchy with clean typography, subtle accent dividers, and technical stack grouping.',
    bestFor: 'Software Engineers, Full-Stack, AI/ML Engineers, Product Developers',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'Inter',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Tech startups, modern scale-ups, and developer hiring pipelines',
    accentPalette: {
      black: '#09090b',
      charcoal: '#18181b',
      navy: '#1e293b',
      blue: '#2563eb',
      green: '#059669',
      burgundy: '#be123c',
      purple: '#7c3aed',
      neutral: '#475569',
    },
  },
  {
    id: 'student',
    name: 'Student & Fresher (College Standard)',
    category: 'Fresher',
    description: 'Optimized specifically for students & freshers. Prioritizes Education, Coursework, Technical Projects, and Skills for 88–95% page utilization.',
    bestFor: 'College students, new graduates, junior developers, internship applicants',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'Source Sans 3',
    defaultPaper: 'A4',
    supportsMultiPage: false,
    idealRole: 'Students seeking internships, new grad software roles, and junior engineering jobs',
    accentPalette: {
      black: '#111827',
      charcoal: '#1f2937',
      navy: '#1e3a5f',
      blue: '#0284c7',
      green: '#047857',
      burgundy: '#9f1239',
      purple: '#6d28d9',
      neutral: '#374151',
    },
  },
  {
    id: 'swe',
    name: 'Software Engineer (Systems & Backend)',
    category: 'Tech',
    description: 'Architectural emphasis for systems, backend, and infrastructure engineers. Highlights repositories, architectures, and performance metrics.',
    bestFor: 'Backend, Systems, Cloud, Distributed Systems, DevOps, SWE',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'IBM Plex Sans',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Backend engineers, DevOps, distributed systems developers',
    accentPalette: {
      black: '#0f172a',
      charcoal: '#1e293b',
      navy: '#0369a1',
      blue: '#2563eb',
      green: '#15803d',
      burgundy: '#b91c1c',
      purple: '#6b21a8',
      neutral: '#475569',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal (Clean FlowCV Standard)',
    category: 'Minimal',
    description: 'Refined whitespace, minimal lines, and high-legibility typography. Allows technical substance to speak for itself.',
    bestFor: 'Frontend, Full-Stack, Product Engineers, Minimalist aesthetic',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'Inter',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Frontend developers, UI/UX engineers, full-stack builders',
    accentPalette: {
      black: '#18181b',
      charcoal: '#27272a',
      navy: '#0f172a',
      blue: '#3b82f6',
      green: '#10b981',
      burgundy: '#e11d48',
      purple: '#8b5cf6',
      neutral: '#52525b',
    },
  },
  {
    id: 'corporate',
    name: 'Corporate & Consulting',
    category: 'Executive',
    description: 'Traditional date hierarchy and formal layout. Best for management consulting, enterprise IT, and business technology roles.',
    bestFor: 'Enterprise software, consulting, business analysts, finance, project management',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'Times New Roman',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Consulting, IT management, technical project leads',
    accentPalette: {
      black: '#111827',
      charcoal: '#1f2937',
      navy: '#1e3a5f',
      blue: '#1d4ed8',
      green: '#166534',
      burgundy: '#881337',
      purple: '#581c87',
      neutral: '#374151',
    },
  },
  {
    id: 'startup',
    name: 'Startup (Fast Shipping & 0→1)',
    category: 'Tech',
    description: 'Compact, punchy typography tailored for early-stage companies and founders looking for high-velocity builders.',
    bestFor: 'Early-stage tech startups, YC founders, rapid MVP builders',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'Inter',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Founding engineers, early-stage hires, generalist developers',
    accentPalette: {
      black: '#09090b',
      charcoal: '#18181b',
      navy: '#1e293b',
      blue: '#dc2626',
      green: '#059669',
      burgundy: '#be123c',
      purple: '#7c3aed',
      neutral: '#475569',
    },
  },
  {
    id: 'academic',
    name: 'Academic & Research (LaTeX CV)',
    category: 'Academic',
    description: 'Multi-page aware LaTeX CV format. Highlights Publications, Research, Education, Honors, and Teaching.',
    bestFor: 'Research scientists, PhD/Masters students, machine learning researchers, academic positions',
    atsCompatibility: 'HIGH (96%)',
    defaultFont: 'Georgia',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Research scientists, ML researchers, professors, graduate applicants',
    accentPalette: {
      black: '#111827',
      charcoal: '#1f2937',
      navy: '#1e3a5f',
      blue: '#1e40af',
      green: '#065f46',
      burgundy: '#831843',
      purple: '#4c1d95',
      neutral: '#334155',
    },
  },
  {
    id: 'compact',
    name: 'Compact (High Density Single Page)',
    category: 'Tech',
    description: 'Engineered for dense, multi-role resumes that need to fit onto a single page without sacrificing 9.5pt readability.',
    bestFor: 'Experienced candidates with extensive project and employment records',
    atsCompatibility: 'MAXIMUM (100%)',
    defaultFont: 'IBM Plex Sans',
    defaultPaper: 'A4',
    supportsMultiPage: false,
    idealRole: 'Mid-to-senior engineers fitting 3+ roles onto one tight page',
    accentPalette: {
      black: '#0f172a',
      charcoal: '#1e293b',
      navy: '#0284c7',
      blue: '#2563eb',
      green: '#059669',
      burgundy: '#be123c',
      purple: '#7c3aed',
      neutral: '#475569',
    },
  },
  {
    id: 'creative',
    name: 'Creative & Portfolio (Teal Standard)',
    category: 'Creative',
    description: 'Distinctive typography and subtle sidebar accents without using graphics or unparseable columns. 100% ATS text-safe.',
    bestFor: 'UI/UX Engineers, Frontend Specialists, Product Designers who code',
    atsCompatibility: 'HIGH (96%)',
    defaultFont: 'Lato',
    defaultPaper: 'A4',
    supportsMultiPage: true,
    idealRole: 'Frontend developers, UI/UX engineers, design systems leads',
    accentPalette: {
      black: '#18181b',
      charcoal: '#27272a',
      navy: '#0f172a',
      blue: '#6366f1',
      green: '#10b981',
      burgundy: '#be123c',
      purple: '#7c3aed',
      neutral: '#334155',
    },
  },
];

export const FONT_CONFIG: Record<FontFamily, { stack: string; webFont: string }> = {
  'Inter': {
    stack: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    webFont: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap',
  },
  'IBM Plex Sans': {
    stack: "'IBM Plex Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    webFont: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap',
  },
  'Source Sans 3': {
    stack: "'Source Sans 3', 'Source Sans Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    webFont: 'https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700;800&display=swap',
  },
  'Lato': {
    stack: "'Lato', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    webFont: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700;900&display=swap',
  },
  'Georgia': {
    stack: "Georgia, Cambria, 'Times New Roman', Times, serif",
    webFont: '',
  },
  'Times New Roman': {
    stack: "'Times New Roman', Times, Georgia, serif",
    webFont: '',
  },
};

// Overleaf / LaTeX standard typography tokens
export const TOKEN_SIZES: Record<FontSize, { name: string; title: string; section: string; body: string; meta: string }> = {
  small: { name: '21pt', title: '10pt', section: '10.5pt', body: '9.4pt', meta: '9pt' },
  medium: { name: '23pt', title: '10.5pt', section: '11pt', body: '9.8pt', meta: '9.2pt' },
  large: { name: '25pt', title: '11pt', section: '11.5pt', body: '10.2pt', meta: '9.5pt' },
};

export const TOKEN_SPACING: Record<SpacingScale, { line: string; section: string; item: string; bullet: string; margin: string }> = {
  compact: { line: '1.34', section: '9px', item: '5px', bullet: '2px', margin: '14mm 16mm' },
  normal: { line: '1.42', section: '12px', item: '7px', bullet: '2.5px', margin: '16mm 18mm' },
  spacious: { line: '1.50', section: '15px', item: '9px', bullet: '3.5px', margin: '18mm 20mm' },
};

export function getTemplateCss(
  templateOrSettings: TemplateId | DesignSettings,
  font?: FontFamily,
  fontSize?: FontSize,
  spacing?: SpacingScale,
  accent?: AccentColor
): string {
  let templateId: TemplateId;
  let activeFont: FontFamily;
  let activeFontSize: FontSize;
  let activeSpacing: SpacingScale;
  let activeAccent: AccentColor;

  if (typeof templateOrSettings === 'object') {
    templateId = templateOrSettings.template;
    activeFont = templateOrSettings.fontFamily;
    activeFontSize = templateOrSettings.fontSize;
    activeSpacing = templateOrSettings.sectionSpacing || 'normal';
    activeAccent = templateOrSettings.accentColor || 'blue';
  } else {
    templateId = templateOrSettings;
    activeFont = font || 'Inter';
    activeFontSize = fontSize || 'medium';
    activeSpacing = spacing || 'normal';
    activeAccent = accent || 'blue';
  }

  const fontObj = FONT_CONFIG[activeFont] || FONT_CONFIG['Inter'];
  const sizes = TOKEN_SIZES[activeFontSize] || TOKEN_SIZES['medium'];
  const spaces = TOKEN_SPACING[activeSpacing] || TOKEN_SPACING['normal'];
  const tpl = RESUME_TEMPLATES.find((t) => t.id === templateId) || RESUME_TEMPLATES[0];
  const accentColor = tpl.accentPalette[activeAccent] || '#111827';

  return `
    ${fontObj.webFont ? `@import url('${fontObj.webFont}');` : ''}

    /* Base Document Sheet (Overleaf / LaTeX Geometry) */
    .resume-canvas, .resume-document, .resume-page-sheet, .template-${templateId} {
      font-family: ${fontObj.stack};
      color: #111827;
      line-height: ${spaces.line};
      padding: ${spaces.margin};
      box-sizing: border-box;
      background: #ffffff;
      width: 100%;
      min-height: 100%;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* ---------------------------------------------------- */
    /* HEADER (10-15% of Page, Zero Emojis)                 */
    /* ---------------------------------------------------- */
    .resume-header {
      margin-bottom: ${spaces.section};
      ${templateId === 'ats-classic' || templateId === 'corporate' ? 'text-align: center;' : 'text-align: left;'}
      ${templateId === 'creative' ? `border-left: 3.5px solid ${accentColor}; padding-left: 14px;` : ''}
    }
    .resume-name {
      font-size: ${sizes.name};
      font-weight: 800;
      color: ${templateId === 'ats-classic' ? '#111827' : accentColor};
      letter-spacing: ${templateId === 'ats-classic' ? '0.5px' : '-0.5px'};
      line-height: 1.1;
      margin: 0 0 3px 0;
      ${templateId === 'ats-classic' ? 'text-transform: uppercase;' : ''}
    }
    .resume-title {
      font-size: ${sizes.title};
      font-weight: 600;
      color: #4b5563;
      margin: 0 0 5px 0;
      letter-spacing: 0.2px;
    }
    .resume-contact-bar {
      font-size: ${sizes.meta};
      color: #4b5563;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px 12px;
      line-height: 1.35;
      ${templateId === 'ats-classic' || templateId === 'corporate' ? 'justify-content: center;' : 'justify-content: flex-start;'}
    }
    .contact-item {
      display: inline-flex;
      align-items: center;
      color: #374151;
    }
    .contact-divider {
      color: #9ca3af;
      user-select: none;
    }

    /* ---------------------------------------------------- */
    /* SECTIONS & HEADINGS (Overleaf Single-Rule Standard)  */
    /* ---------------------------------------------------- */
    .resume-section {
      margin-bottom: ${spaces.section};
      page-break-inside: avoid;
    }
    .section-heading-container {
      margin-bottom: 5px;
    }
    .section-heading {
      font-size: ${sizes.section};
      font-weight: 800;
      color: ${templateId === 'ats-classic' ? '#111827' : accentColor};
      text-transform: uppercase;
      letter-spacing: 1px;
      padding-bottom: 2.5px;
      margin: 0;
      border-bottom: 1.2px solid ${templateId === 'minimal' ? '#e5e7eb' : templateId === 'ats-classic' ? '#111827' : accentColor};
    }

    /* ---------------------------------------------------- */
    /* ITEMS & SUB-HEADERS (Right-Aligned Dates on Baseline)*/
    /* ---------------------------------------------------- */
    .resume-item {
      margin-bottom: ${spaces.item};
      page-break-inside: avoid;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      flex-wrap: wrap;
      gap: 4px;
      margin-bottom: 2px;
      width: 100%;
      box-sizing: border-box;
    }
    .item-left {
      font-size: ${sizes.body};
      line-height: 1.3;
      flex: 1 1 auto;
      min-width: 0;
      max-width: 100%;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .item-role, .item-name, .item-institution {
      font-weight: 700;
      color: #111827;
    }
    .item-company, .item-degree {
      font-weight: 600;
      color: #374151;
    }
    .item-right {
      display: flex;
      align-items: baseline;
      gap: 6px;
      flex-shrink: 0;
      max-width: 100%;
    }
    .item-dates {
      font-size: ${sizes.meta};
      color: #4b5563;
      font-weight: 500;
      white-space: nowrap;
    }
    .project-tech-line {
      font-size: ${sizes.meta};
      color: #4b5563;
      font-style: italic;
    }
    .education-gpa {
      font-size: ${sizes.meta};
      color: #374151;
      font-weight: 600;
    }
    .education-coursework {
      font-size: ${sizes.meta};
      color: #4b5563;
      margin-top: 2px;
      margin-bottom: 2px;
      line-height: 1.35;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .coursework-label {
      font-weight: 700;
      color: #111827;
    }

    /* ---------------------------------------------------- */
    /* BULLET SYSTEM (True Hanging Indent, Aligned Wrap)   */
    /* ---------------------------------------------------- */
    .bullet-list {
      list-style: none !important;
      margin: 3px 0 0 0 !important;
      padding: 0 !important;
    }
    .bullet-item {
      position: relative !important;
      padding-left: 14px !important;
      margin-bottom: ${spaces.bullet} !important;
      line-height: ${spaces.line} !important;
      font-size: ${sizes.body} !important;
      color: #374151 !important;
      text-align: justify;
      overflow-wrap: break-word;
      word-break: break-word;
      max-width: 100%;
      box-sizing: border-box;
    }
    .bullet-item::before {
      content: "•";
      position: absolute;
      left: 0;
      top: 0;
      color: #4b5563;
      font-size: 1.1em;
      line-height: 1;
      font-weight: 700;
    }

    /* ---------------------------------------------------- */
    /* TECHNICAL SKILLS CATEGORIES                          */
    /* ---------------------------------------------------- */
    .skills-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
      width: 100%;
      box-sizing: border-box;
    }
    .skill-category-row {
      font-size: ${sizes.body};
      line-height: 1.38;
      color: #374151;
      width: 100%;
      box-sizing: border-box;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .skill-category-name {
      font-weight: 700;
      color: #111827;
    }
    .skill-category-items {
      color: #374151;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* ---------------------------------------------------- */
    /* HONORS & ACHIEVEMENTS LIST                           */
    /* ---------------------------------------------------- */
    .achievements-list, .certifications-list {
      list-style: none;
      margin: 2px 0 0 0;
      padding: 0;
    }
    .achievement-item, .certification-item {
      position: relative;
      padding-left: 14px;
      margin-bottom: ${spaces.bullet};
      line-height: ${spaces.line};
      font-size: ${sizes.body};
      color: #374151;
      overflow-wrap: break-word;
      word-break: break-word;
    }
    .achievement-item::before, .certification-item::before {
      content: "•";
      position: absolute;
      left: 0;
      top: 0;
      color: #4b5563;
      font-weight: 700;
    }

    /* ---------------------------------------------------- */
    /* SUMMARY PARAGRAPH                                    */
    /* ---------------------------------------------------- */
    .summary-body {
      font-size: ${sizes.body};
      line-height: ${spaces.line};
      color: #374151;
      text-align: justify;
      overflow-wrap: break-word;
      word-break: break-word;
    }

    /* ---------------------------------------------------- */
    /* STRICT CLEAN PRINT & EXPORT SANITIZATION             */
    /* (ZERO EVIDENCE PILLS, ZERO AI LABELS, ZERO BUTTONS)  */
    /* ---------------------------------------------------- */
    @media print {
      @page {
        size: ${typeof templateOrSettings === 'object' && templateOrSettings.paperSize === 'Letter' ? 'letter portrait' : 'A4 portrait'};
        margin: 0;
      }
      html, body {
        background: #ffffff !important;
        margin: 0 !important;
        padding: 0 !important;
        height: auto !important;
        min-height: 100% !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      body * {
        visibility: hidden;
      }
      #resume-live-canvas,
      #resume-live-canvas * {
        visibility: visible;
      }
      #resume-live-canvas {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        transform: none !important;
        display: block !important;
      }
      .no-print, button, .item-delete-btn, .bullet-delete-btn, .add-bullet-wrap, .add-item-bar, .resume-page-break-indicator {
        display: none !important;
      }
      .resume-canvas, .resume-document {
        box-shadow: none !important;
        margin: 0 !important;
        padding: 0 !important;
        width: 100% !important;
        transform: none !important;
      }
      .resume-page-sheet {
        page-break-inside: avoid !important;
        break-inside: avoid !important;
        box-shadow: none !important;
        margin: 0 !important;
        padding: ${spaces.margin} !important;
        width: 100% !important;
        box-sizing: border-box !important;
        transform: none !important;
        min-height: ${typeof templateOrSettings === 'object' && templateOrSettings.paperSize === 'Letter' ? '279.4mm' : '297mm'} !important;
      }
      .resume-page-sheet:not(:last-child) {
        page-break-after: always !important;
        break-after: page !important;
      }
      [contenteditable] {
        outline: none !important;
        background: transparent !important;
      }
    }
  `;
}
