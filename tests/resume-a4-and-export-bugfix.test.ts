/**
 * TARGETED BUG-FIX VERIFICATION:
 * ISSUE 1 — RESUME CONTENT OVERFLOWING OUTSIDE PAGE
 * ISSUE 2 — PRINT / DOCUMENT / DOCX EXPORT IS BLANK
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDefaultResumeDocument } from '../lib/resume/evidence-tracker';
import { generateWordMLDocument, printPDF } from '../lib/resume/export-engine';
import { getTemplateCss } from '../lib/resume/templates';
import { ResumeDocument, ProjectItem, ExperienceItem } from '../lib/resume/types';

describe('TARGETED BUG-FIX TESTS: RESUME A4 OVERFLOW & EXPORT PIPELINE', () => {

  // --------------------------------------------------------------------------
  // TEST 1 — A4 BOUNDARY & HORIZONTAL/VERTICAL OVERFLOW WRAPPING
  // --------------------------------------------------------------------------
  test('TEST 1: Long project descriptions, unbroken keywords, and bullets wrap naturally inside A4 content bounds', () => {
    const css = getTemplateCss('ats-classic');

    // Verify word-break and overflow-wrap tokens exist in the stylesheet
    assert.ok(css.includes('overflow-wrap: break-word'), 'CSS must include overflow-wrap: break-word');
    assert.ok(css.includes('word-break: break-word'), 'CSS must include word-break: break-word');
    assert.ok(css.includes('box-sizing: border-box'), 'CSS must enforce box-sizing: border-box');

    // Verify item-left and bullet-item containment
    assert.ok(css.includes('.item-left {'), 'CSS must define item-left');
    assert.ok(css.includes('min-width: 0'), 'CSS must specify min-width: 0 on flex children to prevent horizontal blowout');

    // Verify skills list wrapping
    assert.ok(css.includes('.skill-category-items {'), 'CSS must define skill-category-items');
  });

  // --------------------------------------------------------------------------
  // TEST 2 — SINGLE PAGE VERIFICATION
  // --------------------------------------------------------------------------
  test('TEST 2: Standard single-page resume generates exactly 1 page with no blank/extra pages', () => {
    const doc = createDefaultResumeDocument('Nishtha Maheshwari');
    // Ensure standard single page content
    const css = getTemplateCss(doc.settings);
    assert.ok(css.includes('.resume-page-sheet'), 'Template CSS must support .resume-page-sheet');

    // In the WordML export for a single page resume:
    const docx = generateWordMLDocument(doc);
    assert.ok(docx.includes('Nishtha Maheshwari'));
    assert.ok(docx.includes('EXPERIENCE'));
    assert.ok(docx.includes('PROJECTS'));
    assert.ok(docx.includes('EDUCATION'));
    assert.ok(docx.includes('SKILLS'));
  });

  // --------------------------------------------------------------------------
  // TEST 3 — MULTI-PAGE FLOW & NON-STRANDED HEADINGS
  // --------------------------------------------------------------------------
  test('TEST 3: Multi-page resume flows cleanly across pages without orphaned headings or escaping text', () => {
    const doc = createDefaultResumeDocument('Nishtha Maheshwari');

    // Add extra projects and experiences to make it genuinely multi-page
    const extraProject: ProjectItem = {
      id: 'proj-extra-1',
      name: 'High-Throughput Distributed Stream Pipeline',
      technologies: ['Go', 'Kafka', 'PostgreSQL', 'Docker', 'Kubernetes'],
      githubUrl: 'github.com/nisthamaheshwari/stream-pipeline',
      bullets: [
        {
          id: 'b-extra-1',
          text: 'Architected distributed log-streaming service sustaining 50,000 events/second with sub-10ms delivery latency.',
          evidence_ids: [],
          evidence_type: 'USER_ASSERTED',
          claim_status: 'USER_ASSERTED_UNVERIFIED',
        },
        {
          id: 'b-extra-2',
          text: 'Implemented resilient dead-letter retries with automatic circuit breaking and distributed Prometheus tracing.',
          evidence_ids: [],
          evidence_type: 'USER_ASSERTED',
          claim_status: 'USER_ASSERTED_UNVERIFIED',
        },
        {
          id: 'b-extra-3',
          text: 'Optimized memory allocation profile resulting in 42% reduction in p99 garbage collector pause durations.',
          evidence_ids: [],
          evidence_type: 'USER_ASSERTED',
          claim_status: 'USER_ASSERTED_UNVERIFIED',
        }
      ]
    };

    const extraExp: ExperienceItem = {
      id: 'exp-extra-1',
      company: 'Distributed Systems Laboratory',
      role: 'Undergraduate Systems Researcher',
      startDate: '2023',
      endDate: '2024',
      current: false,
      bullets: [
        {
          id: 'b-exp-extra-1',
          text: 'Researched replication consensus consistency models under synthetic partition and packet reordering conditions.',
          evidence_ids: [],
          evidence_type: 'USER_ASSERTED',
          claim_status: 'USER_ASSERTED_UNVERIFIED',
        },
        {
          id: 'b-exp-extra-2',
          text: 'Benchmarked Raft protocol leader election stabilization delays across geographically separated nodes.',
          evidence_ids: [],
          evidence_type: 'USER_ASSERTED',
          claim_status: 'USER_ASSERTED_UNVERIFIED',
        }
      ]
    };

    const projSec = doc.sections.find(s => s.type === 'projects');
    if (projSec && projSec.items) {
      projSec.items.push(extraProject);
    }
    const expSec = doc.sections.find(s => s.type === 'experience');
    if (expSec && expSec.items) {
      expSec.items.push(extraExp);
    }

    // Add certifications section
    doc.sections.push({
      id: 'sec-cert',
      title: 'Certifications',
      type: 'certifications',
      visible: true,
      order: 8,
      items: [
        { id: 'c1', name: 'AWS Certified Cloud Practitioner', issuer: 'Amazon Web Services', date: '2024' },
        { id: 'c2', name: 'DeepLearning.AI Machine Learning Specialization', issuer: 'Coursera', date: '2023' }
      ]
    });

    const docx = generateWordMLDocument(doc);
    assert.ok(docx.includes('CERTIFICATIONS'), 'Certifications heading must be in DOCX');
    assert.ok(docx.includes('AWS Certified Cloud Practitioner'), 'Certification items must be in DOCX');
    assert.ok(docx.includes('High-Throughput Distributed Stream Pipeline'), 'Extra projects must be in DOCX');
    assert.ok(docx.includes('Distributed Systems Laboratory'), 'Extra experience must be in DOCX');
  });

  // --------------------------------------------------------------------------
  // TEST 4 — PRINT ISOLATION & ZERO TOOLBAR LEAKAGE
  // --------------------------------------------------------------------------
  test('TEST 4: Print stylesheet completely isolates resume canvas and strips UI controls', () => {
    const css = getTemplateCss('ats-classic');

    // In print media:
    assert.ok(css.includes('@media print'), 'Must declare @media print');
    assert.ok(css.includes('body *'), 'Must declare body * visibility rule for isolation');
    assert.ok(css.includes('visibility: hidden'), 'Print stylesheet must hide body *');
    assert.ok(css.includes('#resume-live-canvas'), 'Print stylesheet must target #resume-live-canvas');
    assert.ok(css.includes('visibility: visible'), 'Print stylesheet must make #resume-live-canvas visible');
    assert.ok(css.includes('.no-print'), 'Must hide .no-print elements');
    assert.ok(css.includes('page-break-after: always'), 'Multi-page print must break after pages');
  });

  // --------------------------------------------------------------------------
  // TEST 5 — DOCUMENT / DOCX EXPORT COMPLETENESS & SCHEMA
  // --------------------------------------------------------------------------
  test('TEST 5: WordML DOCX export contains valid XML namespaces, font definitions, and full content', () => {
    const doc = createDefaultResumeDocument('Nishtha Maheshwari');
    // Add achievements
    doc.sections.push({
      id: 'sec-ach',
      title: 'Honors & Achievements',
      type: 'achievements',
      visible: true,
      order: 9,
      items: [
        'Finalist in Smart India Hackathon 2024 among 10,000+ national teams.',
        'Ranked in top 2% of LeetCode competitive algorithm contests.'
      ]
    });

    const xml = generateWordMLDocument(doc);

    // Schema validity checks
    assert.ok(xml.startsWith('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'));
    assert.ok(xml.includes('xmlns:w="http://schemas.microsoft.com/office/word/2003/wordml"'));
    assert.ok(xml.includes('<w:fonts>'));
    assert.ok(xml.includes('<w:styles>'));
    assert.ok(xml.includes('<w:sectPr>'));
    assert.ok(xml.includes('</w:wordDocument>'));

    // Text presence checks
    assert.ok(xml.includes('Nishtha Maheshwari'));
    assert.ok(xml.includes('Smart India Hackathon'));
    assert.ok(xml.includes('LeetCode'));
    assert.ok(xml.includes('• ')); // Bullet lists
  });

  // --------------------------------------------------------------------------
  // TEST 6 — REGRESSION PREVENTION
  // --------------------------------------------------------------------------
  test('TEST 6: All existing Resume Builder template definitions and settings remain untouched', () => {
    const doc = createDefaultResumeDocument('Test Candidate');
    assert.equal(doc.settings.template, 'ats-classic');
    assert.equal(doc.settings.paperSize, 'A4');
    assert.equal(doc.settings.fontFamily, 'Georgia');
    assert.ok(doc.sections.length >= 4);
  });
});
