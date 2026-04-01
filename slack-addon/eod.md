# /eod — End of Day Update (with Slack)

End-of-day wrap-up. Records what got done, updates today's Slack message.

Source of truth for shared rules (symbols, format): [`../../daily-workflow.md`](../../daily-workflow.md)

## What this skill does

1. Asks the user what they worked on (or gathers from conversation context)
2. Appends a Done section to today's entry in `daily-progress.md`
3. Updates today's Slack message with the same mutations
4. Appends `<!-- slack:updated ts=... -->` marker
5. Commits

## What this skill touches

- **Reads:** `daily-progress.md`
- **Writes:** `daily-progress.md` (appends Done section after the slack:posted marker)
- **Updates:** Today's existing Slack message (never posts a new one)
- **Commits** after updating

## Boundaries — READ CAREFULLY

- This skill **updates an EXISTING Slack message**. It never posts a new one. Never call `chat.postMessage`.
- Find today's message timestamp from the `<!-- slack:posted ts=... -->` marker in `daily-progress.md`.
- If no `<!-- slack:posted ts=... -->` marker exists for today, **stop and tell the user** — `/checkin` needs to run first.
- The Plan section stays as-is (do NOT rename or mutate it).
- New items are appended AFTER the last existing marker. Never insert before any marker.
- After updating Slack, append `<!-- slack:updated ts=... -->` marker at the bottom of today's section.
- `daily-progress.md` is append-only. Never reorder or insert above existing content.
- Never modify entries for previous days.
- **Preserve the user's voice exactly.** Never sanitize or professionalize their words.
- **Deduplicate items.** If two items refer to the same work, combine into one entry.

## How to write the Done section

Append a new `### Done` section after the last marker:

```markdown
### Done
- ✓ (done) Completed planned thing
- ✓ (done) Unplanned thing (unplanned)
- • Item from plan not touched
- ↳ Item from plan still in progress
<!-- slack:updated ts=... -->
```

## Slack update

Find the message ts from today's `<!-- slack:posted ts=... -->` marker.

```bash
export $(grep -v '^#' .env | xargs)
```

Update existing message:
```bash
curl -s -X POST https://slack.com/api/chat.update \
  -H "Authorization: Bearer $SLACK_USER_TOKEN" \
  -H "Content-Type: application/json; charset=utf-8" \
  -d '{"channel":"'"$SLACK_CHANNEL_ID"'","ts":"MESSAGE_TS","text":"FALLBACK","blocks":[...]}'
```

## Slack message format

Use Slack Block Kit. Reconstruct the full blocks array from `daily-progress.md`. Keep the same block structure from the morning, but mutate the plan section — flip symbols to reflect what happened. Group: ✓ items first, then ↳, then •, then (postponed). Append unplanned items at the bottom.

## Symbol system

```
✓ (done)              completed
↳ (carry over Nd)     carried over, tracking age
•                     new planned item
(postponed)           consciously deferred
💭                    reflection (1 sentence)
```

Use `✓` (U+2713), not `✔` (U+2714).
