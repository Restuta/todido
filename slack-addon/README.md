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

7. Copy the Slack-enabled commands and the helper into your project:

```bash
cp slack-addon/checkin.md .claude/commands/checkin.md
cp slack-addon/eod.md .claude/commands/eod.md
cp slack-addon/daily.md .claude/commands/daily.md

# The deterministic Slack helper + tests + example spec.
mkdir -p tooling/__fixtures__
cp slack-addon/slack-post.mjs tooling/slack-post.mjs
cp slack-addon/slack-post.test.mjs tooling/slack-post.test.mjs
cp slack-addon/__fixtures__/checkin-spec.example.json tooling/__fixtures__/checkin-spec.example.json
```

(Or keep them under `slack-addon/` — adjust the path references in `checkin.md` if you do.)

## Slack message format

Messages use Slack Block Kit for clean formatting:

- **Header** blocks for section titles
- **Section** blocks for item lists (every list line must start with `• ` — Slack mrkdwn only renders a list when the line literally starts with that)
- **Context** blocks for reflections (renders as small muted text)
- **Divider** + optional footer

Every PR reference renders as a clickable Slack link, never plain `#NNN` text.

## Deterministic helper

`slack-post.mjs` is the single source of truth for Slack formatting. The skill builds a structured spec (`{header, stats, by_project, plan, ...}`) and the helper produces the Block Kit JSON. This prevents the two most common Slack-rendering failures:

- Lines starting with bold/emoji/arrow render as a paragraph blob instead of a list — the helper enforces `• ` on every list line and rejects specs that don't.
- PR numbers as plain text aren't clickable — the helper builds `<https://github.com/org/repo/pull/N|#N>` from `{org,repo,n}`.

Try the example:

```bash
node slack-addon/slack-post.mjs --spec slack-addon/__fixtures__/checkin-spec.example.json --dry-run
```

Run the invariant tests:

```bash
node slack-addon/slack-post.test.mjs
```

## Filtering

Configure `filter_tags` and `filter_repos` in your spec to strip items from the Slack post (e.g. personal tags or unrelated repos). The local `daily-progress.md` stays complete — only the Slack syndication is filtered.

```json
{
  "filter_tags": ["personal", "side-project"],
  "filter_repos": ["myname/private-repo"]
}
```

## In-place fixes

The skill posts a NEW Slack message on the initial check-in. If you catch a formatting or content problem in the just-posted message, use `chat.update` on the same `ts` to fix it in place — do NOT delete and repost. Pass `--ts <ts>` to `slack-post.mjs` (or set `"ts"` in the spec) to switch from `chat.postMessage` to `chat.update`.
