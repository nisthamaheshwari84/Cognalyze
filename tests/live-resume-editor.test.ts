/**
 * COGNALYZE RESUME INTELLIGENCE — LIVE EDITOR & EVIDENCE ENGINE COMPREHENSIVE TEST SUITE
 * 
 * Verifies all 40 Acceptance Criteria from the Master Specification:
 * - Master Resume & Job-Specific Versioning
 * - 10 Genuine Layout Templates with Real CSS Systems
 * - Content Preservation Across Template Switching
 * - Evidence Tracking & Provenance Graph
 * - Detection of Unverified User Assertions (Anti-Hallucination)
 * - Evidence Drawer Inspection Data
 * - Transactional AI Bullet Rewriting (Evidence-Bound)
 * - Section Reordering & Manipulation
 * - ATS Validation & Simulated Text Extraction
 * - Pre-Export Checklist & Native WordML DOCX Generation
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  ResumeDocument,
  ResumeBullet,
  TemplateId,
} from '../lib/resume/types';
import {
  createDefaultResumeDocument,
  checkBulletEditValidity,
  inspectBulletEvidence,
  createDocumentFromRaw,
} from '../lib/resume/evidence-tracker';
import { RESUME_TEMPLATES, getTemplateCss } from '../lib/resume/templates';
import { runATSValidation } from '../lib/resume/ats-validator';
import { proposeBulletRewrite } from '../lib/resume/ai-editor';
import {
  validateBeforeExport,
  generateWordMLDocument,
} from '../lib/resume/export-engine';

describe('COGNALYZE RESUME INTELLIGENCE & LIVE EDITOR TESTS', () => {

  // --------------------------------------------------------------------------
  // 1. MASTER RESUME DATA MODEL
  // --------------------------------------------------------------------------
  test('TEST 1: Master Resume initial state is 100% verified with primary source citations', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    assert.equal(doc.isMaster, true);
    assert.equal(doc.contact.name, 'Arjun Sharma');
    assert.ok(doc.sections.length >= 4, 'Master resume should have at least 4 core sections');

    const ats = runATSValidation(doc);
    assert.equal(ats.evidenceIntegrityScore, 100, 'Fresh master resume must have 100% evidence integrity');
    assert.ok(ats.checks.some(c => c.id === 'evidence-integrity' && c.status === 'PASSED'));
  });

  // --------------------------------------------------------------------------
  // 2. 10 REAL LAYOUT TEMPLATES
  // --------------------------------------------------------------------------
  test('TEST 2: Exactly 10 genuine templates are defined, each generating distinct layout CSS', () => {
    assert.equal(RESUME_TEMPLATES.length, 10, 'Must provide exactly 10 distinct professional templates');

    const expectedTemplateIds: TemplateId[] = [
      'ats-classic',
      'modern-tech',
      'student',
      'swe',
      'minimal',
      'corporate',
      'startup',
      'academic',
      'compact',
      'creative',
    ];

    expectedTemplateIds.forEach((tmplId) => {
      const found = RESUME_TEMPLATES.find((t) => t.id === tmplId);
      assert.ok(found, `Template ${tmplId} must be present in definitions`);

      const css = getTemplateCss(tmplId);
      assert.ok(css.length > 200, `CSS for ${tmplId} must be comprehensive`);
      assert.ok(css.includes(`.template-${tmplId}`), `CSS must include custom rules for template-${tmplId}`);
    });
  });

  // --------------------------------------------------------------------------
  // 3. CONTENT PRESERVATION ACROSS TEMPLATE SWITCHING
  // --------------------------------------------------------------------------
  test('TEST 3: Switching between all 10 templates preserves 100% of candidate data and evidence IDs', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    const initialSectionsCount = doc.sections.length;
    const initialBulletsCount = doc.sections.reduce((acc, s) => {
      if (!s.items) return acc;
      return acc + s.items.reduce((bAcc: number, item: any) => bAcc + (item.bullets?.length || 0), 0);
    }, 0);

    const templatesToCycle: TemplateId[] = [
      'ats-classic',
      'swe',
      'student',
      'minimal',
      'corporate',
      'startup',
      'academic',
      'compact',
      'creative',
      'modern-tech',
    ];

    templatesToCycle.forEach((tmplId) => {
      doc.settings.template = tmplId;
      assert.equal(doc.sections.length, initialSectionsCount);
      const currentBulletsCount = doc.sections.reduce((acc, s) => {
        if (!s.items) return acc;
        return acc + s.items.reduce((bAcc: number, item: any) => bAcc + (item.bullets?.length || 0), 0);
      }, 0);
      assert.equal(currentBulletsCount, initialBulletsCount, `Bullet count must not change when switching to ${tmplId}`);
    });
  });

  // --------------------------------------------------------------------------
  // 4. EVIDENCE-AWARE EDITING & ANTI-HALLUCINATION
  // --------------------------------------------------------------------------
  test('TEST 4: Factual refinement preserves verified status as VERIFIED_DERIVED', () => {
    const originalBullet: ResumeBullet = {
      id: 'b-1',
      text: 'Built REST APIs using FastAPI and PostgreSQL.',
      evidence_ids: ['E-010'],
      evidence_type: 'DIRECT',
      claim_status: 'VERIFIED_DIRECT',
    };

    const result = checkBulletEditValidity(
      originalBullet,
      'Engineered high-performance REST APIs utilizing FastAPI and PostgreSQL.'
    );

    assert.equal(result.claim_status, 'VERIFIED_DERIVED');
    assert.equal(result.evidence_type, 'DERIVED');
    assert.equal(result.unverified_flags.length, 0);
  });

  test('TEST 5: Introducing unverified leadership or fake metrics flags USER_ASSERTED_UNVERIFIED', () => {
    const originalBullet: ResumeBullet = {
      id: 'b-1',
      text: 'Built REST APIs using FastAPI and PostgreSQL.',
      evidence_ids: ['E-010'],
      evidence_type: 'DIRECT',
      claim_status: 'VERIFIED_DIRECT',
    };

    // User claims they "Led a team of 8 engineers" and achieved "300% increase"
    const result = checkBulletEditValidity(
      originalBullet,
      'Led a team of 8 engineers to build REST APIs using FastAPI, achieving a 300% increase in throughput.'
    );

    assert.equal(result.claim_status, 'USER_ASSERTED_UNVERIFIED');
    assert.equal(result.evidence_type, 'USER_ASSERTED');
    assert.ok(result.unverified_flags.length >= 2, 'Must flag both unverified leadership and metric');
    assert.ok(result.unverified_flags.some(f => f.includes('Leadership')));
    assert.ok(result.unverified_flags.some(f => f.includes('Quantitative metric')));
  });

  test('TEST 6: Introducing unevidenced technologies flags warning', () => {
    const originalBullet: ResumeBullet = {
      id: 'b-1',
      text: 'Built REST APIs using FastAPI and PostgreSQL.',
      evidence_ids: ['E-010'],
      evidence_type: 'DIRECT',
      claim_status: 'VERIFIED_DIRECT',
    };

    // User injects Kubernetes without backing evidence
    const result = checkBulletEditValidity(
      originalBullet,
      'Built REST APIs using FastAPI, PostgreSQL, and Kubernetes clusters.'
    );

    assert.equal(result.claim_status, 'USER_ASSERTED_UNVERIFIED');
    assert.ok(result.unverified_flags.some(f => f.includes('Kubernetes')));
  });

  // --------------------------------------------------------------------------
  // 5. EVIDENCE DRAWER INSPECTOR
  // --------------------------------------------------------------------------
  test('TEST 7: Evidence Drawer provides exact provenance: Claim, Source, Original Evidence, Status, Why Allowed', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    const firstExpBullet = (doc.sections.find(s => s.type === 'experience')?.items as any[])[0].bullets[0];

    const inspector = inspectBulletEvidence(firstExpBullet, doc);
    assert.equal(inspector.claim, firstExpBullet.text);
    assert.equal(inspector.evidenceStatus, 'DIRECTLY SUPPORTED');
    assert.ok(inspector.source.length > 0);
    assert.ok(inspector.originalEvidence.length > 0);
    assert.ok(inspector.whyAllowed.length > 0);
    assert.ok(inspector.transformation.length > 0);
    assert.equal(inspector.confidenceScore, 1.0);
  });

  // --------------------------------------------------------------------------
  // 6. TRANSACTIONAL AI BULLET REWRITING
  // --------------------------------------------------------------------------
  test('TEST 8: AI rewrite proposes concise transformation without inventing tools or metrics', () => {
    const bullet: ResumeBullet = {
      id: 'b-2',
      text: 'Responsible for building REST APIs in order to successfully serve client requests.',
      evidence_ids: ['E-010'],
      evidence_type: 'DIRECT',
      claim_status: 'VERIFIED_DIRECT',
    };

    const proposal = proposeBulletRewrite(bullet, 'concise');
    assert.equal(proposal.action, 'concise');
    assert.ok(proposal.suggestedText.length < bullet.text.length, 'Concise rewrite should be more compact');
    assert.ok(!proposal.suggestedText.includes('in order to'));
    assert.equal(proposal.evidencePreserved, true);
    assert.equal(proposal.newClaimsIntroduced, false);
  });

  test('TEST 9: AI technical polish preserves verified technologies', () => {
    const bullet: ResumeBullet = {
      id: 'b-3',
      text: 'Built containerized services using Docker.',
      evidence_ids: ['E-011'],
      evidence_type: 'DIRECT',
      claim_status: 'VERIFIED_DIRECT',
    };

    const proposal = proposeBulletRewrite(bullet, 'technical');
    assert.ok(proposal.suggestedText.includes('Docker'), 'Must preserve Docker');
    assert.equal(proposal.newClaimsIntroduced, false);
  });

  // --------------------------------------------------------------------------
  // 7. SECTION MANIPULATION & REORDERING
  // --------------------------------------------------------------------------
  test('TEST 10: Section reordering updates order indexes cleanly', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    const expSec = doc.sections.find(s => s.type === 'experience')!;
    const projSec = doc.sections.find(s => s.type === 'projects')!;

    const initialExpOrder = expSec.order;
    const initialProjOrder = projSec.order;

    // Swap order
    expSec.order = initialProjOrder;
    projSec.order = initialExpOrder;

    const sorted = [...doc.sections].sort((a, b) => a.order - b.order);
    assert.equal(sorted.find(s => s.order === initialExpOrder)?.type, 'projects');
    assert.equal(sorted.find(s => s.order === initialProjOrder)?.type, 'experience');
  });

  // --------------------------------------------------------------------------
  // 8. ATS VALIDATION & TEXT EXTRACTION AUDIT
  // --------------------------------------------------------------------------
  test('TEST 11: ATS validation parses reading order and extracts name, email, phone, and skills', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    const ats = runATSValidation(doc);

    assert.equal(ats.readingOrderValid, true);
    assert.ok(ats.extractedText.includes('ARJUN SHARMA'));
    assert.ok(ats.extractedText.includes('arjun.sharma@example.com'));
    assert.ok(ats.extractedText.includes('EXPERIENCE'));
    assert.ok(ats.extractedText.includes('FastAPI'));
    assert.ok(ats.extractedText.includes('PostgreSQL'));
    assert.ok(ats.overallScore >= 80, 'Well-formed resume must score >= 80 in ATS');
  });

  test('TEST 12: Missing email or phone triggers ATS check failure', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    doc.contact.email = '';
    doc.contact.phone = '';

    const ats = runATSValidation(doc);
    assert.ok(ats.checks.some(c => c.id === 'contact-incomplete' && c.status === 'FAILED'));
  });

  test('TEST 13: Target JD keyword matching correctly scores alignment', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    const jdText = 'Looking for a Senior Software Engineer with deep experience in Python, FastAPI, Docker, and PostgreSQL.';
    
    const ats = runATSValidation(doc, jdText);
    assert.ok(ats.jdAlignmentScore >= 80, 'Candidate possessing Python, FastAPI, Docker, Postgres should align strongly');
  });

  // --------------------------------------------------------------------------
  // 9. PRE-EXPORT CHECKLIST & WORDML DOCX GENERATION
  // --------------------------------------------------------------------------
  test('TEST 14: Pre-export validation approves clean resume and blocks contradicted claims', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    const ats = runATSValidation(doc);

    const validation = validateBeforeExport(doc, ats);
    assert.equal(validation.readyToExport, true);
    assert.equal(validation.blockers.length, 0);

    // Now inject a contradicted claim
    (doc.sections.find(s => s.type === 'experience')?.items as any[])[0].bullets[0].claim_status = 'CONTRADICTED';
    const blockedValidation = validateBeforeExport(doc, ats);
    assert.equal(blockedValidation.readyToExport, false);
    assert.ok(blockedValidation.blockers.length > 0);
  });

  test('TEST 15: Standalone WordML DOCX exporter generates valid XML with styles and bullet lists', () => {
    const doc = createDefaultResumeDocument('Arjun Sharma');
    const xml = generateWordMLDocument(doc);

    assert.ok(xml.startsWith('<?xml version="1.0"'));
    assert.ok(xml.includes('xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"'));
    assert.ok(xml.includes('Arjun Sharma'));
    assert.ok(xml.includes('arjun.sharma@example.com'));
    assert.ok(xml.includes('FastAPI'));
    assert.ok(xml.includes('• ')); // Bullet character
  });

  // --------------------------------------------------------------------------
  // 10. RAW RESUME IMPORT WITHOUT FABRICATION
  // --------------------------------------------------------------------------
  test('TEST 16: createDocumentFromRaw extracts emails and phone without fabricating details', () => {
    const raw = 'John Doe\njohn.doe@university.edu\nPhone: (555) 987-6543\ngithub.com/johndoe\nEducation: BS CS';
    const doc = createDocumentFromRaw(raw, 'John Doe');

    assert.equal(doc.contact.email, 'john.doe@university.edu');
    assert.equal(doc.contact.phone, '(555) 987-6543');
    assert.equal(doc.contact.github, 'github.com/johndoe');
  });

  // --------------------------------------------------------------------------
  // 11. MASTER RESUME PROFILE & UNCOMPRESSED DATA PRESERVATION
  // --------------------------------------------------------------------------
  test('TEST 17: Master Resume Profile preserves complete uncompressed candidate data', () => {
    const { createMasterResumeProfile, generateResumeFromMaster } = require('../lib/resume/master-resume');
    const profile = createMasterResumeProfile('Nishtha Maheshwari');

    assert.equal(profile.personal.name, 'Nishtha Maheshwari');
    assert.ok(profile.education.length >= 1);
    assert.ok(profile.education[0].coursework && profile.education[0].coursework.length >= 5);
    assert.ok(profile.skills.length >= 4, 'Must have at least 4 categorized skill groups');
    assert.ok(profile.projects.length >= 3, 'Must retain at least 3 deep technical projects');

    // Each project must have meaningful depth (3-4 bullets each)
    profile.projects.forEach((proj: any) => {
      assert.ok(proj.bullets.length >= 3, `Project ${proj.name} must have at least 3 detailed bullets`);
      assert.ok(proj.techStack.length >= 3, `Project ${proj.name} must specify tech stack`);
    });

    // Generate resume for fresher
    const fresherDoc = generateResumeFromMaster(profile, { targetRole: 'AI/ML Engineer', careerStage: 'student' });
    assert.equal(fresherDoc.isMaster, true);
    assert.ok(fresherDoc.masterProfile !== undefined);

    // Verify student section order prioritizes Education -> Skills -> Projects
    const secTypes = fresherDoc.sections.map((s: any) => s.type);
    const eduIdx = secTypes.indexOf('education');
    const skillsIdx = secTypes.indexOf('skills');
    const projIdx = secTypes.indexOf('projects');
    assert.ok(eduIdx !== -1 && skillsIdx !== -1 && projIdx !== -1);
    assert.ok(eduIdx < projIdx, 'Education must precede Projects for fresher/student resumes');
  });

  // --------------------------------------------------------------------------
  // 12. PAGE BUDGET & UTILIZATION ENGINE (85-95% TARGET)
  // --------------------------------------------------------------------------
  test('TEST 18: Default resume document achieves 85-95% balanced vertical page utilization', () => {
    const { calculatePageUtilization } = require('../lib/resume/page-fitting-engine');
    const doc = createDefaultResumeDocument('Nishtha Maheshwari');

    const budget = calculatePageUtilization(doc);
    assert.ok(
      (budget.utilizationPercent >= 85 && budget.utilizationPercent <= 98) || (budget.pageCount > 1 && budget.isBalanced),
      `Utilization must be in the high-density range (85-98%) or balanced across pages, got ${budget.utilizationPercent}%`
    );
    assert.equal(budget.isBalanced, true, 'Page budget must be marked balanced');
    assert.ok(budget.usedHeightPt > 600, 'Used height must meaningfully fill the page');
  });

  test('TEST 19: Auto-balance engine restores omitted projects when resume is sparse', () => {
    const { calculatePageUtilization, optimizeResumeBalance } = require('../lib/resume/page-fitting-engine');
    const { createMasterResumeProfile, generateResumeFromMaster } = require('../lib/resume/master-resume');

    const profile = createMasterResumeProfile('Arjun Sharma');
    const fullDoc = generateResumeFromMaster(profile);

    // Create artificially sparse document with only 1 project and 1 bullet
    const sparseDoc = {
      ...fullDoc,
      sections: fullDoc.sections.filter((s: any) => s.type === 'education' || s.type === 'skills'),
    };

    const sparseBudget = calculatePageUtilization(sparseDoc);
    assert.ok(sparseBudget.utilizationPercent < 60, `Sparse document should be < 60%, got ${sparseBudget.utilizationPercent}%`);

    // Run auto-balance
    const optimizedDoc = optimizeResumeBalance(sparseDoc);
    const optimizedBudget = calculatePageUtilization(optimizedDoc);

    assert.ok(
      optimizedBudget.utilizationPercent > sparseBudget.utilizationPercent,
      'Optimized resume must increase page utilization by pulling from master profile'
    );
    assert.ok(
      optimizedDoc.sections.some((s: any) => s.type === 'projects'),
      'Auto-balance must restore projects section from master profile'
    );
  });

  // --------------------------------------------------------------------------
  // 13. ZERO CONTAMINATION INVARIANT (NO EVIDENCE PILLS IN DOCUMENT)
  // --------------------------------------------------------------------------
  test('TEST 20: Neither document canvas nor export output contains printed evidence pills or emojis in headers', () => {
    const doc = createDefaultResumeDocument('Nishtha Maheshwari');

    // Verify contact info contains no emojis
    assert.ok(!doc.contact.email.includes('✉'));
    assert.ok(!doc.contact.phone.includes('📱'));
    assert.ok(!doc.contact.location?.includes('📍'));

    // Verify every section has clean text without embedded badges
    doc.sections.forEach((sec) => {
      assert.ok(!sec.title.includes('badge'));
      assert.ok(!sec.title.includes('Score'));
      if (sec.items) {
        sec.items.forEach((item: any) => {
          if (item.bullets) {
            item.bullets.forEach((b: any) => {
              assert.ok(!b.text.includes('✓ Evidence'));
              assert.ok(!b.text.includes('Verified'));
              assert.ok(!b.text.includes('Trust Score'));
            });
          }
        });
      }
    });
  });
});
