# /eod — End of Day Update

End-of-day wrap-up. Records what got done and updates the daily log.

Source of truth for shared rules (symbols, format): [`../../daily-workflow.md`](../../daily-workflow.md)

## What this skill does

1. Asks the user what they worked on (or gathers from conversation context)
2. Appends a Done section to today's entry in `daily-progress.md`
3. Appends `<!-- eod:done -->` marker
4. Commits

## What this skill touches

- **Reads:** `daily-progress.md`
- **Writes:** `daily-progress.md` (appends Done section after the checkin:morning marker)
- **Commits** after writing

## Boundaries — READ CAREFULLY

- The Plan section stays as-is (do NOT rename or mutate it).
- New items are appended AFTER the last existing marker. Never insert before any marker.
- After writing Done items, append `<!-- eod:done -->` marker at the bottom of today's section.
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
<!-- eod:done -->
```

Group items by status:
1. ✓ (done) items first
2. ↳ carry-over / in-progress items
3. • untouched items
4. (postponed) items last

## Symbol system

```
✓ (done)              completed
↳ (carry over Nd)     carried over, tracking age
•                     new planned item
(postponed)           consciously deferred
💭                    reflection (1 sentence)
```

Use `✓` (U+2713), not `✔` (U+2714).
