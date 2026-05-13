# /checkin — Morning Check-In

Morning planning ceremony. Reflects on yesterday, plans today, updates the daily log.

Source of truth for shared rules (symbols, format): [`../../daily-workflow.md`](../../daily-workflow.md)

## What this skill does

1. Reads yesterday's (or last entry's) plan + done
2. Shows plan vs done contrast to the user
3. Asks for reflection interactively (use AskUserQuestion)
4. Asks for today's plan interactively
5. Writes today's entry to `daily-progress.md`
6. Appends `<!-- checkin:morning -->` marker
7. Commits
8. **Reconciles the task list** — first call `TaskList`. For every `pending` task left from the previous check-in, mark it `completed` (it shipped), `deleted` (it was dropped/postponed), or leave it alone only if the user explicitly chose to keep it. Then call `TaskCreate` once per *new* plan item so today's plan shows up in `/tasks`. Carry-overs keep their `↳ (carry over Nd)` prefix; postponed items are skipped. All new tasks start `pending`. Never let stale completed work sit as `pending` — `/tasks` should reflect today, not yesterday.

## What this skill touches

- **Reads:** `daily-progress.md`, `upcoming.md` (if present)
- **Writes:** `daily-progress.md` (new day entry + reflection on previous day), `upcoming.md` (removes accepted items)
- **Commits** after writing

## Boundaries — READ CAREFULLY

- All new content goes AFTER any existing markers. `daily-progress.md` is append-only.
- Never insert items above existing content or reorder entries.
- Never modify entries for previous days (except adding a Reflection section to the most recent previous day).
- **Preserve the user's voice exactly.** Never sanitize, professionalize, or remove personal comments, humor, or personality from log entries.
- **Never write reflections for the user.** Present the plan vs done analysis, ask them to write it, use their exact words verbatim.
- **Deduplicate items.** If two reported items refer to the same work/PR, combine them into one entry.

## Interactive flow

Walk through the morning step by step using AskUserQuestion. Do NOT dump all questions at once.

1. **Show plan vs done contrast** — display the last entry's plan and done side by side. This is essential context before asking for reflection.
2. **Ask for reflection** — present the analysis ("your plan had X, you did Y, divergence looked like Z"), then ask the user to write their reflection. **Never write the reflection yourself.** Use their exact words verbatim.
3. **Handle 3-day carry-overs** — any item reaching `↳ (carry over 3d)` triggers a decision: recommit, postpone, or drop.
4. **Surface `upcoming.md` items** — if `upcoming.md` exists, read it and collect items whose date is today or earlier (overdue). Present them as plan candidates before asking for today's plan. When an item is accepted into today's plan, remove its line from `upcoming.md` (if the date section becomes empty, remove the heading too). Items with future dates stay in `upcoming.md`.
5. **Ask for today's plan** — surface carry-over candidates and accepted `upcoming.md` items.
6. **Write today's entry** to `daily-progress.md` and append the `<!-- checkin:morning -->` marker immediately after the plan items.
7. **Reconcile `/tasks`** — after committing, call `TaskList`. Mark every `pending` task from the prior check-in as `completed` (if it shipped) or `deleted` (if dropped/postponed). Then call `TaskCreate` once per new plan item. Use the plan item text verbatim (including any `↳ (carry over Nd)` prefix). Skip `(postponed)` items. New tasks start `pending`. The task list must reflect today, not yesterday — don't leave stale work pending.

## Catch-up mode

If the user skipped days since the last entry, combine into a single flow:
- Write reflections for each skipped day that had a plan
- Then proceed with today's planning

## upcoming.md format (optional)

Park future-dated todos in `upcoming.md`. `/checkin` surfaces items whose date is today or earlier, and removes them from the file when accepted. Keeps `daily-progress.md` as a journal of what actually happened, while `upcoming.md` is the queue of what's planned.

```markdown
# Upcoming

## Thursday, April 23, 2026

- [project] Item description
- Another item
```

Date headings match `daily-progress.md` format (`## Day, Month Date, Year`). When a line is accepted into today's plan, remove it; if the date section becomes empty, remove the heading too.

## daily-progress.md format

```markdown
## Day, Month Date, Year

### Plan
- ↳ (carry over Nd) Carry-over items first
- New planned items
- (postponed) Deferred items last
<!-- checkin:morning -->
```

Reflection for the previous day is written into that day's entry as:
```markdown
### Reflection
💭 1-2 sentences.
```

## Item grouping

Group items by status:
1. ✓ (done) items first
2. ↳ carry-over / in-progress items
3. (postponed) items last

## Symbol system

```
✓ (done)              completed
↳ (carry over Nd)     carried over, tracking age
•                     new planned item
(postponed)           consciously deferred
💭                    reflection (1 sentence)
```

Use `✓` (U+2713), not `✔` (U+2714).
