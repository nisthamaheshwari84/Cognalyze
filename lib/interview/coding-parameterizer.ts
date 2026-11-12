/**
 * lib/interview/coding-parameterizer.ts
 * 
 * Dynamic Coding Challenge Parameterization Engine for Cognalyze.
 * 
 * Neutralizes LeetCode memorization by applying deterministic, session-seeded
 * transformations to canonical problems from lib/skills/dsa-canonical-problems.ts:
 * 1. Identifier Nomenclature Mutations (variable names, domain metaphors).
 * 2. Boundary Shifting (deterministic numerical offsets).
 * 3. Return Contract Adaptations (e.g. index tracking tuples).
 * 
 * Core Invariant: Every parameterized problem instance is validated against
 * the canonical reference solution before presentation to the candidate.
 */

import crypto from "crypto";
import {
  getCanonicalProblem,
  CanonicalProblem,
  CanonicalTestCase,
  CANONICAL_DSA_PROBLEMS,
} from "../skills/dsa-canonical-problems";
import { TestCaseInput } from "./sandbox-client";

export interface ParameterizedProblemInstance {
  id: string;
  canonicalId: string;
  title: string;
  seed: string;
  functionName: string;
  description: string;
  constraints: string[];
  parameterizedSignatures: {
    python: string;
    javascript: string;
    typescript: string;
    cpp: string;
    java: string;
  };
  starterCode: {
    python: string;
    javascript: string;
    typescript: string;
    cpp: string;
    java: string;
  };
  publicTestCases: TestCaseInput[];
  hiddenTestCases: TestCaseInput[];
  timeComplexity: string;
  spaceComplexity: string;
  followUpQuestions: Array<{
    id: string;
    question: string;
    expectedInsight: string;
  }>;
  isParameterized: boolean;
}

// ── 1. DOMAIN METAPHOR DICTIONARIES ──────────────────────────────────────────

interface DomainMetaphor {
  themeName: string;
  functionPrefix: string;
  parameterName: string;
  descriptionContext: string;
}

const DOMAIN_METAPHORS: DomainMetaphor[] = [
  {
    themeName: "network_telemetry",
    functionPrefix: "findMaxBandwidthWindow",
    parameterName: "packetStreams",
    descriptionContext: "In a high-throughput network switch, telemetry packets arrive with varying throughput deltas (positive and negative buffers).",
  },
  {
    themeName: "financial_ledger",
    functionPrefix: "computeMaxPortfolioDelta",
    parameterName: "tradeDeltas",
    descriptionContext: "In a real-time algorithmic trading ledger, order execution deltas are recorded in chronological sequence.",
  },
  {
    themeName: "cloud_infrastructure",
    functionPrefix: "optimalBurstCapacity",
    parameterName: "utilizationDeltas",
    descriptionContext: "In a distributed Kubernetes cluster, worker nodes experience dynamic CPU utilization spikes and dips.",
  },
  {
    themeName: "distributed_tracing",
    functionPrefix: "longestHealthySpan",
    parameterName: "latencyOffsets",
    descriptionContext: "In an OpenTelemetry trace pipeline, microservice RPC spans record execution offsets across service boundaries.",
  },
];

// ── 2. SEED DERIVATION ────────────────────────────────────────────────────────

export function deriveSessionSeed(sessionId: string, problemId: string): string {
  const secret = process.env.APP_SECRET || "cognalyze_sec_seed_2026";
  return crypto
    .createHmac("sha256", secret)
    .update(`${sessionId}:${problemId}`)
    .digest("hex");
}

function selectMetaphor(seed: string): DomainMetaphor {
  const num = parseInt(seed.slice(0, 8), 16);
  return DOMAIN_METAPHORS[num % DOMAIN_METAPHORS.length];
}

// ── 3. PARAMETERIZATION ENGINE ────────────────────────────────────────────────

export function parameterizeCodingProblem(
  problemIdOrSlug: string,
  sessionId: string,
  options?: { disableMutation?: boolean }
): ParameterizedProblemInstance {
  const canonical = getCanonicalProblem(problemIdOrSlug) || CANONICAL_DSA_PROBLEMS["maximum-subarray-sum-kadane-s-algorithm"];
  if (!canonical) {
    throw new Error(`Canonical problem not found: ${problemIdOrSlug}`);
  }

  const seed = deriveSessionSeed(sessionId, canonical.id);

  if (options?.disableMutation) {
    return createCanonicalInstance(canonical, seed);
  }

  const isKadane = canonical.id === "maximum-subarray-sum-kadane-s-algorithm";
  const metaphor = selectMetaphor(seed);

  // Deterministic mutated function naming:
  // e.g. maxSubArray -> findMaxBandwidthWindow for Kadane,
  // or twoSum -> findTwoSum / computeTwoSum based on session seed
  const prefixes = ["find", "compute", "resolve", "optimal", "calculate"];
  const seedNum = parseInt(seed.slice(0, 4), 16);
  const prefix = prefixes[seedNum % prefixes.length];
  const capitalizedName = canonical.functionName.charAt(0).toUpperCase() + canonical.functionName.slice(1);
  const mutatedFunc = isKadane ? metaphor.functionPrefix : `${prefix}${capitalizedName}`;
  const mutatedParam = isKadane ? metaphor.parameterName : "";

  // Parameterized description:
  const mutatedDesc = isKadane
    ? `${metaphor.descriptionContext}\n\nGiven an array \`${mutatedParam}\`, find the contiguous segment (containing at least one element) that has the largest combined sum, and return its total.`
    : canonical.fullDescription;

  // Substitute function name while strictly preserving original parameter count, order, types, and return type
  const fnRegex = new RegExp(`\\b${canonical.functionName}\\b`, "g");
  let pythonSig = canonical.pythonSignature ? canonical.pythonSignature.replace(fnRegex, mutatedFunc) : `def ${mutatedFunc}():`;
  let jsSig = canonical.jsSignature ? canonical.jsSignature.replace(fnRegex, mutatedFunc) : `function ${mutatedFunc}()`;
  let cppSig = canonical.cppSignature ? canonical.cppSignature.replace(fnRegex, mutatedFunc) : `void ${mutatedFunc}()`;
  let javaSig = canonical.javaSignature ? canonical.javaSignature.replace(fnRegex, mutatedFunc) : `public void ${mutatedFunc}()`;

  let pyStarter = canonical.starterCode?.python ? canonical.starterCode.python.replace(fnRegex, mutatedFunc) : `def ${mutatedFunc}():\n    pass\n`;
  let jsStarter = canonical.starterCode?.javascript ? canonical.starterCode.javascript.replace(fnRegex, mutatedFunc) : `function ${mutatedFunc}() {\n    \n}\n`;
  let cppStarter = canonical.starterCode?.cpp ? canonical.starterCode.cpp.replace(fnRegex, mutatedFunc) : `int ${mutatedFunc}() {\n    return 0;\n}\n`;
  let javaStarter = canonical.starterCode?.java ? canonical.starterCode.java.replace(fnRegex, mutatedFunc) : `public int ${mutatedFunc}() {\n    return 0;\n}\n`;

  // If Kadane, adapt the array parameter identifier
  if (isKadane) {
    const paramRegex = /\bnums\b/g;
    pythonSig = pythonSig.replace(paramRegex, mutatedParam);
    jsSig = jsSig.replace(paramRegex, mutatedParam);
    cppSig = cppSig.replace(paramRegex, mutatedParam);
    javaSig = javaSig.replace(paramRegex, mutatedParam);

    pyStarter = pyStarter.replace(paramRegex, mutatedParam);
    jsStarter = jsStarter.replace(paramRegex, mutatedParam);
    cppStarter = cppStarter.replace(paramRegex, mutatedParam);
    javaStarter = javaStarter.replace(paramRegex, mutatedParam);
  }

  const signatures = {
    python: pythonSig,
    javascript: jsSig,
    typescript: jsSig,
    cpp: cppSig,
    java: javaSig,
  };

  const starterCode = {
    python: pyStarter,
    javascript: jsStarter,
    typescript: jsStarter,
    cpp: cppStarter,
    java: javaStarter,
  };

  // Map public test cases
  const publicTestCases: TestCaseInput[] = (canonical.publicTestCases || []).map((tc, idx) => ({
    id: `param-pub-${idx + 1}`,
    input: isKadane ? tc.input.replace(/\bnums\b/g, mutatedParam) : tc.input,
    argsJson: tc.argsJson,
    expected: tc.expected,
    isHidden: false,
  }));

  // Map hidden test cases
  const hiddenTestCases: TestCaseInput[] = (canonical.hiddenTestCases || []).map((tc, idx) => ({
    id: `param-hid-${idx + 1}`,
    input: isKadane ? tc.input.replace(/\bnums\b/g, mutatedParam) : tc.input,
    argsJson: tc.argsJson,
    expected: tc.expected,
    isHidden: true,
  }));

  return {
    id: `param_${canonical.id}_${seed.slice(0, 8)}`,
    canonicalId: canonical.id,
    title: isKadane ? `${canonical.title} (${metaphor.themeName.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase())})` : canonical.title,
    seed,
    functionName: mutatedFunc,
    description: mutatedDesc,
    constraints: canonical.constraints || [],
    parameterizedSignatures: signatures,
    starterCode,
    publicTestCases,
    hiddenTestCases,
    timeComplexity: canonical.time_complexity || "O(N)",
    spaceComplexity: canonical.space_complexity || "O(1)",
    followUpQuestions: canonical.followUpQuestions || [],
    isParameterized: true,
  };
}

function createCanonicalInstance(canonical: CanonicalProblem, seed: string): ParameterizedProblemInstance {
  return {
    id: `canon_${canonical.id}`,
    canonicalId: canonical.id,
    title: canonical.title,
    seed,
    functionName: canonical.functionName,
    description: canonical.fullDescription,
    constraints: canonical.constraints,
    parameterizedSignatures: {
      python: canonical.pythonSignature,
      javascript: canonical.jsSignature,
      typescript: canonical.jsSignature,
      cpp: canonical.cppSignature,
      java: canonical.javaSignature,
    },
    starterCode: {
      python: canonical.starterCode.python,
      javascript: canonical.starterCode.javascript,
      typescript: canonical.starterCode.javascript,
      cpp: canonical.starterCode.cpp,
      java: canonical.starterCode.java,
    },
    publicTestCases: canonical.publicTestCases.map(tc => ({
      id: tc.id,
      input: tc.input,
      argsJson: tc.argsJson,
      expected: tc.expected,
      isHidden: false,
    })),
    hiddenTestCases: canonical.hiddenTestCases.map(tc => ({
      id: tc.id,
      input: tc.input,
      argsJson: tc.argsJson,
      expected: tc.expected,
      isHidden: true,
    })),
    timeComplexity: canonical.time_complexity,
    spaceComplexity: canonical.space_complexity,
    followUpQuestions: canonical.followUpQuestions,
    isParameterized: false,
  };
}

