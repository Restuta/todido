# /daily

Router for daily workflow. Use the specific skill:

- **`/checkin`** — Morning check-in. Reflects on yesterday, plans today, writes to daily log.
- **`/eod`** — End of day. Records what got done, appends Done section to daily log.

If the user just says "daily" or "check in" or "standup", invoke `/checkin`.
If the user says "end of day", "wrap up", "EOD", invoke `/eod`.

Mid-day progress logging (user reports items during the day) does NOT need a skill. Just append to `daily-progress.md` after the `<!-- checkin:morning -->` marker and commit.

Source of truth for shared rules: [`../../daily-workflow.md`](../../daily-workflow.md)
