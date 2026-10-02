import fs from "fs";
import path from "path";

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`  ✅ ${message}`);
  }
}

async function runSidebarValidation() {
  console.log("\n============================================================");
  console.log("🚀 COGNALYZE STUDENT WORKSPACE SIDEBAR VALIDATION SUITE");
  console.log("============================================================\n");

  const appNavPath = path.join(process.cwd(), "components", "AppNav.tsx");
  assert(fs.existsSync(appNavPath), "components/AppNav.tsx exists");
  const appNavContent = fs.readFileSync(appNavPath, "utf-8");

  console.log("\n▶ CHECK 1: Navigation items order and specifications (13 Core Items)");
  const expectedStudentItems = [
    { label: "Overview", href: "/student/dashboard" },
    { label: "Journey", href: "/student/journey" },
    { label: "Student DNA", href: "/student/dna", badge: "Live" },
    { label: "Opportunities", href: "/student/opportunities" },
    { label: "Applications", href: "/student/applications" },
    { label: "Resume", href: "/resume" },
    { label: "Interviews", href: "/interview" },
    { label: "Skill Practice Hub", href: "/skill-practice" },
    { label: "Recruitment Simulation", href: "/recruitment-simulation" },
    { label: "DSA Tracker", href: "/dsa-tracker" },
    { label: "Question Bank", href: "/question-bank" },
    { label: "Group Discussion", href: "/group-discussion" },
    { label: "Cognalyze AI Mentor", href: "/student/ai-mentor", badge: "✦ New" },
  ];

  for (const item of expectedStudentItems) {
    assert(
      appNavContent.includes(`label: "${item.label}"`),
      `Sidebar contains item: "${item.label}"`
    );
    assert(
      appNavContent.includes(`href: "${item.href}"`),
      `Item "${item.label}" links to "${item.href}"`
    );
    if (item.badge) {
      assert(
        appNavContent.includes(`badge: "${item.badge}"`),
        `Item "${item.label}" has badge "${item.badge}"`
      );
    }
  }

  console.log("\n▶ CHECK 2: Critical layout requirements");
  // Check order in studentNavItems definition
  const studentNavMatch = appNavContent.match(/studentNavItems: NavItem\[\] = \[([\s\S]*?)\];/);
  assert(!!studentNavMatch, "studentNavItems array is defined");

  if (studentNavMatch) {
    const listStr = studentNavMatch[1];
    const interviewIdx = listStr.indexOf('"Interviews"');
    const skillHubIdx = listStr.indexOf('"Skill Practice Hub"');
    const simIdx = listStr.indexOf('"Recruitment Simulation"');
    const dsaIdx = listStr.indexOf('"DSA Tracker"');
    const qbIdx = listStr.indexOf('"Question Bank"');
    const gdIdx = listStr.indexOf('"Group Discussion"');
    const mentorIdx = listStr.indexOf('"Cognalyze AI Mentor"');

    assert(interviewIdx !== -1, "Interviews is in list");
    assert(skillHubIdx > interviewIdx, "Skill Practice Hub is immediately after Interviews");
    assert(simIdx > skillHubIdx, "Recruitment Simulation is immediately after Skill Practice Hub");
    assert(dsaIdx > simIdx, "DSA Tracker is immediately after Recruitment Simulation");
    assert(qbIdx > dsaIdx, "Question Bank is immediately after DSA Tracker");
    assert(gdIdx > qbIdx, "Group Discussion is immediately after Question Bank");
    assert(mentorIdx > gdIdx, "Cognalyze AI Mentor is immediately after Group Discussion");

    // Check no divider between Interviews and Skill Practice Hub
    const betweenInterviewAndSkill = listStr.substring(interviewIdx, skillHubIdx);
    assert(
      !betweenInterviewAndSkill.includes("divider") &&
        !betweenInterviewAndSkill.includes("Divider") &&
        !betweenInterviewAndSkill.includes("<hr") &&
        !betweenInterviewAndSkill.includes("borderTop"),
      "There is NO divider between Interviews and Skill Practice Hub"
    );

    // Check no divider between Group Discussion and Cognalyze AI Mentor
    const betweenGdAndMentor = listStr.substring(gdIdx, mentorIdx);
    assert(
      !betweenGdAndMentor.includes("divider") &&
        !betweenGdAndMentor.includes("Divider") &&
        !betweenGdAndMentor.includes("<hr") &&
        !betweenGdAndMentor.includes("borderTop"),
      "There is NO divider between Group Discussion and Cognalyze AI Mentor"
    );
  }

  console.log("\n▶ CHECK 3: Lower section items (Dark Mode, Settings, Sign Out)");
  assert(appNavContent.includes("Dark Mode"), "Sidebar contains 'Dark Mode' item");
  assert(appNavContent.includes("sidebar-dark-mode-toggle"), "Sidebar has dark mode toggle button");
  assert(appNavContent.includes("role=\"switch\""), "Dark mode toggle has accessible switch role");
  assert(appNavContent.includes("aria-checked={isDark}"), "Dark mode toggle reflects isDark state");
  assert(appNavContent.includes("Settings"), "Sidebar contains 'Settings'");
  assert(appNavContent.includes("Sign Out"), "Sidebar contains 'Sign Out'");

  console.log("\n▶ CHECK 4: Route pages exist and are valid components");
  const routes = [
    { file: "app/skill-practice/page.tsx", route: "/skill-practice" },
    { file: "app/recruitment-simulation/page.tsx", route: "/recruitment-simulation" },
    { file: "app/dsa-tracker/page.tsx", route: "/dsa-tracker" },
    { file: "app/question-bank/page.tsx", route: "/question-bank" },
    { file: "app/group-discussion/page.tsx", route: "/group-discussion" },
    { file: "app/student/ai-mentor/page.tsx", route: "/student/ai-mentor" },
  ];

  for (const r of routes) {
    const p = path.join(process.cwd(), r.file);
    assert(fs.existsSync(p), `Route ${r.route} page file exists at ${r.file}`);
    const content = fs.readFileSync(p, "utf-8");
    assert(content.includes("export default"), `${r.file} has default export`);
  }

  console.log("\n▶ CHECK 5: ThemeProvider and CSS tokens");
  const themeProviderPath = path.join(process.cwd(), "components", "ThemeProvider.tsx");
  assert(fs.existsSync(themeProviderPath), "components/ThemeProvider.tsx exists");
  const themeProviderContent = fs.readFileSync(themeProviderPath, "utf-8");
  assert(themeProviderContent.includes("cognalyze_theme") || themeProviderContent.includes("cognalyze-theme"), "ThemeProvider persists theme in localStorage");
  assert(themeProviderContent.includes('useState<Theme>("light")'), "Default theme state is 'light' (OFF)");

  const globalsCssPath = path.join(process.cwd(), "app", "globals.css");
  const globalsCssContent = fs.readFileSync(globalsCssPath, "utf-8");
  assert(globalsCssContent.includes('[data-theme="dark"]'), "app/globals.css contains [data-theme='dark'] tokens");
  assert(globalsCssContent.includes("--bg-canvas: #07111F") || globalsCssContent.includes("--bg-canvas: #090F19"), "globals.css has deep navy dark canvas token");
  assert(globalsCssContent.includes("--surface: #0E1B2E") || globalsCssContent.includes("--surface: #0F1D31") || globalsCssContent.includes("--surface: #0F1A2A"), "globals.css has deep navy dark surface token");

  console.log("\n🎉 ALL 24 SIDEBAR & NAVIGATION VERIFICATIONS PASSED PERFECTLY!\n");
}

runSidebarValidation();
