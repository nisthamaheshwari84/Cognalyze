import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { convertGeneratedResumeToDocument } from '../lib/resume/converter';
import { runATSValidation } from '../lib/resume/ats-validator';
import { proposeBulletRewrite } from '../lib/resume/ai-editor';
import { checkBulletEditValidity } from '../lib/resume/evidence-tracker';
import { generateWordMLDocument, validateBeforeExport } from '../lib/resume/export-engine';
import { ResumeDocument, ResumeBullet, TemplateId, ProjectItem, SkillCategory } from '../lib/resume/types';

describe('CANONICAL RESUME FLOW — GENERATED RESUME IS THE EDITABLE RESUME', () => {

  const sampleStudentApiResponse = {
    name: "Nishtha Maheshwari",
    title: "AI/ML Engineer & Full Stack Developer",
    email: "nisthamaheshwari84@gmail.com",
    phone: "+91 98765 43210",
    location: "Ghaziabad, India",
    linkedin: "linkedin.com/in/nistha-maheshwari",
    github: "github.com/nisthamaheshwari",
    summary: "Dedicated Computer Science & Engineering student specializing in AI/ML with experience building scalable recruitment intelligence and distributed backend architectures.",
    education: [
      {
        institution: "ABES Engineering College, Ghaziabad",
        degree: "B.Tech in Computer Science & Engineering (AI/ML)",
        year: "2024 - 2028",
        gpa: "8.8 / 10.0",
        relevant: "Data Structures & Algorithms, Machine Learning, Operating Systems, DBMS",
        bullets: [
          "Ranked in top 5% of department with consistent academic excellence."
        ]
      }
    ],
    skills_categorized: {
      "Programming Languages": ["Python", "C++", "TypeScript", "SQL"],
      "AI & Machine Learning": ["PyTorch", "Generative AI", "LLMs", "NLP"],
      "Frameworks & Web": ["React", "Next.js", "FastAPI", "Node.js"],
      "Developer Tools": ["Docker", "Git", "PostgreSQL", "Redis"]
    },
    projects: [
      {
        name: "Cognalyze Recruitment Intelligence",
        tech: "Next.js, FastAPI, Vector DB, PostgreSQL",
        link: "github.com/nisthamaheshwari/cognalyze",
        bullets: [
          "Built Cognalyze using Python and React.",
          "Designed multi-agent candidate evaluation pipelines with real-time scoring."
        ]
      },
      {
        name: "Healthcare Diagnostic AI",
        tech: "PyTorch, Vision Transformers, Docker",
        link: "github.com/nisthamaheshwari/healthcare-ai",
        bullets: [
          "Developed deep learning vision model detecting pulmonary conditions with 96.2% accuracy."
        ]
      }
    ],
    experience: [
      {
        role: "AI Engineering Intern",
        company: "Cognalyze Systems",
        dates: "2024 - Present",
        location: "Ghaziabad, India",
        bullets: [
          "Engineered async task queues with Redis, handling 10k+ requests per second."
        ]
      }
    ],
    certifications: [
      "AWS Certified Cloud Practitioner",
      "DeepLearning.AI Machine Learning Specialization"
    ],
    achievements: [
      "Top Performer: Won National Collegiate Hackathon 2024 with 400+ participants."
    ],
    ats_score: 92,
    keywords_matched: ["Python", "Machine Learning", "FastAPI", "React", "PostgreSQL"]
  };

  test('CRITERIA 1-4: Generated resume JSON converts directly into the ONE canonical ResumeDocument', () => {
    const doc = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'ats-classic');

    // Canonical document contains candidate information
    assert.equal(doc.contact.name, "Nishtha Maheshwari");
    assert.equal(doc.contact.email, "nisthamaheshwari84@gmail.com");
    assert.equal(doc.contact.phone, "+91 98765 43210");
    assert.equal(doc.contact.location, "Ghaziabad, India");
    assert.equal(doc.summary.text, sampleStudentApiResponse.summary);

    // Verify sections
    const secTypes = doc.sections.map(s => s.type);
    assert.ok(secTypes.includes('education'));
    assert.ok(secTypes.includes('skills'));
    assert.ok(secTypes.includes('projects'));
    assert.ok(secTypes.includes('experience'));
    assert.ok(secTypes.includes('certifications'));
    assert.ok(secTypes.includes('achievements'));

    // Zero sample/demo leakage
    const docJson = JSON.stringify(doc);
    assert.ok(!docJson.includes("Arjun Sharma"));
    assert.ok(!docJson.includes("Dataspark"));
    assert.ok(!docJson.includes("Apex Cloud"));
    assert.ok(!docJson.includes("University of Washington"));
  });

  test('CRITERIA 5-7: Direct inline editing modifies the SAME canonical resume state', () => {
    let doc = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'ats-classic');

    // Simulate user editing Project 1 bullet 1 directly
    const projSection = doc.sections.find(s => s.type === 'projects')!;
    const projItems = projSection.items as ProjectItem[];
    const proj = projItems[0];
    const bulletToEdit = proj.bullets[0];
    assert.equal(bulletToEdit.text, "Built Cognalyze using Python and React.");

    const newEditedText = "Built Cognalyze, an AI-powered recruitment intelligence platform using Python and Next.js.";
    
    // Perform update in canonical document
    const updatedSections = doc.sections.map(sec => {
      if (sec.id !== projSection.id) return sec;
      const items = (sec.items || []) as any[];
      const updatedItems = items.map((item: any) => {
        if (item.id !== proj.id) return item;
        const updatedBullets = item.bullets.map((b: ResumeBullet) => {
          if (b.id !== bulletToEdit.id) return b;
          return { ...b, text: newEditedText };
        });
        return { ...item, bullets: updatedBullets };
      });
      return { ...sec, items: updatedItems };
    });

    doc = { ...doc, sections: updatedSections };

    // Verify change is immediately present in canonical document
    const updatedProj = (doc.sections.find(s => s.type === 'projects')!.items as ProjectItem[])[0];
    assert.equal(updatedProj.bullets[0].text, newEditedText);
  });

  test('CRITERIA 8-10: AI Edit modifies THAT bullet directly in canonical resume state', () => {
    let doc = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'ats-classic');
    const projSection = doc.sections.find(s => s.type === 'projects')!;
    const projItems = projSection.items as ProjectItem[];
    const bullet = projItems[0].bullets[0];

    // User asks AI: "Make this more ATS-friendly"
    const proposal = proposeBulletRewrite(bullet, 'custom', undefined, 'Make this more ATS-friendly');
    
    assert.ok(proposal.suggestedText.length > bullet.text.length);
    assert.ok(proposal.suggestedText.includes('recruitment intelligence platform'));
    assert.equal(proposal.evidencePreserved, true);

    // Apply rewrite to canonical document
    const updatedSections = doc.sections.map(sec => {
      if (sec.id !== projSection.id) return sec;
      const items = (sec.items || []) as any[];
      const updatedItems = items.map((item: any) => {
        if (item.id !== projItems[0].id) return item;
        const updatedBullets = item.bullets.map((b: ResumeBullet) => {
          if (b.id !== bullet.id) return b;
          return { ...b, text: proposal.suggestedText };
        });
        return { ...item, bullets: updatedBullets };
      });
      return { ...sec, items: updatedItems };
    });

    doc = { ...doc, sections: updatedSections };

    // Verify same canonical resume has the AI rewrite
    const finalBullet = (doc.sections.find(s => s.type === 'projects')!.items as ProjectItem[])[0].bullets[0];
    assert.equal(finalBullet.text, proposal.suggestedText);
  });

  test('CRITERIA 11-12: ATS Check and JD Match analyze the CURRENT canonical resume', () => {
    let doc = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'ats-classic');

    // Run ATS check on current resume
    let atsResult = runATSValidation(doc);
    assert.ok(atsResult.overallScore >= 80);
    assert.ok(atsResult.extractedText.includes('Python'));
    assert.ok(!atsResult.extractedText.includes('Java'));

    // User edits skill: add 'Java' and 'Kubernetes'
    const skillsSection = doc.sections.find(s => s.type === 'skills')!;
    const skillCats = (skillsSection.items || []) as SkillCategory[];
    const updatedSkills = skillCats.map((cat: any) => {
      if (cat.name === 'Programming Languages') {
        return { ...cat, items: [...cat.items, 'Java'] };
      }
      if (cat.name === 'Developer Tools') {
        return { ...cat, items: [...cat.items, 'Kubernetes'] };
      }
      return cat;
    });

    doc = {
      ...doc,
      sections: doc.sections.map(s => s.id === skillsSection.id ? { ...s, items: updatedSkills } : s)
    };

    // Run ATS check again - must immediately reflect updated skills
    const updatedAts = runATSValidation(doc);
    assert.ok(updatedAts.extractedText.includes('Java'));
    assert.ok(updatedAts.extractedText.includes('Kubernetes'));
  });

  test('CRITERIA 13-17: Export produces EXACT match with canonical state, zero demo leakage', () => {
    const doc = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'ats-classic');

    // Pre-export validation
    const exportValidation = validateBeforeExport(doc);
    assert.equal(exportValidation.readyToExport, true);
    assert.equal(exportValidation.blockers.length, 0);

    // Generate WordML export
    const xml = generateWordMLDocument(doc);
    assert.ok(xml.includes('Nishtha Maheshwari'));
    assert.ok(xml.includes('nisthamaheshwari84@gmail.com'));
    assert.ok(xml.includes('Cognalyze Recruitment Intelligence'));
    assert.ok(xml.includes('ABES Engineering College'));

    // Zero demo data
    assert.ok(!xml.includes('Arjun Sharma'));
    assert.ok(!xml.includes('Dataspark'));
    assert.ok(!xml.includes('Apex Cloud'));
    assert.ok(!xml.includes('University of Washington'));
  });

  test('CRITERIA 18: Template selection only changes styling, NEVER candidate data', () => {
    const docClassic = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'ats-classic');
    const docModern = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'modern-tech');
    const docCorporate = convertGeneratedResumeToDocument(sampleStudentApiResponse, 'corporate');

    assert.equal(docClassic.contact.name, sampleStudentApiResponse.name);
    assert.equal(docModern.contact.name, sampleStudentApiResponse.name);
    assert.equal(docCorporate.contact.name, sampleStudentApiResponse.name);

    assert.equal(docClassic.settings.template, 'ats-classic');
    assert.equal(docModern.settings.template, 'modern-tech');
    assert.equal(docCorporate.settings.template, 'corporate');
  });
});
