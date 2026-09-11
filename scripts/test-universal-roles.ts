import { rankAllCandidates } from "../lib/ai/twoPassRanker";

async function testUniversalRoles() {
  console.log("🧪 Testing Universal Role Calibration...");

  // 1. Frontend Role Test
  const frontendJd = `Role: Senior Frontend Engineer (React & Next.js)
Location: Remote
Requirements:
- 4+ years of professional experience building responsive web apps in React & Next.js.
- Strong proficiency in TypeScript, modern JavaScript (ES6+), and CSS/TailwindCSS.
- Hands-on experience with frontend state management (Redux, Zustand) and performance optimization.
- Experience with automated UI testing (Jest, Cypress, React Testing Library).
- Familiarity with RESTful APIs and Git version control.`;

  const frontendCandidates = [
    {
      id: "fe-1",
      name: "Sahil Mehta",
      resumeText: `Sahil Mehta | sahil.fe@gmail.com | github.com/sahilm-dev
Frontend Engineer (4 YoE)
EXPERIENCE:
- Frontend Engineer @ WebScale Labs (2022 - Present):
  * Built mission-critical customer dashboard using React 18, Next.js, and TypeScript serving 120k MAU.
  * Optimized Core Web Vitals, reducing Largest Contentful Paint (LCP) by 45% using Next.js image optimization and route prefetching.
  * Implemented state management using Zustand and authored 85+ unit and component tests with Jest and React Testing Library.
SKILLS:
- React, Next.js, TypeScript, JavaScript, TailwindCSS, CSS3, Redux, Zustand, Jest, Git, REST APIs
PROJECTS:
- Open-source component library in React & TailwindCSS with 1.2k GitHub stars.`,
    },
    {
      id: "fe-2",
      name: "Prakash Varma",
      resumeText: `Prakash Varma | prakash.v@gmail.com
Embedded Systems & Firmware Engineer
EXPERIENCE:
- Firmware Engineer @ IoT Devices (2021 - Present):
  * Wrote C and C++ firmware for ARM Cortex microcontrollers.
  * Configured SPI, I2C, and UART serial bus communication.
SKILLS: C, C++, ARM, RTOS, Assembly, Hardware Debugging, Oscilloscopes.
PROJECTS:
- Quadcopter flight controller in bare-metal C.`,
    },
  ];

  const feResult = await rankAllCandidates(frontendCandidates, frontendJd);
  console.log("\n--- FRONTEND ROLE RESULTS ---");
  feResult.ranked.forEach(c => {
    console.log(`Rank #${c.rank}: ${c.candidateName} | Score: ${c.final_score} | Verdict: ${c.verdict}`);
    console.log(`  Summary: ${c.summary}`);
    console.log(`  Must-Have Match: ${c.evidence_radar.mustHave}%, Evidence Depth: ${c.evidence_radar.evidenceQuality}%`);
  });

  if (feResult.ranked[0].candidateName === "Sahil Mehta" && feResult.ranked[1].final_score < 50) {
    console.log("✅ Universal Frontend JD test PASSED! Sahil Mehta ranked #1, Embedded engineer rejected.");
  } else {
    console.error("❌ Universal Frontend JD test failed!");
  }
}

testUniversalRoles().catch(console.error);
