# 📋 daily-checkin

A daily check-in system for [Claude Code](https://claude.ai/download). Morning planning, carry-over tracking, and end-of-day wrap-ups — all in a markdown file.

---

## 🧠 Philosophy

Many years of building products and managing my own productivity condensed into one process:

> **Plan your day. Log your progress. Check in every morning.**

The key insight is the morning check-in. You look at what you planned yesterday vs what you actually accomplished. That gap — between intention and reality — is where all the learning happens. Did you get pulled into unplanned work? Was it worth it? Did you avoid something important?

Over time, this daily comparison makes you measurably better at planning and prioritizing. It's the simplest self-improvement loop that actually works.

📄 Plain text files, no complicated tools. A markdown file and an AI assistant that walks you through the process. That's it.

🔄 The carry-over counter makes invisible procrastination visible.
⏰ The 3-day rule forces decisions instead of letting items rot.
✍️ The reflection is always yours — never AI-generated.

---

## ✨ What it does

- 🌅 **Morning check-in** — reflect on yesterday, plan today, track what carries over
- 🌙 **End of day** — record what got done vs what was planned
- 📊 **Carry-over tracking** — items get a day counter (↳ 1d, 2d, 3d...) so nothing silently lingers
- 🎯 **3-day rule** — when an item hits 3 days, you decide: recommit, postpone, or drop
- 🔍 **Plan vs done contrast** — see exactly what diverged before writing your reflection
- 🗣️ **Your words, your voice** — reflections are always written by you, never AI-generated

---

## 🚀 Install

Paste this into Claude Code:

> Clone https://github.com/Restuta/daily-checkin and install it into this project

**Then just use it:**

- ☀️ **Every morning** — say "morning check-in" and it walks you through reflecting on yesterday + planning today
- 📝 **Throughout the day** — tell Claude what you did and it logs it
- 🌙 **End of day** (optional) — say "end of day" to wrap up

Keep your Claude Code session running — it's your daily companion.

---

## 🏷️ Symbol system

```
✓ (done)              completed (from plan or unplanned)
↳ (carry over Nd)     item carried over, tracking age in days
•                     new planned item
(postponed)           consciously deferred, lowest priority
💭                    self-reflection (1-2 sentences, always user-written)
```

---

## 📖 What a morning check-in looks like

**Yesterday:**
✓ (done) Implement user search endpoint
✓ (done) Write API documentation — finally knocked this out
✓ (done) Fixed flaky auth test blocking CI (unplanned)
↳ Deploy staging environment — blocked on DNS
(postponed) Set up monitoring dashboard

💭 CI setup ate the afternoon. API docs carry over. Good call helping with onboarding — they were stuck.

**Plan for today:**
• Finish staging deploy
• Set up error tracking
↳ (carry over 1d) Deploy staging environment
(postponed) Set up monitoring dashboard

---

## 🔧 Customization

🔎 **GitHub scanning** — Edit `daily-workflow.md` and add your GitHub orgs/repos to the optional scanning section. The check-in will scan for PRs and commits you forgot to log.

💬 **Slack integration** — See [`slack-addon/`](slack-addon/) — posts your check-in to a Slack channel and updates it at end of day.

---

## 📄 License

MIT
