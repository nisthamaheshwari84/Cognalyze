import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeCompanyName,
  resolveCompanyDomain,
  generateInitials,
  resolveCompanyLogoUrl,
} from "../components/CompanyLogo";

test("Dynamic Company Logo Resolver - Normalization & Domain Resolution", async (t) => {
  await t.test("normalizes corporate suffixes and country extensions", () => {
    assert.equal(normalizeCompanyName("Google India"), "Google");
    assert.equal(normalizeCompanyName("Google LLC"), "Google");
    assert.equal(normalizeCompanyName("Microsoft Corporation"), "Microsoft");
    assert.equal(normalizeCompanyName("Microsoft India"), "Microsoft");
    assert.equal(normalizeCompanyName("Flipkart Internet Pvt Ltd"), "Flipkart");
    assert.equal(normalizeCompanyName("Flipkart (via Unstop)"), "Flipkart");
  });

  await t.test("resolves official domains for well-known and arbitrary companies", () => {
    assert.equal(resolveCompanyDomain("Google"), "google.com");
    assert.equal(resolveCompanyDomain("Microsoft"), "microsoft.com");
    assert.equal(resolveCompanyDomain("Flipkart"), "flipkart.com");
    assert.equal(resolveCompanyDomain("Goldman Sachs"), "goldmansachs.com");
    // Arbitrary new startup
    assert.equal(resolveCompanyDomain("NovaTech"), "novatech.com");
    // Respects explicit domain
    assert.equal(resolveCompanyDomain("AnyCo", "https://anyco.ai/careers"), "anyco.ai");
  });

  await t.test("generates exact initials fallback per specification", () => {
    assert.equal(generateInitials("NovaTech"), "NT");
    assert.equal(generateInitials("Acme AI"), "AA");
    assert.equal(generateInitials("Microsoft"), "M");
    assert.equal(generateInitials("Goldman Sachs"), "GS");
  });

  await t.test("resolves logo URL with priority rules", () => {
    // 1. Explicit url takes highest priority
    const explicit = resolveCompanyLogoUrl("Google", undefined, "https://custom.com/google.png");
    assert.equal(explicit, "https://custom.com/google.png");

    // 2. Official domain favicon
    const resolved = resolveCompanyLogoUrl("Flipkart");
    assert(resolved?.includes("flipkart.com"));
    assert(resolved?.includes("google.com/s2/favicons"));
  });
});
