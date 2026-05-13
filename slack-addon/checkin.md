# /checkin — Morning Check-In (with Slack)

Morning planning ceremony. Reflects on yesterday, plans today, posts a new Slack message.

Source of truth for shared rules (symbols, format): [`../../daily-workflow.md`](../../daily-workflow.md)

## What this skill does

1. Reads yesterday's (or last entry's) plan + done
2. Shows plan vs done contrast to the user
3. Asks for reflection interactively (use AskUserQuestion)
4. Asks for today's plan interactively
5. Writes today's entry to `daily-progress.md`
6. Drafts and posts a new Slack message (via `slack-post.mjs`)
7. Appends `<!-- slack:posted ts=... -->` marker
8. Commits
9. **Reconciles the task list** — call `TaskList`, mark any stale `pending` tasks from the previous check-in as `completed`/`deleted`, then `TaskCreate` for today's new plan items.

## What this skill touches

- **Reads:** `daily-progress.md`
- **Writes:** `daily-progress.md` (new day entry + reflection on previous day)
- **Posts:** New Slack message (channel from `SLACK_CHANNEL_ID` env var)
- **Commits** after posting

## Boundaries — READ CAREFULLY

- This skill **posts a NEW Slack message** (initial post). The one exception: if the user catches a formatting or content problem in the just-posted message, use `chat.update` on the same `ts` to fix it in place — do NOT delete and repost (that creates a new ts, drops the original notification, and complicates the marker bookkeeping).
- After posting to Slack, append the `<!-- slack:posted ts=... -->` marker immediately after the plan items.
- All new content goes AFTER any existing markers. `daily-progress.md` is append-only.
- Never insert items above existing content or reorder entries.
- Never modify entries for previous days (except adding a Reflection section to the most recent previous day).
- **Preserve the user's voice exactly.** Never sanitize, professionalize, or remove personal comments, humor, or personality from log entries or Slack messages.
- **Never write reflections for the user.** Present the plan vs done analysis, ask them to write it, use their exact words verbatim.
- **Deduplicate items.** If two reported items refer to the same work/PR, combine them into one entry.

## Interactive flow

Walk through the morning step by step using AskUserQuestion. Do NOT dump all questions at once.

1. **Show plan vs done contrast** — display the last entry's plan and done side by side. This is essential context before asking for reflection.
2. **Ask for reflection** — present the analysis ("your plan had X, you did Y, divergence looked like Z"), then ask the user to write their reflection. **Never write the reflection yourself.** Use their exact words verbatim.
3. **Handle 3-day carry-overs** — any item reaching `↳ (carry over 3d)` triggers a decision: recommit, postpone, or drop.
4. **Ask for today's plan** — surface carry-over candidates.
5. **Show Slack draft** — display the full draft as text in the response (not in a preview field), then ask for confirmation before posting.

## Catch-up mode

If the user skipped days since the last entry, combine into a single flow:
- Write reflections for each skipped day that had a plan
- Use "Since last update" header instead of "Yesterday"
- Then proceed with today's planning

## Slack message format

Use Slack Block Kit (`blocks` parameter), not plain text. Structure:

1. `header` block — "Yesterday" or "Since last update (Day)" (plain_text)
2. `section` block — done items grouped: ✓ items first, then ↳ items (mrkdwn)
3. `context` block — 💭 reflection (renders as small muted text)
4. `header` block — "Plan for today" (plain_text)
5. `section` block — plan items grouped: new items first, ↳ carry-overs, (postponed) last (mrkdwn)
6. `divider` block
7. `context` block — optional footer (fun fact, attribution, etc.)

PRs should be Slack links: `<https://github.com/org/repo/pull/N|PR #N>`

Also pass `text` field as plaintext fallback for notifications.

## Slack posting

**Always go through `slack-addon/slack-post.mjs`.** Do not build Block Kit JSON inline — that's where the "list became a blob of emojis" and "PR numbers not linked" failures come from. The helper enforces:
- Every list line starts with `• ` (Slack mrkdwn only renders a list when the line literally starts with that)
- Every PR reference renders as `<https://github.com/{org}/{repo}/pull/{N}|#N>` (build from `{org,repo,n}`)
- `filter_tags` / `filter_repos` strip items you don't want in Slack (e.g. personal tags or unrelated repos)
- `chat.update` when `ts` is provided; `chat.postMessage` otherwise

Flow:
```bash
# 1. Build a spec JSON (see slack-addon/__fixtures__/checkin-spec.example.json for shape).
# 2. Dry-run first to confirm the rendered payload.
node slack-addon/slack-post.mjs --spec /tmp/checkin-spec.json --dry-run

# 3. Post when satisfied.
export $(grep -v '^#' .env | xargs)
node slack-addon/slack-post.mjs --spec /tmp/checkin-spec.json

# 4. To fix the just-posted message in place, pass --ts <ts> (or set ts in the spec).
node slack-addon/slack-post.mjs --spec /tmp/checkin-spec.json --ts 1778508299.004599
```

The helper prints `{ ok: true, ts: "..." }` on success. Capture that `ts` for the `<!-- slack:posted ts=... -->` marker. Always show the rendered draft to the user and get confirmation before posting.

Tests: `node slack-addon/slack-post.test.mjs` (runs invariant checks; CI/manual).

### GitHub scan: `updated_at` vs `created_at`

When pulling PR activity via `gh api search/issues?q=updated:>=...`, a PR in the result was *touched* in the window — not necessarily opened. Only label a PR as "opened" if `created_at` is also in the window. Otherwise describe accurately ("updated", "rebased", "commented on") or skip surfacing it.

## Slack filtering (optional)

If you only want certain items in Slack (e.g., work items but not personal ones), add include/exclude rules here:

Include:
- (add your rules)

Exclude:
- (add your rules)

If an item is ambiguous, ask before including it.

## Symbol system

```
✓ (done)              completed
↳ (carry over Nd)     carried over, tracking age
•                     new planned item
(postponed)           consciously deferred
💭                    reflection (1 sentence)
```

Use `✓` (U+2713), not `✔` (U+2714).
