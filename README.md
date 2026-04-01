# daily-checkin

A daily check-in system for [Claude Code](https://claude.ai/download). Morning planning, carry-over tracking, and end-of-day wrap-ups — all in a markdown file.

## What it does

- **Morning check-in:** reflect on yesterday, plan today, track what carries over
- **End of day:** record what got done vs what was planned
- **Carry-over tracking:** items get a day counter (↳ 1d, 2d, 3d...) so nothing silently lingers
- **3-day rule:** when an item hits 3 days, you decide: recommit, postpone, or drop
- **Plan vs done contrast:** see exactly what diverged before writing your reflection
- **Your words, your voice:** reflections are always written by you, never AI-generated

## Quick start

```bash
# 1. Copy commands into your project
mkdir -p .claude/commands
cp path/to/daily-checkin/commands/*.md .claude/commands/

# 2. Copy the workflow spec
cp path/to/daily-checkin/daily-workflow.md .

# 3. Start your daily progress file
cp path/to/daily-checkin/daily-progress.template.md daily-progress.md
```

Then run `/checkin` in Claude Code.

## How it works

**Three modes:**

| Mode | Trigger | What happens |
|------|---------|-------------|
| Morning check-in | `/checkin` | Reflect on yesterday, plan today, write to log |
| Mid-day logging | Just tell Claude | Appends to `daily-progress.md`, commits |
| End of day | `/eod` | Records what got done, appends Done section |

**The morning flow is interactive** — Claude walks you through it step by step:

1. Shows yesterday's plan vs what actually got done
2. Asks you to write a reflection
3. Surfaces carry-over candidates
4. Asks what's planned for today
5. Writes today's entry

## Symbol system

```
✓ (done)              completed (from plan or unplanned)
↳ (carry over Nd)     item carried over, tracking age in days
•                     new planned item
(postponed)           consciously deferred, lowest priority
💭                    self-reflection (1-2 sentences, always user-written)
```

## What the daily log looks like

```markdown
## Tuesday, January 7, 2025

### Plan
- ↳ (carry over 1d) Write API documentation
- Implement user search endpoint
- (postponed) Set up monitoring dashboard

### Done
- ✓ (done) Implement user search endpoint
- ✓ (done) Write API documentation — finally knocked this out
- ✓ (done) Fixed flaky auth test blocking CI (unplanned)
- (postponed) Set up monitoring dashboard

### Reflection
💭 Good day. Got the carry-over done first which felt great.
```

## Customization

**Add GitHub scanning:** Edit `daily-workflow.md` and add your GitHub orgs/repos to the optional scanning section. The check-in will scan for PRs and commits you forgot to log.

**Add Slack integration:** See [`slack-addon/`](slack-addon/) — posts your check-in to a Slack channel and updates it at end of day.

## Philosophy

This system is a daily feedback loop. Every morning you compare what you planned vs what you did, reflect on why they diverged, and use that to plan better today. The carry-over counter makes invisible procrastination visible. The 3-day rule forces decisions instead of letting items rot.

The AI helps with the mechanics — scanning for activity, tracking carry-overs, formatting the log. But the reflection is always yours. The system is opinionated about structure and unopinionated about content.

## License

MIT
