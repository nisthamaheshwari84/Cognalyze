import { rankAllCandidates } from "../lib/ai/twoPassRanker";
import { get30SdeInternBenchmarkCandidates, getSdeInternJobDescription } from "../lib/ai/benchmarkCandidates";

async function main() {
  console.log("🚀 Starting 30 SDE Intern Benchmark Ranking Test...");

  const jd = getSdeInternJobDescription();
  const benchmarkCandidates = get30SdeInternBenchmarkCandidates();

  console.log(`📋 Total Candidates: ${benchmarkCandidates.length}`);
  console.log(`📄 JD Title: ${jd.split("\n")[0]}`);

  const startTime = Date.now();
  const { ranked, failed, committeeReport } = await rankAllCandidates(
    benchmarkCandidates.map(c => ({ id: c.id, name: c.name, resumeText: c.resume })),
    jd,
    (progress) => {
      console.log(`  Phase: ${progress.phase} [${progress.completed}/${progress.total}]`);
    }
  );
  const duration = Date.now() - startTime;

  console.log(`\n⏱️ Evaluation completed in ${duration}ms`);
  console.log(`✅ Ranked count: ${ranked.length}, Failed: ${failed.length}`);

  // 1. Top 5 Check
  console.log("\n--- TOP 5 CANDIDATES ---");
  ranked.slice(0, 5).forEach(c => {
    console.log(`Rank #${c.rank}: ${c.candidateName} | Score: ${c.final_score} | Verdict: ${c.verdict}`);
    console.log(`  Summary: ${c.summary}`);
    console.log(`  Radar: MustHave=${c.evidence_radar.mustHave}, EvidenceQuality=${c.evidence_radar.evidenceQuality}, DSA=${c.evidence_radar.dsa}`);
  });

  // Top 5 assertions
  const topNames = ranked.slice(0, 5).map(c => c.candidateName);
  console.log("\n🔍 Top 5 Names:", topNames);

  const aarav = ranked.find(c => c.candidateName === "Aarav Sharma");
  const rohan = ranked.find(c => c.candidateName === "Rohan Verma");
  console.log("\n--- AARAV SHARMA DETAILS ---");
  console.log("Raw Score:", aarav?.rawScore, "Final Score:", aarav?.final_score);
  console.log("Radar:", aarav?.evidence_radar);
  console.log("Matched Must-Haves:", aarav?.matched_must_haves);

  console.log("\n--- ROHAN VERMA DETAILS ---");
  console.log("Raw Score:", rohan?.rawScore, "Final Score:", rohan?.final_score);
  console.log("Radar:", rohan?.evidence_radar);
  console.log("Matched Must-Haves:", rohan?.matched_must_haves);

  if (ranked[0].candidateName !== "Aarav Sharma") {
    console.error(`❌ Expected Aarav Sharma at Rank 1, got ${ranked[0].candidateName}`);
  } else {
    console.log("✅ Rank 1 is Aarav Sharma!");
  }

  // Check Mihir Bansal (Keyword Stuffer)
  const mihir = ranked.find(c => c.candidateName === "Mihir Bansal");
  if (!mihir) {
    console.error("❌ Mihir Bansal not found in ranked list");
  } else {
    console.log(`\n🔍 Mihir Bansal: Rank #${mihir.rank} | Score: ${mihir.final_score} | Verdict: ${mihir.verdict}`);
    console.log(`   is_keyword_stuffer: ${mihir.is_keyword_stuffer}`);
    console.log(`   Red Flags: ${mihir.red_flags.join("; ")}`);
    console.log(`   Summary: ${mihir.summary}`);
    if (mihir.is_keyword_stuffer) {
      console.log("✅ Keyword stuffer trap triggered for Mihir Bansal!");
    } else {
      console.error("❌ Mihir Bansal was NOT flagged as keyword stuffer!");
    }
    if (mihir.rank <= 5) {
      console.error("❌ Mihir Bansal is in Top 5! Should be penalized.");
    } else {
      console.log(`✅ Mihir Bansal is properly penalized at Rank #${mihir.rank}!`);
    }
  }

  // Check Neel Malhotra (UI/UX mismatch)
  const neel = ranked.find(c => c.candidateName === "Neel Malhotra");
  if (neel) {
    console.log(`\n🔍 Neel Malhotra: Rank #${neel.rank} | Score: ${neel.final_score} | Verdict: ${neel.verdict}`);
    console.log(`   Concerns: ${neel.concerns.join("; ")}`);
    if (neel.rank > 20) {
      console.log(`✅ Neel Malhotra (UI/UX mismatch) properly ranked low at Rank #${neel.rank}!`);
    }
  }

  // Check Non-Technical Rejects (e.g. Pooja Sharma, Suresh Nair, Ramesh Kumar, Vikram Malhotra)
  console.log("\n--- BOTTOM 5 REJECTS ---");
  ranked.slice(-5).forEach(c => {
    console.log(`Rank #${c.rank}: ${c.candidateName} | Score: ${c.final_score} | Verdict: ${c.verdict}`);
  });

  // Check Contradictions
  let contradictions = 0;
  for (const c of ranked) {
    if (c.final_score >= 85 && (c.summary.toLowerCase().includes("reject") || c.committee_note.toLowerCase().includes("reject"))) {
      console.error(`❌ CONTRADICTION in candidate ${c.candidateName}: Score ${c.final_score} but has reject text!`);
      contradictions++;
    }
    if (c.final_score < 50 && (c.summary.toLowerCase().includes("exceptional") || c.summary.toLowerCase().includes("priority hire"))) {
      console.error(`❌ CONTRADICTION in candidate ${c.candidateName}: Score ${c.final_score} but has hire text!`);
      contradictions++;
    }
  }

  if (contradictions === 0) {
    console.log("\n✅ ZERO VERDICT CONTRADICTIONS! Every candidate verdict, score, and summary is 100% harmonious.");
  }

  // Check for think tags
  const reportHasThink = committeeReport.includes("<think") || committeeReport.includes("</think");
  if (reportHasThink) {
    console.error("❌ Committee report contains <think> tags!");
  } else {
    console.log("✅ Zero <think> tag leakage in committee report!");
  }
}

main().catch(console.error);
