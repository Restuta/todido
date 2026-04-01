# /daily

Router for daily workflow. Use the specific skill:

- **`/checkin`** — Morning check-in. Reflects on yesterday, plans today, posts new Slack message.
- **`/eod`** — End of day. Records what got done, updates today's Slack message.

If the user just says "daily" or "check in" or "standup", invoke `/checkin`.
If the user says "end of day", "wrap up", "EOD", invoke `/eod`.

Mid-day progress logging (user reports items during the day) does NOT need a skill. Just append to `daily-progress.md` after the `<!-- slack:posted -->` marker and commit. Never touch Slack mid-day.

Source of truth for shared rules: [`../../daily-workflow.md`](../../daily-workflow.md)
