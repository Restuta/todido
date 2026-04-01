# Daily Workflow

This file is the source of truth for the daily progress workflow.

It is intentionally assistant-agnostic. Claude commands, Codex instructions, or any other wrapper should follow this file instead of duplicating the workflow in a global config.

## Philosophy

`daily-progress.md` is the canonical source for all planning and status. Everything else (Slack, project trackers, etc.) receives a syndicated version of what's already captured locally. Never reconstruct history from external tools; always read from the markdown file.

Every morning is the same process: reflect on what happened vs what was planned, course-correct, reprioritize, drop what doesn't matter anymore, and commit to today's plan. This is a daily feedback loop that improves priorities and self-awareness over time.

## Symbol System

```
✓ (done)              completed (from plan or unplanned)
↳ (carry over Nd)     item carried over, tracking age in days
•                     new planned item
(postponed)           consciously deferred, lowest priority
💭                    self-reflection line (1 sentence)
```

Note: use `✓` (U+2713), not `✔` (U+2714). Some tools convert `✔` to colored emoji.

## Daily Progress Format

`daily-progress.md` is an append-only event log. Items are written in the order they happen, never reordered or inserted. Each day grows downward throughout the day:

```markdown
## Day, Month Date, Year

### Plan
- ↳ (carry over 1d) Carry-over item from yesterday
- New item for today
- (postponed) Consciously deferred item
<!-- checkin:morning -->

### Done
- ✓ (done) Completed planned thing
- ✓ (done) Unplanned thing (unplanned)
- • Item from plan not touched
- ↳ Item from plan still in progress
<!-- eod:done -->

### Reflection
💭 1-2 sentences. What diverged, why, whether it was a good call.
```

- **Plan** is appended in the morning. Carry-overs (↳) first, new items (•), postponed last.
- **Morning marker** (`<!-- checkin:morning -->`) is appended after the plan is written.
- **Done** items are appended throughout or at end of day. Completed items use `✓ (done)`, unplanned items add `(unplanned)`. Items not touched stay as `•` or `↳`.
- **EOD marker** (`<!-- eod:done -->`) is appended after the Done section.
- **Reflection** is appended the next morning as part of planning. Compares plan vs done, notes why the divergence happened, and whether it was a good call. Keep it to 1-2 sentences.
- **Day rollover** collapses previous day's markers into a single one at the bottom.

## 3-Day Carry-Over Rule

When an item reaches `↳ (carry over 3d)` during morning planning, it triggers a decision prompt:
- **Recommit** — keep it, still needed ("still needed because X")
- **Postpone** — move to `(postponed)` with a reason
- **Drop** — remove it with a `💭` note explaining why

This rule prevents zombie items from lingering forever. You hit the decision point during morning reflection and either consciously keep it or let it go.

## Morning Workflow

Every morning is the same process, whether it's been one day or several since the last entry:

1. Read the most recent entry in `daily-progress.md` (plan + done).
2. Compare plan vs done. Identify:
   - ✓ (done) — Completed as planned
   - ↳ Still in progress — carrying over (increment day counter)
   - Items not started — decide: carry over or drop
   - Unplanned work that wasn't in the plan
3. Check for any items hitting ↳ (carry over 3d) — trigger the 3-day rule (recommit, postpone, or drop).
4. Ask for reflection: was the divergence a conscious choice? Good call or distraction?
5. Write the reflection into yesterday's entry.
6. Ask the user for today's plan. Surface carry-overs as candidates.
7. Create today's entry in `daily-progress.md` with the Plan section. Carry-overs (↳) first, new items (•), postponed last.

## End-of-Day Workflow

1. Ask the user what they worked on, or gather from conversation context.
2. Append a Done section to today's entry in `daily-progress.md`:
   - Flip completed items to ✓
   - Leave untouched items as • or ↳
   - Add unplanned work as ✓ (done)(unplanned) at the bottom
3. Append the `<!-- eod:done -->` marker.

## Catch-Up Mode

If the user skipped one or more days, combine into a single flow:
- Write reflections for each skipped day that had a plan
- Consolidate all done items into a "since last update" view
- Then proceed with today's morning planning as usual

## Append-Only Log

`daily-progress.md` is an append-only event log. Never insert items above existing content or reorder entries. New items and markers are always appended at the bottom of the current day's section.

During an active day, multiple markers accumulate to show what was completed and when:

```markdown
## Thursday, January 9, 2025
- Morning plan items
<!-- checkin:morning -->
- Item done during the day
- Another item
<!-- eod:done -->
```

Items between markers = what was added between each phase.

### Day Rollover Cleanup

When starting a new day, collapse the previous day's markers into a single one at the bottom. Granular marker history is only useful while the day is active.

## GitHub Scanning (Optional)

If you want the check-in to scan GitHub for activity you may have forgotten to log, add your repos here:

```
- YOUR_ORG org
- YOUR_USERNAME/YOUR_REPO
```

The check-in skill will scan these for PRs, commits, and issues on the target day, then show findings and ask before adding them to the log.

## Finalization

1. Update the daily log.
2. Commit with a concise message.
3. Push (if desired).

## Rules

- Use the user's words whenever possible.
- Do not embellish or smooth the log into generic status prose.
- Never write reflections for the user — present the analysis, ask them to write it.
- Preserve the user's voice, humor, and personality exactly as written.
