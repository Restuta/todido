#!/usr/bin/env node
// slack-post.mjs — deterministic Slack Block Kit builder + poster for /checkin.
//
// Usage:
//   node slack-addon/slack-post.mjs --spec path/to/spec.json [--dry-run] [--ts <ts>]
//
// Reads SLACK_USER_TOKEN (required) and SLACK_CHANNEL_ID (default channel) from env.
//
// On success: prints JSON { ok: true, ts: "..." } to stdout.
// On failure: prints JSON { ok: false, error: "..." } and exits non-zero.
//
// Invariants enforced by the builder so a broken message can't ship:
//   - Every section block list line starts with `• ` (U+2022 + space) or `- `.
//   - Every PR reference uses Slack link syntax `<url|label>` (built from {org,repo,n}).
//   - filter_tags / filter_repos drop tagged or repo-scoped items from the post
//     (keep your local log complete; filter only what goes to Slack).
//   - chat.update when spec.ts (or --ts) is provided; chat.postMessage otherwise.
//
// This file is the source of truth for Slack standup formatting. Skills call it.

import { readFileSync } from "node:fs";
import { argv, env, exit } from "node:process";

// ----- arg parsing -----

const args = parseArgs(argv.slice(2));
if (!args.spec) fail("missing required --spec <path>");

const spec = JSON.parse(readFileSync(args.spec, "utf8"));

// ----- spec schema (informal) -----
//
// {
//   "channel": "C0XXXXXXXXX",        // optional; falls back to SLACK_CHANNEL_ID env
//   "ts": "1778508299.004599",       // optional → chat.update; omit for chat.postMessage
//   "header": "This week" | "Yesterday" | "Since last update",
//   "stats": { "commits": 100, "prs_merged": 10, "prs_reviewed": 5, "approx_reviews": true,
//              "lines_added": 12345, "lines_removed": 6789 },  // diff stats render as "(+12345/-6789)" after commits
//   "shipped": [ { "emoji": "🚀", "text": "..." } ],            // optional subsection
//   "by_project": [
//     {
//       "tag": "customer-web",
//       "emoji": "🏗️",
//       "summary": "...",
//       "prs": [
//         { "org": "myorg", "repo": "myrepo", "n": 42, "emoji": "🔥", "label": "#42" }
//       ]
//     }
//   ],
//   "still_open": "...",                                          // optional, rendered with ↳ prefix
//   "still_open_prs": [{ "org": "...", "repo": "...", "n": 56 }],
//   "reviewed": {
//     "preamble": "ios PRs: ",
//     "prs": [{ "org":"...","repo":"...","n":35 }, ...],
//     "trailer": ", plus a few comments"
//   },
//   "reflection": { "symbol": "💭", "label": "Weekly", "text": "..." },
//   "plan": [
//     { "tag": "work", "text": "Lock in the UI flow", "carry": true,
//       "pr_ref": { "org":"...","repo":"...","n":119 } }
//   ],
//   "footer": "...",                                              // optional, rendered as final context block
//   "filter_tags": ["personal"],                                  // tags to strip from Slack post
//   "filter_repos": ["my-personal/*"]                             // repo prefixes to strip
// }

// ----- builder -----

const blocks = [];
const channel = spec.channel || env.SLACK_CHANNEL_ID;
if (!channel && !args["dry-run"]) fail("no channel — set spec.channel or SLACK_CHANNEL_ID env");
const filterTags = new Set(spec.filter_tags || []);
const filterRepos = (spec.filter_repos || []).map(p => p.replace(/\*$/, ""));
const fallbackParts = [];

if (!spec.header) fail("spec.header is required");
blocks.push({ type: "header", text: { type: "plain_text", text: spec.header, emoji: true } });
fallbackParts.push(spec.header);

// stats context
if (spec.stats) {
  const { commits, prs_merged, prs_reviewed, approx_reviews, lines_added, lines_removed } = spec.stats;
  const segs = [];
  if (commits != null) {
    const diff = (lines_added != null || lines_removed != null)
      ? ` (+${lines_added ?? 0}/-${lines_removed ?? 0})`
      : "";
    segs.push(`${commits} commits${diff}`);
  }
  if (prs_merged != null) segs.push(`${prs_merged} PRs merged`);
  if (prs_reviewed != null) segs.push(`${prs_reviewed}${approx_reviews ? "+" : ""} PRs reviewed`);
  if (segs.length) {
    blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: `_${segs.join(" · ")}_` }] });
  }
}

// "Shipped" subsection (optional, typically weekly)
if (Array.isArray(spec.shipped) && spec.shipped.length) {
  const lines = ["*Shipped*"];
  for (const item of spec.shipped) {
    if (isFiltered(item)) continue;
    lines.push(bullet(`${item.emoji ? item.emoji + " " : ""}${item.text}`));
  }
  if (lines.length > 1) blocks.push(sectionMrkdwn(lines.join("\n")));
}

// by-project section — bullets, every PR linked
if (Array.isArray(spec.by_project) && spec.by_project.length) {
  const lines = [];
  for (const proj of spec.by_project) {
    if (isFiltered(proj)) continue;
    const tag = proj.tag ? `*[${proj.tag}]*` : "";
    const emoji = proj.emoji ? proj.emoji + " " : "";
    const prRefs = (proj.prs || []).filter(p => !isFiltered(p)).map(formatPRRef).join(", ");
    const summary = proj.summary || "";
    const prSuffix = prRefs ? ` (${prRefs})` : "";
    lines.push(bullet(`${emoji}${tag}${tag && summary ? " " : ""}${summary}${prSuffix}`));
  }
  if (lines.length) blocks.push(sectionMrkdwn(lines.join("\n")));
}

// still_open + reviewed
const tailLines = [];
if (spec.still_open || (spec.still_open_prs && spec.still_open_prs.length)) {
  const extraPRs = (spec.still_open_prs || []).filter(p => !isFiltered(p)).map(formatPRRef).join(", ");
  const base = (spec.still_open || "").replace(/[,\s]+$/, "");
  const sep = base && extraPRs ? ", " : "";
  tailLines.push(bullet(`↳ *Still open:* ${base}${sep}${extraPRs}`));
}
if (spec.reviewed) {
  const { preamble = "", prs = [], trailer = "" } = spec.reviewed;
  const prRefs = prs.filter(p => !isFiltered(p)).map(formatPRRef).join("/");
  tailLines.push(bullet(`_Reviewed:_ ${preamble}${prRefs}${trailer}`));
}
if (tailLines.length) blocks.push(sectionMrkdwn(tailLines.join("\n")));

// reflection
if (spec.reflection && spec.reflection.text) {
  const { symbol = "💭", label, text } = spec.reflection;
  const labelStr = label ? `${label}: ` : "";
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `${symbol} _${labelStr}${text}_` }],
  });
}

// plan
if (Array.isArray(spec.plan) && spec.plan.length) {
  blocks.push({ type: "header", text: { type: "plain_text", text: "Plan for today", emoji: true } });
  const lines = [];
  for (const item of spec.plan) {
    if (isFiltered(item)) continue;
    const tag = item.tag ? `[${item.tag}] ` : "";
    const carry = item.carry ? "↳ " : "";
    const postponed = item.postponed ? "(postponed) " : "";
    const prSuffix = item.pr_ref && !isFiltered(item.pr_ref) ? ` (${formatPRRef(item.pr_ref)})` : "";
    const carrySuffix = item.carry ? " _(carry over)_" : "";
    lines.push(bullet(`${carry}${postponed}${tag}${item.text}${prSuffix}${carrySuffix}`));
  }
  if (lines.length) blocks.push(sectionMrkdwn(lines.join("\n")));
}

// optional footer (fun fact, attribution, etc.)
if (spec.footer) {
  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: spec.footer }],
  });
}

validateBlocks(blocks);

const payload = {
  channel,
  text: spec.fallback_text || fallbackParts.join(" — "),
  blocks,
};
if (args.ts || spec.ts) payload.ts = args.ts || spec.ts;

// ----- dry-run / post -----

if (args["dry-run"]) {
  process.stdout.write(JSON.stringify({ ok: true, dry_run: true, payload }, null, 2) + "\n");
  exit(0);
}

const token = env.SLACK_USER_TOKEN;
if (!token) fail("SLACK_USER_TOKEN env var not set. Run: export $(grep -v '^#' .env | xargs)");

const method = payload.ts ? "chat.update" : "chat.postMessage";
const res = await fetch(`https://slack.com/api/${method}`, {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  },
  body: JSON.stringify(payload),
});
const body = await res.json();
if (!body.ok) fail(`slack ${method} error: ${body.error}`);

process.stdout.write(JSON.stringify({ ok: true, method, ts: body.ts || payload.ts, channel: body.channel || channel }) + "\n");

// ----- helpers -----

function bullet(line) {
  return `• ${line}`;
}

function sectionMrkdwn(text) {
  return { type: "section", text: { type: "mrkdwn", text } };
}

function formatPRRef(ref) {
  if (!ref || typeof ref !== "object") fail(`bad pr ref: ${JSON.stringify(ref)}`);
  if (ref.url && ref.label) return `<${ref.url}|${ref.label}>`;
  const { org, repo, n, emoji, label } = ref;
  if (!org || !repo || !n) fail(`pr ref missing org/repo/n: ${JSON.stringify(ref)}`);
  const url = `https://github.com/${org}/${repo}/pull/${n}`;
  const text = label || `#${n}`;
  const prefix = emoji ? emoji + " " : "";
  return `${prefix}<${url}|${text}>`;
}

function isFiltered(item) {
  if (!item) return false;
  if (item.tag && filterTags.has(item.tag)) return true;
  if (item.text && typeof item.text === "string") {
    for (const tag of filterTags) {
      if (item.text.includes(`[${tag}]`)) return true;
    }
  }
  if (item.repo || (item.org && item.repo)) {
    const full = item.org && item.repo ? `${item.org}/${item.repo}` : item.repo;
    for (const prefix of filterRepos) {
      if (full.startsWith(prefix)) return true;
    }
  }
  return false;
}

function validateBlocks(blocks) {
  for (const b of blocks) {
    if (b.type !== "section") continue;
    const text = b.text?.text || "";
    if (!text.includes("\n")) continue;
    const lines = text.split("\n");
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (line.trim() === "") continue;
      if (line.startsWith("• ") || line.startsWith("- ")) continue;
      fail(`section block has multi-line text but line ${i + 1} doesn't start with "• ": ${JSON.stringify(line)}`);
    }
  }
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--dry-run") out["dry-run"] = true;
    else if (a === "--spec") out.spec = argv[++i];
    else if (a === "--ts") out.ts = argv[++i];
    else fail(`unknown arg: ${a}`);
  }
  return out;
}

function fail(msg) {
  process.stderr.write(JSON.stringify({ ok: false, error: msg }) + "\n");
  exit(1);
}
