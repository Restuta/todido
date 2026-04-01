# Slack Integration

Optional add-on that syndicates your daily check-in to a Slack channel.

## How it works

- **Morning:** `/checkin` posts a new Slack message with yesterday's done items + today's plan
- **End of day:** `/eod` updates the same message with what actually got done
- **Mid-day:** No Slack updates. Just log to `daily-progress.md`.

## Setup

1. **Create a Slack app** at https://api.slack.com/apps
2. Add the `chat:write` OAuth scope under "User Token Scopes"
3. Install the app to your workspace
4. Copy the **User OAuth Token** (starts with `xoxp-`)
5. Find your channel ID (right-click channel name > "View channel details" > scroll to bottom)
6. Create `.env` in your project root:

```bash
cp slack-addon/.env.example .env
# Edit .env with your token and channel ID
```

7. Copy the Slack-enabled commands (replaces core commands):

```bash
cp slack-addon/checkin.md .claude/commands/checkin.md
cp slack-addon/eod.md .claude/commands/eod.md
cp slack-addon/daily.md .claude/commands/daily.md
```

## Slack message format

Messages use Slack Block Kit for clean formatting:

- **Header** blocks for section titles
- **Section** blocks for item lists
- **Context** blocks for reflections (renders as small muted text)
- **Divider** + optional footer

## Filtering

If you only want certain items posted to Slack (e.g., work items only), edit the "Slack filtering" section in `checkin.md` with your include/exclude rules.
