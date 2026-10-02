"use client";

import React, { useRef, useMemo } from "react";
import {
  EducationItem,
  ExperienceItem,
  ProjectItem,
  ResumeBullet,
  ResumeDocument,
  ResumeSection,
  SkillCategory,
  CertificationItem,
} from "@/lib/resume/types";
import { getTemplateCss, RESUME_TEMPLATES } from "@/lib/resume/templates";
import { InlineEditableText } from "./InlineEditableText";

interface DocumentCanvasProps {
  document: ResumeDocument;
  onUpdateDocument: (updated: ResumeDocument, isSignificantEdit?: boolean) => void;
  selectedBulletId: string | null;
  onSelectBullet: (bullet: ResumeBullet) => void;
  onSelectSection: (section: ResumeSection) => void;
  zoomScale: number;
}

export const DocumentCanvas: React.FC<DocumentCanvasProps> = ({
  document: doc,
  onUpdateDocument,
  selectedBulletId,
  onSelectBullet,
  onSelectSection,
  zoomScale,
}) => {
  const canvasRef = useRef<HTMLDivElement | null>(null);
  const templateCss = getTemplateCss(doc.settings);

  // Geometry dimensions
  const isLetter = doc.settings.paperSize === "Letter";
  const sheetWidthMm = isLetter ? 215.9 : 210;
  const sheetMinHeightMm = isLetter ? 279.4 : 297;

  // Margin calculation in px (at 96 DPI: 1mm = 3.7795px)
  const spacingMode = doc.settings.sectionSpacing || 'normal';
  const marginVmm = spacingMode === 'compact' ? 28 : spacingMode === 'spacious' ? 36 : 32;
  const totalPageHeightPx = (isLetter ? 279.4 : 297) * 3.7795;
  const usableHeightPerPage = Math.floor(totalPageHeightPx - (marginVmm * 3.7795));

  // Header update helper
  const handleUpdateContact = (field: keyof typeof doc.contact, value: string) => {
    const updated = {
      ...doc,
      contact: {
        ...doc.contact,
        [field]: value,
      },
    };
    onUpdateDocument(updated, false);
  };

  // Summary update helper
  const handleUpdateSummary = (text: string) => {
    const updated = {
      ...doc,
      summary: {
        ...doc.summary,
        text,
      },
    };
    onUpdateDocument(updated, true);
  };

  // Section title update
  const handleUpdateSectionTitle = (sectionId: string, newTitle: string) => {
    const updatedSections = doc.sections.map((sec) =>
      sec.id === sectionId ? { ...sec, title: newTitle } : sec
    );
    onUpdateDocument({ ...doc, sections: updatedSections }, false);
  };

  // Bullet text update
  const handleUpdateBulletText = (
    sectionId: string,
    itemId: string,
    bulletId: string,
    newText: string
  ) => {
    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.items) return sec;

      const updatedItems = sec.items.map((item: any) => {
        if (item.id !== itemId || !item.bullets) return item;

        const updatedBullets = item.bullets.map((b: ResumeBullet) => {
          if (b.id !== bulletId) return b;
          return {
            ...b,
            text: newText,
          };
        });
        return { ...item, bullets: updatedBullets };
      });

      return { ...sec, items: updatedItems };
    });

    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Add bullet
  const handleAddBullet = (sectionId: string, itemId: string) => {
    const newBullet: ResumeBullet = {
      id: `b-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      text: "Engineered scalable background workflows with automated testing suites.",
      evidence_ids: [],
      evidence_type: "USER_ASSERTED",
      claim_status: "USER_ASSERTED_UNVERIFIED",
      why_allowed: "User added bullet directly into document.",
      transformation_notes: "Newly created user entry.",
    };

    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.items) return sec;
      const updatedItems = sec.items.map((item: any) => {
        if (item.id !== itemId || !item.bullets) return item;
        return {
          ...item,
          bullets: [...item.bullets, newBullet],
        };
      });
      return { ...sec, items: updatedItems };
    });

    onUpdateDocument({ ...doc, sections: updatedSections }, true);
    onSelectBullet(newBullet);
  };

  // Add Project
  const handleAddProject = (sectionId: string) => {
    const newProj: ProjectItem = {
      id: `proj-${Date.now()}`,
      name: "New Technical Project",
      subtitle: "High-Performance Distributed Architecture",
      technologies: ["Python", "FastAPI", "React", "PostgreSQL"],
      githubUrl: "github.com/username/project",
      bullets: [
        {
          id: `b-${Date.now()}-1`,
          text: "Architected and implemented end-to-end full-stack platform using FastAPI and React.",
          evidence_ids: [],
          evidence_type: "USER_ASSERTED",
          claim_status: "USER_ASSERTED_UNVERIFIED",
        },
        {
          id: `b-${Date.now()}-2`,
          text: "Integrated automated background job processing with Redis queues and structured logging.",
          evidence_ids: [],
          evidence_type: "USER_ASSERTED",
          claim_status: "USER_ASSERTED_UNVERIFIED",
        },
      ],
    };

    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: [...(sec.items || []), newProj],
      };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Add Experience
  const handleAddExperience = (sectionId: string) => {
    const newExp: ExperienceItem = {
      id: `exp-${Date.now()}`,
      company: "Company Name",
      role: "Software Engineering Intern",
      location: "City, Country",
      startDate: "2024",
      endDate: "Present",
      current: true,
      technologies: ["Python", "React", "Docker"],
      bullets: [
        {
          id: `b-${Date.now()}-1`,
          text: "Developed and shipped core API endpoints and interactive web interfaces.",
          evidence_ids: [],
          evidence_type: "USER_ASSERTED",
          claim_status: "USER_ASSERTED_UNVERIFIED",
        },
        {
          id: `b-${Date.now()}-2`,
          text: "Collaborated on automated CI/CD deployment pipelines and comprehensive unit testing.",
          evidence_ids: [],
          evidence_type: "USER_ASSERTED",
          claim_status: "USER_ASSERTED_UNVERIFIED",
        },
      ],
    };

    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: [...(sec.items || []), newExp],
      };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Add Education
  const handleAddEducation = (sectionId: string) => {
    const newEdu: EducationItem = {
      id: `edu-${Date.now()}`,
      institution: "Institution Name",
      degree: "B.Tech in Computer Science & Engineering",
      location: "City, Country",
      startDate: "2024",
      endDate: "2028",
      gpa: "8.5 / 10.0",
      coursework: ["Data Structures & Algorithms", "Operating Systems", "DBMS", "Computer Networks"],
    };

    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: [...(sec.items || []), newEdu],
      };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Add Skill Category
  const handleAddSkillCategory = (sectionId: string) => {
    const newCat: SkillCategory = {
      id: `sk-${Date.now()}`,
      name: "New Category",
      items: ["Technology 1", "Technology 2", "Technology 3"],
    };

    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: [...(sec.items || []), newCat],
      };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Add Achievement
  const handleAddAchievement = (sectionId: string) => {
    const newAch = "Secured top standing in national competitive programming challenge or technical hackathon.";
    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: [...(sec.items || []), newAch],
      };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Add Certification
  const handleAddCertification = (sectionId: string) => {
    const newCert: CertificationItem = {
      id: `cert-${Date.now()}`,
      name: "Certification Name",
      issuer: "Issuing Organization",
      date: "2024",
    };
    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId) return sec;
      return {
        ...sec,
        items: [...(sec.items || []), newCert],
      };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Delete item from section
  const handleDeleteItem = (sectionId: string, itemId: string) => {
    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.items) return sec;
      return {
        ...sec,
        items: sec.items.filter((item: any) => (typeof item === 'string' ? true : item.id !== itemId)),
      };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Delete bullet
  const handleDeleteBullet = (sectionId: string, itemId: string, bulletId: string) => {
    const updatedSections = doc.sections.map((sec) => {
      if (sec.id !== sectionId || !sec.items) return sec;
      const updatedItems = sec.items.map((item: any) => {
        if (item.id !== itemId || !item.bullets) return item;
        return {
          ...item,
          bullets: item.bullets.filter((b: ResumeBullet) => b.id !== bulletId),
        };
      });
      return { ...sec, items: updatedItems };
    });
    onUpdateDocument({ ...doc, sections: updatedSections }, true);
  };

  // Visible sections in order
  const visibleSections = [...doc.sections]
    .filter((s) => s.visible)
    .sort((a, b) => a.order - b.order);

  // Height estimation helpers calibrated to typography
  const getHeaderHeight = () => {
    let h = 42;
    if (doc.contact.title) h += 24;
    if (doc.contact.email || doc.contact.phone || doc.contact.location || doc.contact.linkedin || doc.contact.github) h += 26;
    h += 20;
    return h;
  };

  const getHeadingHeight = () => 38;

  const getSummaryHeight = () => {
    const textLen = doc.summary?.text?.length || 0;
    const lines = Math.max(1, Math.ceil(textLen / 75));
    return lines * 20 + 16;
  };

  const getEduItemHeight = (item: EducationItem) => {
    let h = 32;
    if (item.coursework && item.coursework.length > 0) {
      const lines = Math.max(1, Math.ceil(item.coursework.join(", ").length / 75));
      h += lines * 20 + 8;
    }
    h += 12;
    return h;
  };

  const getSkillItemHeight = (item: SkillCategory) => {
    const totalChars = (item.name?.length || 0) + 3 + (item.items?.join(", ").length || 0);
    const lines = Math.max(1, Math.ceil(totalChars / 75));
    return lines * 22 + 6;
  };

  const getProjectItemHeight = (item: ProjectItem) => {
    let h = 32;
    if (item.bullets && Array.isArray(item.bullets)) {
      for (const b of item.bullets) {
        const lines = Math.max(1, Math.ceil((b.text.length + 5) / 72));
        h += lines * 20 + 6;
      }
    }
    h += 12;
    return h;
  };

  const getExpItemHeight = (item: ExperienceItem) => {
    let h = 32;
    if (item.bullets && Array.isArray(item.bullets)) {
      for (const b of item.bullets) {
        const lines = Math.max(1, Math.ceil((b.text.length + 5) / 72));
        h += lines * 20 + 6;
      }
    }
    h += 12;
    return h;
  };

  const getAchievementItemHeight = (item: any) => {
    const str = typeof item === 'string' ? item : (item?.text || item?.title || '');
    const lines = Math.max(1, Math.ceil((str.length + 5) / 72));
    return lines * 20 + 6;
  };

  const getCertItemHeight = (_item: CertificationItem) => 30;

  const getBulletHeight = (b: ResumeBullet | string) => {
    const text = typeof b === 'string' ? b : (b?.text || '');
    const lines = Math.max(1, Math.ceil((text.length + 5) / 72));
    return lines * 20 + 6;
  };

  const getItemHeight = (secType: string, item: any): number => {
    if (secType === 'education') return getEduItemHeight(item);
    if (secType === 'skills') return getSkillItemHeight(item);
    if (secType === 'projects') return getProjectItemHeight(item);
    if (secType === 'experience') return getExpItemHeight(item);
    if (secType === 'achievements') return getAchievementItemHeight(item);
    if (secType === 'certifications') return getCertItemHeight(item);
    return 34;
  };

  interface PageSectionSlice {
    section: ResumeSection;
    showHeading: boolean;
    isContinuation: boolean;
    items: any[];
    isLastSlice: boolean;
  }

  interface PageSlice {
    pageNumber: number;
    hasHeader: boolean;
    sections: PageSectionSlice[];
  }

  // Partition document content across A4 pages to prevent overflow (memoized to eliminate lag)
  const pages = useMemo<PageSlice[]>(() => {
    const pageList: PageSlice[] = [];
    let curP: PageSlice = { pageNumber: 1, hasHeader: true, sections: [] };
    let curH = getHeaderHeight();

    const startNewPage = () => {
      pageList.push(curP);
      curP = { pageNumber: pageList.length + 1, hasHeader: false, sections: [] };
      curH = 0;
    };

    for (const sec of visibleSections) {
      if (sec.type === 'summary') {
        const summaryH = getHeadingHeight() + getSummaryHeight();
        if (curH + summaryH > usableHeightPerPage && curH > 0) {
          startNewPage();
        }
        curP.sections.push({
          section: sec,
          showHeading: true,
          isContinuation: false,
          items: [],
          isLastSlice: true,
        });
        curH += summaryH;
        continue;
      }

      const items = sec.items || [];
      if (items.length === 0) {
        const headingH = getHeadingHeight();
        if (curH + headingH > usableHeightPerPage && curH > 0) {
          startNewPage();
        }
        curP.sections.push({
          section: sec,
          showHeading: true,
          isContinuation: false,
          items: [],
          isLastSlice: true,
        });
        curH += headingH;
        continue;
      }

      const headingH = getHeadingHeight();
      // Rule 15: Prevent section headings from being stranded at the bottom of the page
      if (curH + headingH + 36 > usableHeightPerPage && curH > 0) {
        startNewPage();
      }

      let isFirstSliceForSec = true;
      curH += headingH;

      for (let i = 0; i < items.length; i++) {
        const item = items[i];

        // Check if item has bullets that can be split across pages (projects, experience)
        if ((sec.type === 'projects' || sec.type === 'experience') && typeof item === 'object' && item !== null && 'bullets' in item && Array.isArray((item as any).bullets) && (item as any).bullets.length > 0) {
          const itemHeaderH = 32;
          const bullets: ResumeBullet[] = (item as any).bullets;
          let bulletIdx = 0;

          // If not even the header + first bullet fits on curPage, and page has other content, start new page
          const firstBulletH = getBulletHeight(bullets[0]);
          if (curH + itemHeaderH + firstBulletH > usableHeightPerPage && curH > 0) {
            startNewPage();
            isFirstSliceForSec = false;
          }

          while (bulletIdx < bullets.length) {
            const isItemContinuation = bulletIdx > 0;
            const currentHeaderH = isItemContinuation ? 22 : itemHeaderH;

            // If on current page we have no room for even 1 bullet, start a new page
            if (curH + currentHeaderH + getBulletHeight(bullets[bulletIdx]) > usableHeightPerPage && curH > 0) {
              startNewPage();
              isFirstSliceForSec = false;
            }

            const fittingBullets: ResumeBullet[] = [];
            let sliceH = currentHeaderH;

            while (bulletIdx < bullets.length) {
              const b = bullets[bulletIdx];
              const bH = getBulletHeight(b);
              if (curH + sliceH + bH <= usableHeightPerPage || fittingBullets.length === 0) {
                fittingBullets.push(b);
                sliceH += bH;
                bulletIdx++;
              } else {
                break;
              }
            }

            sliceH += 12; // item bottom margin
            curH += sliceH;

            // Push into curPage's section slice
            let targetSectionSlice = curP.sections.find(
              s => s.section.id === sec.id && s.isContinuation === !isFirstSliceForSec
            );
            if (!targetSectionSlice) {
              targetSectionSlice = {
                section: sec,
                showHeading: isFirstSliceForSec,
                isContinuation: !isFirstSliceForSec,
                items: [],
                isLastSlice: false,
              };
              curP.sections.push(targetSectionSlice);
            }

            targetSectionSlice.items.push({
              ...(item as any),
              isContinuation: isItemContinuation,
              bullets: fittingBullets,
            });

            isFirstSliceForSec = false;

            if (bulletIdx < bullets.length) {
              startNewPage();
            }
          }
        } else {
          // Atomic item (education, skills, achievements, certifications)
          const itemH = getItemHeight(sec.type, item);
          if (curH + itemH > usableHeightPerPage && curH > 0) {
            startNewPage();
            isFirstSliceForSec = false;
          }

          let targetSectionSlice = curP.sections.find(
            s => s.section.id === sec.id && s.isContinuation === !isFirstSliceForSec
          );
          if (!targetSectionSlice) {
            targetSectionSlice = {
              section: sec,
              showHeading: isFirstSliceForSec,
              isContinuation: !isFirstSliceForSec,
              items: [],
              isLastSlice: false,
            };
            curP.sections.push(targetSectionSlice);
          }

          targetSectionSlice.items.push(item);
          curH += itemH;
          isFirstSliceForSec = false;
        }
      }
    }

    // Mark isLastSlice for the last slice of each section
    visibleSections.forEach(sec => {
      let lastSlice: PageSectionSlice | null = null;
      for (const page of pageList) {
        for (const slice of page.sections) {
          if (slice.section.id === sec.id) {
            lastSlice = slice;
          }
        }
      }
      if (lastSlice) {
        (lastSlice as PageSectionSlice).isLastSlice = true;
      }
    });

    if (curP.sections.length > 0 || pageList.length === 0) {
      visibleSections.forEach(sec => {
        const slice = curP.sections.find(s => s.section.id === sec.id);
        if (slice) slice.isLastSlice = true;
      });
      pageList.push(curP);
    }

    return pageList;
  }, [visibleSections, doc.settings, doc.contact, doc.summary, usableHeightPerPage]);

  // Render Header Component
  const renderHeader = () => (
    <header className="resume-header">
      <InlineEditableText
        as="h1"
        className="resume-name"
        value={doc.contact.name}
        onChange={(val) => handleUpdateContact("name", val)}
        placeholder="Your Full Name"
      />

      {doc.contact.title !== undefined && (
        <InlineEditableText
          as="div"
          className="resume-title"
          value={doc.contact.title || ""}
          onChange={(val) => handleUpdateContact("title", val)}
          placeholder="Computer Science & Engineering | Specialization"
        />
      )}

      <div className="resume-contact-bar">
        {doc.contact.email && (
          <span className="contact-item">
            <InlineEditableText
              value={doc.contact.email}
              onChange={(val) => handleUpdateContact("email", val)}
              placeholder="email@example.com"
            />
          </span>
        )}
        {doc.contact.phone && (
          <>
            <span className="contact-divider">|</span>
            <span className="contact-item">
              <InlineEditableText
                value={doc.contact.phone}
                onChange={(val) => handleUpdateContact("phone", val)}
                placeholder="+91 XXXXX XXXXX"
              />
            </span>
          </>
        )}
        {doc.contact.location && (
          <>
            <span className="contact-divider">|</span>
            <span className="contact-item">
              <InlineEditableText
                value={doc.contact.location}
                onChange={(val) => handleUpdateContact("location", val)}
                placeholder="City, Country"
              />
            </span>
          </>
        )}
        {doc.contact.linkedin && (
          <>
            <span className="contact-divider">|</span>
            <span className="contact-item">
              <InlineEditableText
                value={doc.contact.linkedin}
                onChange={(val) => handleUpdateContact("linkedin", val)}
                placeholder="linkedin.com/in/username"
              />
            </span>
          </>
        )}
        {doc.contact.github && (
          <>
            <span className="contact-divider">|</span>
            <span className="contact-item">
              <InlineEditableText
                value={doc.contact.github}
                onChange={(val) => handleUpdateContact("github", val)}
                placeholder="github.com/username"
              />
            </span>
          </>
        )}
        {doc.contact.portfolio && (
          <>
            <span className="contact-divider">|</span>
            <span className="contact-item">
              <InlineEditableText
                value={doc.contact.portfolio}
                onChange={(val) => handleUpdateContact("portfolio", val)}
                placeholder="portfolio.dev"
              />
            </span>
          </>
        )}
      </div>
    </header>
  );

  // Render a section slice on its assigned page
  const renderSectionSlice = (slice: PageSectionSlice) => {
    const sec = slice.section;
    return (
      <section
        key={`${sec.id}-${slice.isContinuation ? 'cont' : 'head'}`}
        className={`resume-section section-${sec.type}`}
        onClick={() => onSelectSection(sec)}
      >
        {/* Section Header with Overleaf-style Border */}
        {slice.showHeading && (
          <div className="section-heading-container">
            <InlineEditableText
              as="h2"
              className="section-heading"
              value={sec.title}
              onChange={(val) => handleUpdateSectionTitle(sec.id, val)}
              placeholder="SECTION TITLE"
            />
          </div>
        )}

        {/* 1. Summary */}
        {sec.type === "summary" && (
          <div className="section-body summary-body">
            <InlineEditableText
              as="p"
              multiline
              value={doc.summary?.text || ""}
              onChange={handleUpdateSummary}
              placeholder="Concise technical summary highlighting core focus, demonstrable capabilities, and target specialization..."
            />
          </div>
        )}

        {/* 2. Education */}
        {sec.type === "education" && (
          <div className="section-body education-list">
            {(slice.items as EducationItem[]).map((edu) => (
              <div key={edu.id} className="education-item resume-item">
                <div className="item-header">
                  <div className="item-left">
                    <InlineEditableText
                      as="span"
                      className="item-degree"
                      value={edu.degree}
                      onChange={(newDeg) => {
                        const updated = doc.sections.map((s) => {
                          if (s.id !== sec.id) return s;
                          return {
                            ...s,
                            items: (s.items as EducationItem[]).map((i) =>
                              i.id === edu.id ? { ...i, degree: newDeg } : i
                            ),
                          };
                        });
                        onUpdateDocument({ ...doc, sections: updated }, true);
                      }}
                      placeholder="Degree / Program (e.g. B.Tech in CSE)"
                    />
                    <span className="role-company-separator">, </span>
                    <InlineEditableText
                      as="span"
                      className="item-institution"
                      value={edu.institution}
                      onChange={(newInst) => {
                        const updated = doc.sections.map((s) => {
                          if (s.id !== sec.id) return s;
                          return {
                            ...s,
                            items: (s.items as EducationItem[]).map((i) =>
                              i.id === edu.id ? { ...i, institution: newInst } : i
                            ),
                          };
                        });
                        onUpdateDocument({ ...doc, sections: updated }, true);
                      }}
                      placeholder="Institution Name, Location"
                    />
                    {edu.gpa && (
                      <span className="education-gpa">
                        {" (CGPA: "}
                        <InlineEditableText
                          value={edu.gpa}
                          onChange={(newGpa) => {
                            const updated = doc.sections.map((s) => {
                              if (s.id !== sec.id) return s;
                              return {
                                ...s,
                                items: (s.items as EducationItem[]).map((i) =>
                                  i.id === edu.id ? { ...i, gpa: newGpa } : i
                                ),
                              };
                            });
                            onUpdateDocument({ ...doc, sections: updated }, false);
                          }}
                        />
                        {")"}
                      </span>
                    )}
                  </div>
                  <div className="item-right">
                    <span className="item-dates">
                      <InlineEditableText
                        value={edu.endDate || edu.expectedGraduation || "2024 – 2028"}
                        onChange={(val) => {
                          const updated = doc.sections.map((s) => {
                            if (s.id !== sec.id) return s;
                            return {
                              ...s,
                              items: (s.items as EducationItem[]).map((i) =>
                                i.id === edu.id ? { ...i, endDate: val } : i
                              ),
                            };
                          });
                          onUpdateDocument({ ...doc, sections: updated }, false);
                        }}
                      />
                    </span>
                    <button
                      type="button"
                      className="no-print item-delete-btn"
                      title="Delete education entry"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteItem(sec.id, edu.id);
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </div>

                {edu.coursework && edu.coursework.length > 0 && (
                  <div className="education-coursework">
                    <span className="coursework-label">Relevant Coursework: </span>
                    <InlineEditableText
                      value={edu.coursework.join(", ")}
                      style={{ display: "inline", overflowWrap: "break-word" }}
                      onChange={(newCourseStr) => {
                        const newCourse = newCourseStr
                          .split(",")
                          .map((c) => c.trim())
                          .filter(Boolean);
                        const updated = doc.sections.map((s) => {
                          if (s.id !== sec.id) return s;
                          return {
                            ...s,
                            items: (s.items as EducationItem[]).map((i) =>
                              i.id === edu.id ? { ...i, coursework: newCourse } : i
                            ),
                          };
                        });
                        onUpdateDocument({ ...doc, sections: updated }, false);
                      }}
                    />
                  </div>
                )}
              </div>
            ))}
            {slice.isLastSlice && (
              <div className="no-print add-item-bar">
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() => handleAddEducation(sec.id)}
                >
                  + Add Education
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3. Technical Skills */}
        {sec.type === "skills" && (
          <div className="section-body skills-list">
            {(slice.items as SkillCategory[]).map((sk) => (
              <div key={sk.id} className="skill-category-row">
                <span className="skill-category-name">
                  <InlineEditableText
                    value={sk.name}
                    onChange={(newName) => {
                      const updated = doc.sections.map((s) => {
                        if (s.id !== sec.id) return s;
                        return {
                          ...s,
                          items: (s.items as SkillCategory[]).map((i) =>
                            i.id === sk.id ? { ...i, name: newName } : i
                          ),
                        };
                      });
                      onUpdateDocument({ ...doc, sections: updated }, false);
                    }}
                  />
                  {": "}
                </span>
                <span className="skill-category-items">
                  <InlineEditableText
                    value={Array.isArray(sk.items) ? sk.items.join(", ") : ""}
                    style={{ display: "inline", overflowWrap: "break-word" }}
                    onChange={(newItemsStr) => {
                      const items = newItemsStr
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean);
                      const updated = doc.sections.map((s) => {
                        if (s.id !== sec.id) return s;
                        return {
                          ...s,
                          items: (s.items as SkillCategory[]).map((i) =>
                            i.id === sk.id ? { ...i, items } : i
                          ),
                        };
                      });
                      onUpdateDocument({ ...doc, sections: updated }, false);
                    }}
                  />
                </span>
              </div>
            ))}
            {slice.isLastSlice && (
              <div className="no-print add-item-bar">
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() => handleAddSkillCategory(sec.id)}
                >
                  + Add Skill Category
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. Technical Projects */}
        {sec.type === "projects" && (
          <div className="section-body projects-list">
            {(slice.items as ProjectItem[]).map((proj) => (
              <div key={`${proj.id}-${(proj as any).isContinuation ? 'cont' : 'main'}`} className="project-item resume-item">
                <div className="item-header">
                  <div className="item-left">
                    <InlineEditableText
                      as="span"
                      className="item-name"
                      value={proj.name}
                      onChange={(newName) => {
                        const updated = doc.sections.map((s) => {
                          if (s.id !== sec.id) return s;
                          return {
                            ...s,
                            items: (s.items as ProjectItem[]).map((i) =>
                              i.id === proj.id ? { ...i, name: newName } : i
                            ),
                          };
                        });
                        onUpdateDocument({ ...doc, sections: updated }, true);
                      }}
                      placeholder="Project Name"
                    />
                    {(proj as any).isContinuation && (
                      <span style={{ fontSize: "9pt", color: "#6b7280", fontStyle: "italic", marginLeft: 4 }}>
                        (Continued)
                      </span>
                    )}
                    {!(proj as any).isContinuation && proj.technologies && proj.technologies.length > 0 && (
                      <span className="project-tech-line">
                        {" | "}
                        <InlineEditableText
                          value={proj.technologies.join(", ")}
                          style={{ overflowWrap: "break-word" }}
                          onChange={(newTechStr) => {
                            const newTech = newTechStr
                              .split(",")
                              .map((t) => t.trim())
                              .filter(Boolean);
                            const updated = doc.sections.map((s) => {
                              if (s.id !== sec.id) return s;
                              return {
                                ...s,
                                items: (s.items as ProjectItem[]).map((i) =>
                                  i.id === proj.id ? { ...i, technologies: newTech } : i
                                ),
                              };
                            });
                            onUpdateDocument({ ...doc, sections: updated }, false);
                          }}
                        />
                      </span>
                    )}
                  </div>
                  <div className="item-right">
                    {!(proj as any).isContinuation && proj.githubUrl && (
                      <span className="project-link">
                        <InlineEditableText
                          value={proj.githubUrl}
                          onChange={(newUrl) => {
                            const updated = doc.sections.map((s) => {
                              if (s.id !== sec.id) return s;
                              return {
                                ...s,
                                items: (s.items as ProjectItem[]).map((i) =>
                                  i.id === proj.id ? { ...i, githubUrl: newUrl } : i
                                ),
                              };
                            });
                            onUpdateDocument({ ...doc, sections: updated }, false);
                          }}
                        />
                      </span>
                    )}
                    {!(proj as any).isContinuation && (
                      <button
                        type="button"
                        className="no-print item-delete-btn"
                        title="Delete this project"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(sec.id, proj.id);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Bullets with true hanging indent and overflow-containment */}
                <ul className="bullet-list">
                  {proj.bullets.map((b) => {
                    const isSelected = selectedBulletId === b.id;
                    return (
                      <li
                        key={b.id}
                        className={`bullet-item ${isSelected ? "bullet-selected" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBullet(b);
                        }}
                      >
                        <span className="bullet-content">
                          <InlineEditableText
                            multiline
                            value={b.text}
                            onChange={(newText) =>
                              handleUpdateBulletText(sec.id, proj.id, b.id, newText)
                            }
                          />
                        </span>

                        <button
                          type="button"
                          className="no-print bullet-delete-btn"
                          title="Delete bullet"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBullet(sec.id, proj.id, b.id);
                          }}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="no-print add-bullet-wrap">
                  <button
                    type="button"
                    className="add-bullet-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddBullet(sec.id, proj.id);
                    }}
                  >
                    + Add Bullet
                  </button>
                </div>
              </div>
            ))}
            {slice.isLastSlice && (
              <div className="no-print add-item-bar">
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() => handleAddProject(sec.id)}
                >
                  + Add Project
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. Experience */}
        {sec.type === "experience" && (
          <div className="section-body experience-list">
            {(slice.items as ExperienceItem[]).map((exp) => (
              <div key={`${exp.id}-${(exp as any).isContinuation ? 'cont' : 'main'}`} className="experience-item resume-item">
                <div className="item-header">
                  <div className="item-left">
                    <InlineEditableText
                      as="span"
                      className="item-role"
                      value={exp.role}
                      onChange={(newRole) => {
                        const updated = doc.sections.map((s) => {
                          if (s.id !== sec.id) return s;
                          return {
                            ...s,
                            items: (s.items as ExperienceItem[]).map((i) =>
                              i.id === exp.id ? { ...i, role: newRole } : i
                            ),
                          };
                        });
                        onUpdateDocument({ ...doc, sections: updated }, true);
                      }}
                      placeholder="Job Title / Role"
                    />
                    <span className="role-company-separator">, </span>
                    <InlineEditableText
                      as="span"
                      className="item-company"
                      value={exp.company}
                      onChange={(newCo) => {
                        const updated = doc.sections.map((s) => {
                          if (s.id !== sec.id) return s;
                          return {
                            ...s,
                            items: (s.items as ExperienceItem[]).map((i) =>
                              i.id === exp.id ? { ...i, company: newCo } : i
                            ),
                          };
                        });
                        onUpdateDocument({ ...doc, sections: updated }, true);
                      }}
                      placeholder="Company Name"
                    />
                    {(exp as any).isContinuation && (
                      <span style={{ fontSize: "9pt", color: "#6b7280", fontStyle: "italic", marginLeft: 4 }}>
                        (Continued)
                      </span>
                    )}
                  </div>
                  <div className="item-right">
                    {!(exp as any).isContinuation && (
                      <span className="item-dates">
                        <InlineEditableText
                          value={exp.startDate || "2024"}
                          onChange={(val) => {
                            const updated = doc.sections.map((s) => {
                              if (s.id !== sec.id) return s;
                              return {
                                ...s,
                                items: (s.items as ExperienceItem[]).map((i) =>
                                  i.id === exp.id ? { ...i, startDate: val } : i
                                ),
                              };
                            });
                            onUpdateDocument({ ...doc, sections: updated }, false);
                          }}
                        />
                        {" – "}
                        <InlineEditableText
                          value={exp.current ? "Present" : exp.endDate || "2024"}
                          onChange={(val) => {
                            const updated = doc.sections.map((s) => {
                              if (s.id !== sec.id) return s;
                              return {
                                ...s,
                                items: (s.items as ExperienceItem[]).map((i) =>
                                  i.id === exp.id ? { ...i, endDate: val, current: val.toLowerCase().includes("present") } : i
                                ),
                              };
                            });
                            onUpdateDocument({ ...doc, sections: updated }, false);
                          }}
                        />
                      </span>
                    )}
                    {!(exp as any).isContinuation && (
                      <button
                        type="button"
                        className="no-print item-delete-btn"
                        title="Delete this role"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteItem(sec.id, exp.id);
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <ul className="bullet-list">
                  {exp.bullets.map((b) => {
                    const isSelected = selectedBulletId === b.id;
                    return (
                      <li
                        key={b.id}
                        className={`bullet-item ${isSelected ? "bullet-selected" : ""}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectBullet(b);
                        }}
                      >
                        <span className="bullet-content">
                          <InlineEditableText
                            multiline
                            value={b.text}
                            onChange={(newText) =>
                              handleUpdateBulletText(sec.id, exp.id, b.id, newText)
                            }
                          />
                        </span>

                        <button
                          type="button"
                          className="no-print bullet-delete-btn"
                          title="Delete bullet"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteBullet(sec.id, exp.id, b.id);
                          }}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>

                <div className="no-print add-bullet-wrap">
                  <button
                    type="button"
                    className="add-bullet-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAddBullet(sec.id, exp.id);
                    }}
                  >
                    + Add Bullet
                  </button>
                </div>
              </div>
            ))}
            {slice.isLastSlice && (
              <div className="no-print add-item-bar">
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() => handleAddExperience(sec.id)}
                >
                  + Add Experience
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. Achievements & Hackathons */}
        {sec.type === "achievements" && (
          <div className="section-body achievements-list">
            {(slice.items as any[]).map((ach, idx) => {
              const textVal = typeof ach === 'string' ? ach : (ach.text || ach.title || '');
              return (
                <div key={idx} className="achievement-item">
                  <InlineEditableText
                    multiline
                    value={textVal}
                    onChange={(newAch) => {
                      const updated = doc.sections.map((s) => {
                        if (s.id !== sec.id) return s;
                        const nextItems = [...((s.items || []) as any[])];
                        nextItems[idx] = typeof ach === 'object' ? { ...ach, text: newAch } : newAch;
                        return { ...s, items: nextItems };
                      });
                      onUpdateDocument({ ...doc, sections: updated }, true);
                    }}
                  />
                </div>
              );
            })}
            {slice.isLastSlice && (
              <div className="no-print add-item-bar">
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() => handleAddAchievement(sec.id)}
                >
                  + Add Achievement
                </button>
              </div>
            )}
          </div>
        )}

        {/* 7. Certifications */}
        {sec.type === "certifications" && (
          <div className="section-body certifications-list">
            {(slice.items as CertificationItem[]).map((cert) => (
              <div key={cert.id} className="certification-item">
                <span style={{ fontWeight: 700 }}>
                  <InlineEditableText
                    value={cert.name}
                    onChange={(newVal) => {
                      const updated = doc.sections.map((s) => {
                        if (s.id !== sec.id) return s;
                        return {
                          ...s,
                          items: (s.items as CertificationItem[]).map((c) =>
                            c.id === cert.id ? { ...c, name: newVal } : c
                          ),
                        };
                      });
                      onUpdateDocument({ ...doc, sections: updated }, true);
                    }}
                  />
                </span>
                {" — "}
                <span>
                  <InlineEditableText
                    value={cert.issuer}
                    onChange={(newVal) => {
                      const updated = doc.sections.map((s) => {
                        if (s.id !== sec.id) return s;
                        return {
                          ...s,
                          items: (s.items as CertificationItem[]).map((c) =>
                            c.id === cert.id ? { ...c, issuer: newVal } : c
                          ),
                        };
                      });
                      onUpdateDocument({ ...doc, sections: updated }, false);
                    }}
                  />
                </span>
                {cert.date && (
                  <span style={{ color: "#6b7280" }}>
                    {" ("}
                    <InlineEditableText
                      value={cert.date}
                      onChange={(newVal) => {
                        const updated = doc.sections.map((s) => {
                          if (s.id !== sec.id) return s;
                          return {
                            ...s,
                            items: (s.items as CertificationItem[]).map((c) =>
                              c.id === cert.id ? { ...c, date: newVal } : c
                            ),
                          };
                        });
                        onUpdateDocument({ ...doc, sections: updated }, false);
                      }}
                    />
                    {")"}
                  </span>
                )}
              </div>
            ))}
            {slice.isLastSlice && (
              <div className="no-print add-item-bar">
                <button
                  type="button"
                  className="add-sub-btn"
                  onClick={() => handleAddCertification(sec.id)}
                >
                  + Add Certification
                </button>
              </div>
            )}
          </div>
        )}
      </section>
    );
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "32px 16px 80px 16px",
        overflowX: "auto",
        minHeight: "100%",
      }}
    >
      {/* Template CSS Stylesheet */}
      <style dangerouslySetInnerHTML={{ __html: templateCss }} />

      {/* Floating Canvas Sheet(s) — Overleaf / LaTeX Proportions */}
      <div
        id="resume-live-canvas"
        ref={canvasRef}
        className={`resume-document template-${doc.settings.template}`}
        style={{
          transform: `scale(${zoomScale})`,
          transformOrigin: "top center",
          transition: "transform 0.15s ease",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 28,
        }}
      >
        {pages.map((page, pageIdx) => (
          <React.Fragment key={`page-${page.pageNumber}`}>
            {pageIdx > 0 && (
              <div
                className="no-print resume-page-break-indicator"
                style={{
                  display: "flex",
                  alignItems: "center",
                  width: `${sheetWidthMm}mm`,
                  margin: "4px auto",
                  color: "#94A3B8",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.05em",
                  userSelect: "none",
                }}
              >
                <span>PAGE {page.pageNumber - 1} OF {pages.length}</span>
                <span
                  style={{
                    flex: 1,
                    height: "1px",
                    backgroundColor: "#CBD5E1",
                    margin: "0 14px",
                    borderTop: "1px dashed #94A3B8",
                  }}
                />
                <span>PAGE {page.pageNumber} OF {pages.length}</span>
              </div>
            )}

            <div
              className={`resume-page-sheet template-${doc.settings.template}`}
              data-page={page.pageNumber}
              style={{
                width: `${sheetWidthMm}mm`,
                minHeight: `${sheetMinHeightMm}mm`,
                backgroundColor: "#ffffff",
                color: "#111827",
                boxShadow: "0 20px 45px -10px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(0, 0, 0, 0.08)",
                borderRadius: "2px",
                boxSizing: "border-box",
                position: "relative",
                margin: "0 auto",
                overflow: "visible",
              }}
            >
              {page.hasHeader && renderHeader()}

              {page.sections.map((slice) => renderSectionSlice(slice))}
            </div>
          </React.Fragment>
        ))}
      </div>

      <style jsx>{`
        .bullet-item {
          position: relative;
          display: flex;
          align-items: baseline;
          margin-bottom: 2.5px;
          cursor: text;
          max-width: 100%;
          box-sizing: border-box;
        }
        .bullet-content {
          flex: 1;
          min-width: 0;
          max-width: 100%;
          overflow-wrap: break-word;
          word-break: break-word;
        }
        .bullet-selected {
          background-color: rgba(59, 130, 246, 0.06);
          outline: 1.5px solid rgba(59, 130, 246, 0.4);
          outline-offset: 1px;
          border-radius: 2px;
        }
        .bullet-delete-btn,
        .item-delete-btn {
          opacity: 0;
          margin-left: 6px;
          background: transparent;
          border: none;
          color: #ef4444;
          cursor: pointer;
          font-size: 10px;
          padding: 1px 4px;
          border-radius: 3px;
          transition: opacity 0.15s ease, background-color 0.15s ease;
        }
        .bullet-item:hover .bullet-delete-btn,
        .resume-item:hover .item-delete-btn {
          opacity: 0.7;
        }
        .bullet-delete-btn:hover,
        .item-delete-btn:hover {
          opacity: 1;
          background-color: #fee2e2;
        }
        .add-bullet-wrap {
          margin-top: 3px;
          margin-bottom: 6px;
        }
        .add-bullet-btn, .add-sub-btn {
          background: transparent;
          border: 1px dashed #cbd5e1;
          color: #64748b;
          font-size: 10px;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 4px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .add-bullet-btn:hover, .add-sub-btn:hover {
          border-color: #3b82f6;
          color: #2563eb;
          background-color: #eff6ff;
        }
        .add-item-bar {
          margin-top: 6px;
        }
      `}</style>
    </div>
  );
};
