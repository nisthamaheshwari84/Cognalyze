import fs from "fs";
import path from "path";

async function runPwaValidation() {
  console.log("==================================================================");
  console.log("   COGNALYZE PWA & RESPONSIVE DESIGN AUDIT VALIDATION SUITE");
  console.log("==================================================================");

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, message: string) {
    total++;
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
    }
  }

  // 1. Manifest file existence & structure
  const manifestPath = path.join(process.cwd(), "public", "manifest.json");
  assert(fs.existsSync(manifestPath), "public/manifest.json exists");
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
    assert(manifest.name === "Cognalyze — Placement Intelligence & Assessment Platform", "Manifest name matches brand standard");
    assert(manifest.short_name === "Cognalyze", "Manifest short_name is Cognalyze");
    assert(manifest.display === "standalone", "Manifest display mode is standalone");
    assert(manifest.start_url === "/student", "Manifest start_url is /student");
    assert(manifest.theme_color === "#6366f1", "Manifest theme_color is #6366f1");
    assert(manifest.background_color === "#090d16", "Manifest background_color is #090d16");
    assert(manifest.icons && manifest.icons.length >= 4, `Manifest specifies ${manifest.icons?.length} icon variants`);
    assert(manifest.shortcuts && manifest.shortcuts.length === 4, `Manifest includes 4 app launcher shortcuts`);
  }

  // 2. Icon files existence & sizing
  const icon192 = path.join(process.cwd(), "public", "icons", "icon-192x192.png");
  const icon512 = path.join(process.cwd(), "public", "icons", "icon-512x512.png");
  const maskable192 = path.join(process.cwd(), "public", "icons", "icon-maskable-192x192.png");
  const maskable512 = path.join(process.cwd(), "public", "icons", "icon-maskable-512x512.png");
  const appleTouch = path.join(process.cwd(), "public", "icons", "apple-touch-icon.png");

  assert(fs.existsSync(icon192) && fs.statSync(icon192).size > 1000, "public/icons/icon-192x192.png exists & non-empty");
  assert(fs.existsSync(icon512) && fs.statSync(icon512).size > 2000, "public/icons/icon-512x512.png exists & non-empty");
  assert(fs.existsSync(maskable192) && fs.statSync(maskable192).size > 1000, "public/icons/icon-maskable-192x192.png exists & non-empty");
  assert(fs.existsSync(maskable512) && fs.statSync(maskable512).size > 2000, "public/icons/icon-maskable-512x512.png exists & non-empty");
  assert(fs.existsSync(appleTouch) && fs.statSync(appleTouch).size > 1000, "public/icons/apple-touch-icon.png exists & non-empty");

  // 3. Service Worker file & strategies
  const swPath = path.join(process.cwd(), "public", "sw.js");
  assert(fs.existsSync(swPath), "public/sw.js exists");
  if (fs.existsSync(swPath)) {
    const swContent = fs.readFileSync(swPath, "utf-8");
    assert(swContent.includes("PRECACHE_ASSETS"), "Service worker defines precache assets");
    assert(swContent.includes("caches.delete"), "Service worker handles cache activation & cleanup");
    assert(swContent.includes("/api/"), "Service worker handles /api/ route network-only isolation");
    assert(swContent.includes("offline.html"), "Service worker routes navigate requests to offline fallback");
  }

  // 4. Offline fallback HTML file
  const offlinePath = path.join(process.cwd(), "public", "offline.html");
  assert(fs.existsSync(offlinePath), "public/offline.html exists");
  if (fs.existsSync(offlinePath)) {
    const offlineContent = fs.readFileSync(offlinePath, "utf-8");
    assert(offlineContent.includes("Offline • Cognalyze"), "Offline page contains Cognalyze title");
    assert(offlineContent.includes("checkAndReload"), "Offline page contains auto/manual reconnect handler");
  }

  // 5. Layout PWA metadata integration
  const layoutPath = path.join(process.cwd(), "app", "layout.tsx");
  const layoutContent = fs.readFileSync(layoutPath, "utf-8");
  assert(layoutContent.includes("PwaProvider"), "app/layout.tsx integrates PwaProvider");
  assert(layoutContent.includes('manifest: "/manifest.json"'), "app/layout.tsx declares manifest");
  assert(layoutContent.includes("appleWebApp"), "app/layout.tsx includes iOS appleWebApp metadata");
  assert(layoutContent.includes("viewportFit: \"cover\""), "app/layout.tsx configures viewportFit cover");

  // 6. Global Responsive CSS rules
  const cssPath = path.join(process.cwd(), "app", "globals.css");
  const cssContent = fs.readFileSync(cssPath, "utf-8");
  assert(cssContent.includes("overflow-x: hidden"), "app/globals.css enforces global horizontal overflow prevention");
  assert(cssContent.includes("touch-target"), "app/globals.css provides minimum 44x44px touch target utility");

  console.log("------------------------------------------------------------------");
  console.log(`Results: ${passed}/${total} checks passed (${((passed / total) * 100).toFixed(1)}%)`);
  if (passed === total) {
    console.log("🎉 ALL PWA AND RESPONSIVE DESIGN AUDIT CHECKS PASSED PERFECTLY!");
  } else {
    process.exit(1);
  }
}

runPwaValidation().catch((e) => {
  console.error(e);
  process.exit(1);
});
