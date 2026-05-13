#!/usr/bin/env node
// slack-post.test.mjs — invariant tests for the Slack helper.
// Run: node slack-addon/slack-post.test.mjs

import { execFileSync } from "node:child_process";
import { writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const script = join(here, "slack-post.mjs");
const fixture = join(here, "__fixtures__/checkin-spec.example.json");

let failed = 0;
function assert(name, cond, detail = "") {
  if (cond) {
    console.log(`✓ ${name}`);
  } else {
    failed++;
    console.error(`✗ ${name}${detail ? ` — ${detail}` : ""}`);
  }
}

function dryRun(specPath) {
  const out = execFileSync("node", [script, "--spec", specPath, "--dry-run"], { encoding: "utf8" });
  return JSON.parse(out);
}

const result = dryRun(fixture);
assert("dry-run succeeds", result.ok === true);

const blocks = result.payload.blocks;
const sectionTexts = blocks.filter(b => b.type === "section").map(b => b.text.text);

// Invariant 1: every multi-line section list line starts with `• ` or `- `.
for (const text of sectionTexts) {
  const lines = text.split("\n");
  if (lines.length <= 1) continue;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    assert(`section line starts with bullet: ${line.slice(0, 50)}...`, line.startsWith("• ") || line.startsWith("- "));
  }
}

// Invariant 2: no plain `#NNN` PR-number tokens outside Slack links.
const allText = sectionTexts.join("\n");
const plainPRMatches = [...allText.matchAll(/(?<![|>])#(\d+)(?!\d)(?![|>])/g)].map(m => m[0]);
assert("no plain PR-number tokens (#NNN) outside Slack links", plainPRMatches.length === 0, plainPRMatches.join(", "));

// Invariant 3: filter_tags drops [personal] tagged items.
const hasFilteredTag = sectionTexts.some(t => /\*\[personal\]\*/.test(t));
assert("filter_tags drops [personal] section", !hasFilteredTag);

// Invariant 4: plan section bullets.
const planHeaderIdx = blocks.findIndex(b => b.type === "header" && b.text.text === "Plan for today");
const planSection = blocks[planHeaderIdx + 1];
assert("plan section exists", planSection && planSection.type === "section");
const planLines = planSection.text.text.split("\n").filter(Boolean);
for (const line of planLines) {
  assert(`plan line bullet: ${line.slice(0, 50)}...`, line.startsWith("• "));
}

// Invariant 5: no double commas.
assert("no double commas", !/,\s*,/.test(allText));

// Invariant 6: rejects PR ref missing repo.
const tmp = mkdtempSync(join(tmpdir(), "slack-post-test-"));
const bad = join(tmp, "bad.json");
writeFileSync(bad, JSON.stringify({ header: "X", by_project: [{ tag: "x", summary: "y", prs: [{ org: "a", n: 1 }] }] }));
let badThrew = false;
try {
  execFileSync("node", [script, "--spec", bad, "--dry-run"], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch (e) {
  badThrew = true;
}
rmSync(tmp, { recursive: true });
assert("rejects PR ref missing repo", badThrew);

// Invariant 7: filter_repos drops items by repo prefix.
const tmp2 = mkdtempSync(join(tmpdir(), "slack-post-test-"));
const repoFiltSpec = join(tmp2, "filt.json");
writeFileSync(repoFiltSpec, JSON.stringify({
  header: "Test",
  by_project: [
    { tag: "x", summary: "kept", prs: [{ org: "keep", repo: "repo1", n: 1 }] },
    { tag: "y", summary: "stripped", prs: [{ org: "drop", repo: "secret", n: 2 }] }
  ],
  filter_repos: ["drop/"]
}));
const filtResult = dryRun(repoFiltSpec);
rmSync(tmp2, { recursive: true });
const filtText = filtResult.payload.blocks.filter(b => b.type === "section").map(b => b.text.text).join("\n");
assert("filter_repos drops 'drop/' prefix repos", !filtText.includes("drop/secret"), filtText);
assert("filter_repos keeps non-matching repos", filtText.includes("keep/repo1"));

if (failed) {
  console.error(`\n${failed} test(s) failed`);
  process.exit(1);
}
console.log("\nAll tests passed.");
