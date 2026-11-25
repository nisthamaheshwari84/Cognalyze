/**
 * COGNALYZE GD ARENA — DYNAMIC EXPERIENCE ENGINE
 *
 * Transforms static topic prompts into living group discussion experiences:
 * - Standard Roundtable
 * - Crisis Room (sudden operational shockwave mid-session)
 * - Boardroom Debate (ROI, capital allocation, & governance scrutiny)
 * - Ethical Dilemma (accountability, fairness, & human impact trade-offs)
 * - Case / Data Discussion (structured scenario constraints)
 */

import {
  GDExperienceMode,
  GDExperienceBlueprint,
  GDSimulationFormat,
  GDDifficultyLevel,
  GDTranscriptItem
} from "./types";
import { runGDJsonCompletion, sanitizeGDPromptInput } from "./ai-gateway";
import { GD_EXPERIENCE_MODE_META } from "@/components/gd/gd-theme";

export { GD_EXPERIENCE_MODE_META };

export function buildFallbackBlueprint(params: {
  topicTitle: string;
  format: GDSimulationFormat;
  mode: GDExperienceMode;
}): GDExperienceBlueprint {
  const { topicTitle, mode } = params;
  const meta = GD_EXPERIENCE_MODE_META[mode];

  if (mode === "crisis_room") {
    return {
      mode,
      modeLabel: meta.label,
      openingScenarioBrief: `WAR-ROOM BRIEF: Your committee is responding in real time to trade-offs on "${topicTitle}" under an urgent customer-facing SLA breach window.`,
      midSessionTwistLabel: meta.defaultTwistLabel,
      midSessionTwistPrompt: `CRISIS UPDATE: Monitoring reports a 40% spike in error rates and external partner escalation triggered by our primary choice on "${topicTitle}". What immediate containment step do you authorize within the next 30 minutes?`,
      keyConstraints: ["Zero unverified rollouts", "Quantified blast radius containment", "Clear single-threaded owner"]
    };
  }

  if (mode === "boardroom_debate") {
    return {
      mode,
      modeLabel: meta.label,
      openingScenarioBrief: `BOARDROOM BRIEF: Executive sponsors require a defensible budget & risk roadmap regarding "${topicTitle}" before Q3 allocation closes.`,
      midSessionTwistLabel: meta.defaultTwistLabel,
      midSessionTwistPrompt: `BOARDROOM CONSTRAINT: The CFO just trimmed engineering and operational expansion budgets by 25%. How do we rescope our recommendation on "${topicTitle}" without breaking delivery commitments?`,
      keyConstraints: ["12-month payback discipline", "Headcount freeze", "Auditable delivery milestones"]
    };
  }

  if (mode === "ethical_dilemma") {
    return {
      mode,
      modeLabel: meta.label,
      openingScenarioBrief: `ETHICS COMMITTEE BRIEF: Evaluate human impact, transparency, and commercial incentives surrounding "${topicTitle}".`,
      midSessionTwistLabel: meta.defaultTwistLabel,
      midSessionTwistPrompt: `ETHICS ESCALATION: An internal audit warns that our fastest growth option creates disproportionate edge-case harm to vulnerable end users. Do we pause launch, publish disclosures, or re-architect first?`,
      keyConstraints: ["Informed user consent", "Bias & safety auditability", "Executive accountability"]
    };
  }

  if (mode === "case_data_discussion") {
    return {
      mode,
      modeLabel: meta.label,
      openingScenarioBrief: `CASE BRIEF: Analyze baseline operational constraints, adoption bottlenecks, and measurable risk thresholds on "${topicTitle}".`,
      midSessionTwistLabel: meta.defaultTwistLabel,
      midSessionTwistPrompt: `NEW FIELD DATA: Pilot telemetry reveals early adoption stalled in Tier-2 segments due to onboarding friction rather than core cost. How does this evidence shift the panel's recommendation?`,
      keyConstraints: ["Evidence over intuition", "Explicit cutover metrics", "Migration cost accounting"]
    };
  }

  return {
    mode: "standard_round",
    modeLabel: meta.label,
    openingScenarioBrief: `ROUNDTABLE BRIEF: Debate "${topicTitle}" using structured logic, concrete real-world trade-offs, and collaborative consensus.`,
    midSessionTwistLabel: meta.defaultTwistLabel,
    midSessionTwistPrompt: `PANEL CHALLENGE: Assume scale doubles rapidly while senior operational bandwidth stays flat. Which premise in our current discussion breaks first?`,
    keyConstraints: ["Balanced trade-off analysis", "Constructive peer synthesis", "Operational realism"]
  };
}

export async function buildExperienceBlueprintAsync(params: {
  topicTitle: string;
  format: GDSimulationFormat;
  difficulty: GDDifficultyLevel;
  experienceMode?: GDExperienceMode;
}): Promise<GDExperienceBlueprint> {
  const mode: GDExperienceMode = params.experienceMode || "standard_round";
  const safeTopic = sanitizeGDPromptInput(params.topicTitle, 240);
  const meta = GD_EXPERIENCE_MODE_META[mode];

  const userPrompt = `Design a structured ${meta.label} (${mode}) experience blueprint for a Group Discussion.
TOPIC: "${safeTopic}"
FORMAT: ${params.format}
DIFFICULTY: ${params.difficulty}

INSTRUCTIONS:
1. Keep everything grounded, realistic, and concise. Never invent fake real-world company earnings or real survey statistics.
2. Provide an "openingScenarioBrief" (1-2 sentences setting context for candidates).
3. Provide a "midSessionTwistLabel" (3-5 word alert title) and "midSessionTwistPrompt" (1 sharp realistic constraint injected at the 50% mark to force adaptation).
4. Provide exactly 3 short "keyConstraints" (under 8 words each).

Return JSON ONLY:
{
  "openingScenarioBrief": "...",
  "midSessionTwistLabel": "...",
  "midSessionTwistPrompt": "...",
  "keyConstraints": ["...", "...", "..."]
}`;

  const aiResult = await runGDJsonCompletion<Omit<GDExperienceBlueprint, "mode" | "modeLabel">>({
    role: "experience_engine",
    timeoutMsOverride: 3800,
    maxAttemptsOverride: 1,
    systemPrompt:
      "You create high-realism scenario briefs and adaptive mid-session constraints for university & engineering Group Discussions.",
    userPrompt,
    validate: (parsed) => {
      if (
        typeof parsed?.openingScenarioBrief !== "string" ||
        typeof parsed?.midSessionTwistPrompt !== "string"
      ) {
        return null;
      }
      return {
        openingScenarioBrief: parsed.openingScenarioBrief.trim(),
        midSessionTwistLabel: String(parsed.midSessionTwistLabel || meta.defaultTwistLabel).trim(),
        midSessionTwistPrompt: parsed.midSessionTwistPrompt.trim(),
        keyConstraints: Array.isArray(parsed.keyConstraints) && parsed.keyConstraints.length > 0
          ? parsed.keyConstraints.slice(0, 3).map(String)
          : buildFallbackBlueprint({ topicTitle: safeTopic, format: params.format, mode }).keyConstraints
      };
    }
  });

  if (aiResult.ok) {
    return {
      mode,
      modeLabel: meta.label,
      ...aiResult.data
    };
  }

  return buildFallbackBlueprint({ topicTitle: safeTopic, format: params.format, mode });
}

export async function generateDynamicScenarioTwistAsync(params: {
  topicTitle: string;
  experienceBlueprint?: GDExperienceBlueprint;
  recentTranscripts: GDTranscriptItem[];
}): Promise<{ label: string; prompt: string }> {
  const blueprint = params.experienceBlueprint;
  if (!blueprint) {
    return {
      label: "Panel Stress-Test",
      prompt: `Let us introduce an unexpected constraint on "${params.topicTitle}": assume primary assumptions degrade by 3x under peak load or tighter budget limits. How does your group adapt cleanly?`
    };
  }

  const lastSummary = params.recentTranscripts
    .slice(-4)
    .map((t) => `${sanitizeGDPromptInput(t.speakerName, 30)}: ${sanitizeGDPromptInput(t.content, 160)}`)
    .join("\n");

  const aiTwist = await runGDJsonCompletion<{ label: string; prompt: string }>({
    role: "experience_engine",
    systemPrompt:
      "You are a live Group Discussion moderator injecting a sharp, fair mid-session constraint reacting directly to what the panel actually argued.",
    userPrompt: `MODE: ${blueprint.modeLabel}\nTOPIC: "${sanitizeGDPromptInput(params.topicTitle, 200)}"\nBASE TWIST IDEA: "${sanitizeGDPromptInput(blueprint.midSessionTwistPrompt, 240)}"\nRECENT PANEL STATEMENTS:\n${lastSummary || "Opening arguments complete."}\n\nAdapt the twist briefly (2 sentences max) so it references the panel's direction directly.\nReturn JSON ONLY: {"label": "...", "prompt": "..."}`,
    validate: (p) =>
      typeof p?.prompt === "string" && p.prompt.trim().length > 20
        ? {
            label: String(p.label || blueprint.midSessionTwistLabel).trim(),
            prompt: p.prompt.trim()
          }
        : null
  });

  if (aiTwist.ok) {
    return aiTwist.data;
  }

  return {
    label: blueprint.midSessionTwistLabel,
    prompt: blueprint.midSessionTwistPrompt
  };
}
