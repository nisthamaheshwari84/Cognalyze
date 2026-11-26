"use client";

import React, { useState, useMemo } from "react";
import {
  TAXONOMY_SUBJECTS,
  TaxonomySubject,
  TaxonomyTopic,
  getAllCurriculumTopicsFlat,
  getTaxonomyTopicById,
} from "@/lib/skills/ai-data/master-curriculum-taxonomy";
import {
  generateCanonicalNotesForTopic,
  generatePersonalWeaknessNotes,
  CanonicalTopicNote,
  PersonalWeaknessNote,
} from "@/lib/skills/ai-data/intelligent-notes-engine";
import type { TopicMasteryRecord } from "@/lib/skills/ai-data/types";
import MarkdownRenderer from "@/components/ui/MarkdownRenderer";

interface GlobalNotesLibraryProps {
  initialTopicId?: string;
  candidateId?: string;
  topicMasteryMap?: Record<string, TopicMasteryRecord>;
  onNavigateToTopic?: (topicId: string) => void;
  onOpenPractice?: (topicId: string) => void;
}

export type NoteType =
  | "canonical"
  | "weakness"
  | "cheatsheet"
  | "quick_revision"
  | "engineering"
  | "workbook";

export default function GlobalNotesLibrary({
  initialTopicId = "py-01-intro",
  candidateId = "student-demo",
  topicMasteryMap = {},
  onNavigateToTopic,
  onOpenPractice,
}: GlobalNotesLibraryProps) {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("subj_python");
  const [selectedTopicId, setSelectedTopicId] = useState<string>(initialTopicId);
  const [activeNoteType, setActiveNoteType] = useState<NoteType>("canonical");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const currentSubject = useMemo(() => {
    return TAXONOMY_SUBJECTS.find((s) => s.id === selectedSubjectId) || TAXONOMY_SUBJECTS[0];
  }, [selectedSubjectId]);

  // All topics for current subject
  const subjectTopics = useMemo(() => {
    const list: TaxonomyTopic[] = [];
    for (const mod of currentSubject.modules || []) {
      for (const top of mod.topics || []) {
        list.push(top);
      }
    }
    return list;
  }, [currentSubject]);

  const activeTopic = useMemo(() => {
    return (
      getTaxonomyTopicById(selectedTopicId) ||
      subjectTopics[0] ||
      getAllCurriculumTopicsFlat()[0]
    );
  }, [selectedTopicId, subjectTopics]);

  // Notes data
  const canonicalNotes = useMemo(() => {
    return generateCanonicalNotesForTopic(activeTopic.id, "AI Engineer");
  }, [activeTopic.id]);

  const weaknessNotes = useMemo(() => {
    return generatePersonalWeaknessNotes(candidateId, topicMasteryMap);
  }, [candidateId, topicMasteryMap]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col min-h-[calc(100vh-120px)] bg-[#F6F5F1] text-stone-900 font-sans">
      {/* ── TOP HEADER BAR ── */}
      <div className="bg-white border-b border-[#E4E1DA] px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-base">📚</span>
            <h1 className="text-base font-bold text-[#162A43] tracking-tight">
              Intelligent Notes &amp; Technical Revision Library
            </h1>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded font-bold">
              6 Canonical Note Formats
            </span>
          </div>
          <p className="text-[11px] text-stone-500">
            Subject → Topic → Subtopic structure. Source-verified formulas, mental models, code patterns, and personal weaknesses.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-xl border border-[#E4E1DA] hover:border-stone-400 bg-white text-xs font-semibold text-stone-700 transition flex items-center gap-1.5 shadow-sm"
          >
            <span>🖨 Export / Print PDF</span>
          </button>
          {onOpenPractice && (
            <button
              onClick={() => onOpenPractice(activeTopic.id)}
              className="px-4 py-2 bg-[#356AE6] hover:bg-[#2855C7] text-white text-xs font-bold rounded-xl shadow-sm transition"
            >
              Practise This Topic →
            </button>
          )}
        </div>
      </div>

      {/* ── MAIN 2-PANE WORKSPACE ── */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* LEFT COLUMN: Subject & Topic Navigation */}
        <div className="w-full lg:w-72 border-r border-[#E4E1DA] bg-white p-4 flex flex-col gap-4 shrink-0 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Subject Selector */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1">
              Subject ({TAXONOMY_SUBJECTS.length})
            </label>
            <select
              value={selectedSubjectId}
              onChange={(e) => {
                setSelectedSubjectId(e.target.value);
                const subj = TAXONOMY_SUBJECTS.find((s) => s.id === e.target.value);
                if (subj && subj.modules?.[0]?.topics?.[0]) {
                  setSelectedTopicId(subj.modules[0].topics[0].id);
                }
              }}
              className="w-full p-2 text-xs rounded-lg border border-[#E4E1DA] bg-white text-stone-800 font-semibold"
            >
              {TAXONOMY_SUBJECTS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.icon} {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Topics List */}
          <div>
            <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider block mb-1.5">
              Topics ({subjectTopics.length})
            </label>
            <div className="space-y-1 max-h-[450px] overflow-y-auto pr-1">
              {subjectTopics.map((top) => {
                const isSelected = top.id === activeTopic.id;
                return (
                  <button
                    key={top.id}
                    onClick={() => setSelectedTopicId(top.id)}
                    className={`w-full p-2 text-left rounded-lg text-xs font-medium transition truncate block ${
                      isSelected
                        ? "bg-[#356AE6]/10 text-[#356AE6] font-bold"
                        : "text-stone-700 hover:bg-stone-50"
                    }`}
                  >
                    {top.order}. {top.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Note Viewer with 6 Note Types */}
        <div className="flex-1 bg-white p-6 overflow-y-auto max-h-[calc(100vh-180px)]">
          {/* Active Topic Banner */}
          <div className="pb-4 border-b border-[#E4E1DA] mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-stone-400 mb-0.5">
                {currentSubject.title} › Topic {activeTopic.order}
              </div>
              <h2 className="text-xl font-bold text-[#162A43]">{activeTopic.title}</h2>
            </div>
            {onNavigateToTopic && (
              <button
                onClick={() => onNavigateToTopic(activeTopic.id)}
                className="text-xs font-semibold text-[#356AE6] hover:underline self-start sm:self-center"
              >
                Open Full Interactive Lesson ↗
              </button>
            )}
          </div>

          {/* 6 Note Type Switcher Tabs */}
          <div className="flex flex-wrap gap-2 pb-4 mb-6 border-b border-[#E4E1DA]">
            {[
              { id: "canonical", label: "1. Canonical Notes", icon: "📘" },
              { id: "weakness", label: "2. Personal Weakness Notes", icon: "⚠️" },
              { id: "cheatsheet", label: "3. Interview Cheat Sheet", icon: "🎯" },
              { id: "quick_revision", label: "4. Quick Revision", icon: "⚡" },
              { id: "engineering", label: "5. Production Engineering Notes", icon: "🏗️" },
              { id: "workbook", label: "6. Practice Workbook", icon: "✏️" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveNoteType(tab.id as NoteType)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  activeNoteType === tab.id
                    ? "bg-[#162A43] text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* NOTE TYPE 1: Canonical Learning Notes */}
          {activeNoteType === "canonical" && (
            <div className="space-y-6 max-w-4xl text-xs text-stone-700 leading-relaxed">
              {/* Definition */}
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-[#162A43] uppercase tracking-wider block">
                  Formal Mathematical &amp; Technical Definition
                </span>
                <p className="text-stone-800 font-medium">{canonicalNotes.formalDefinition}</p>
              </div>

              {/* Mental Model Analogy */}
              <div className="p-4 bg-blue-50/50 border border-blue-200 rounded-xl space-y-1.5">
                <span className="text-[11px] font-bold text-blue-900 uppercase tracking-wider block">
                  Mental Model &amp; Intuitive Analogy
                </span>
                <p className="text-blue-950">{canonicalNotes.mentalModelAnalogy}</p>
              </div>

              {/* Learning Objectives */}
              <div>
                <h4 className="font-bold text-[#162A43] text-sm mb-2">Core Learning Objectives</h4>
                <ul className="list-disc list-inside space-y-1 text-stone-600">
                  {canonicalNotes.learningObjectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>

              {/* Production Code Example */}
              <div>
                <h4 className="font-bold text-[#162A43] text-sm mb-2">Production Implementation Example</h4>
                <pre className="p-4 bg-stone-900 text-stone-100 font-mono rounded-xl text-xs overflow-x-auto">
                  {canonicalNotes.productionCodeExample.code}
                </pre>
                <p className="text-stone-500 mt-2 text-[11px] italic">
                  {canonicalNotes.productionCodeExample.explanation}
                </p>
              </div>

              {/* Common Pitfalls & Traps */}
              <div>
                <h4 className="font-bold text-[#162A43] text-sm mb-3">Common Pitfalls &amp; Edge Case Traps</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {canonicalNotes.commonMistakesAndTraps.map((trap, idx) => (
                    <div key={idx} className="p-3.5 bg-rose-50/50 border border-rose-200 rounded-xl">
                      <div className="font-bold text-rose-900 mb-1">Trap: {trap.trap}</div>
                      <div className="text-rose-800 text-[11px] mb-1"><span className="font-bold">Why it happens: </span>{trap.whyItHappens}</div>
                      <div className="text-rose-950 font-semibold text-[11px]"><span className="font-bold">How to avoid: </span>{trap.howToAvoid}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* NOTE TYPE 2: Personal Weakness Notes */}
          {activeNoteType === "weakness" && (
            <div className="space-y-4 max-w-4xl text-xs">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-bold text-amber-900 text-sm block mb-1">
                  Evidence-Driven Personal Weakness Log
                </span>
                <p className="text-amber-800 text-xs">
                  Derived from your actual failed test cases and mistaken quiz attempts in this subject.
                </p>
              </div>

              {weaknessNotes.weaknesses.length === 0 ? (
                <div className="p-8 text-center text-stone-500">
                  No critical weaknesses identified for this topic. Great job!
                </div>
              ) : (
                <div className="space-y-3">
                  {weaknessNotes.weaknesses.map((w, idx) => (
                    <div key={idx} className="p-4 bg-white border border-[#E4E1DA] rounded-xl shadow-sm space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#162A43] text-sm">{w.weakConcept}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 capitalize">
                          {w.severity} Severity
                        </span>
                      </div>
                      <p className="text-stone-600"><span className="font-bold">Observed Evidence: </span>{w.observedEvidence}</p>
                      <p className="text-stone-600"><span className="font-bold">What Went Wrong: </span>{w.whatWentWrong}</p>
                      <div className="p-2.5 bg-stone-50 rounded-lg text-emerald-800 font-semibold">
                        Recommended Drill: {w.recommendedPracticeDrill}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* NOTE TYPE 3: Interview Cheat Sheet */}
          {activeNoteType === "cheatsheet" && (
            <div className="space-y-4 max-w-4xl text-xs">
              <h3 className="text-sm font-bold text-[#162A43]">
                5-Minute Pre-Interview Recall Card
              </h3>
              <div className="space-y-3">
                {canonicalNotes.interviewCheatSheet.map((item, idx) => (
                  <div key={idx} className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                    <div className="font-bold text-[#162A43] text-sm flex items-center gap-2">
                      <span className="text-[#356AE6]">Q{idx + 1}:</span>
                      <span>{item.question}</span>
                    </div>
                    <div className="p-3 bg-white border border-stone-200 rounded-lg text-stone-800 leading-relaxed">
                      <span className="font-bold text-emerald-700">Concise Answer: </span>
                      {item.conciseAnswer}
                    </div>
                    {item.followUpTrap && (
                      <div className="text-[11px] text-rose-700 font-medium">
                        <span className="font-bold">Follow-Up Trap: </span>
                        {item.followUpTrap}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* NOTE TYPE 4: Quick Revision */}
          {activeNoteType === "quick_revision" && (
            <div className="space-y-4 max-w-4xl text-xs">
              <h3 className="text-sm font-bold text-[#162A43]">
                High-Yield Summary &amp; Key Takeaways
              </h3>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-2">
                <span className="font-bold text-[#162A43] block">Key Concepts Covered:</span>
                <ul className="list-disc list-inside space-y-1 text-stone-700">
                  {activeTopic.conceptsCovered?.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1">
                <span className="font-bold text-emerald-900 block">Practical Production Outcome:</span>
                <p className="text-emerald-950">{activeTopic.practicalOutcome}</p>
              </div>
            </div>
          )}

          {/* NOTE TYPE 5: Production Engineering Notes */}
          {activeNoteType === "engineering" && (
            <div className="space-y-4 max-w-4xl text-xs">
              <h3 className="text-sm font-bold text-[#162A43]">
                Production Architecture &amp; Execution Lifecycle
              </h3>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl leading-relaxed text-stone-800">
                <MarkdownRenderer content={canonicalNotes.underTheHoodArchitecture || activeTopic.deepExplanation?.english || ""} />
              </div>
            </div>
          )}

          {/* NOTE TYPE 6: Practice Workbook */}
          {activeNoteType === "workbook" && (
            <div className="space-y-4 max-w-4xl text-xs">
              <h3 className="text-sm font-bold text-[#162A43]">
                Topic Practice Exercises &amp; Self-Check Workbook
              </h3>
              <div className="p-4 bg-stone-50 border border-stone-200 rounded-xl space-y-3">
                <p className="text-stone-700">
                  Complete these independent exercises to verify your understanding before moving forward:
                </p>
                <ol className="list-decimal list-inside space-y-2 text-stone-800 font-medium">
                  <li>Trace the memory allocation and bytecode execution flow for {activeTopic.title}.</li>
                  <li>Implement the core algorithm without using built-in convenience abstractions.</li>
                  <li>Identify the worst-case edge inputs that degrade asymptotic runtime complexity.</li>
                </ol>
                {onOpenPractice && (
                  <button
                    onClick={() => onOpenPractice(activeTopic.id)}
                    className="mt-3 px-5 py-2 bg-[#356AE6] hover:bg-[#2855C7] text-white font-bold rounded-xl shadow-sm transition"
                  >
                    Open Live Sandboxed Coding Challenges →
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

