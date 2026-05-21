# Truth or Dare Discord Bot

A modern, production-ready **Truth or Dare** bot for private friend-group servers. Built with **Node.js** and **Discord.js v14** — free to host, no database, and easy to maintain.

![Node](https://img.shields.io/badge/node-%3E%3D18-green) ![Discord.js](https://img.shields.io/badge/discord.js-14-blue)

## Features

| Feature | Commands |
|--------|----------|
| Core gameplay | `/truth`, `/dare`, `/random`, `/skip` |
| Categories | `/categories`, optional `category:` on truth/dare/random |
| Party mode | `/party start`, `join`, `leave`, `add`, `setmax`, `round`, `complete`, `status`, `end` (up to 25+ players) |
| Leaderboard | `/leaderboard` (local JSON) |
| Submissions | `/submit` + voting buttons + `/admin approve` |
| Extra modes | `/daily`, `/nhie`, `/wheel` |
| NSFW toggle | `/settings nsfw-channel`, `/settings nsfw-global` |
| Admin tools | `/admin addtruth`, `adddare`, `remove`, `reload`, `queue` |

**UX:** Rich embeds, action buttons (Next, Skip, Random, Truth, Dare), cooldowns, dare timers, recent-question anti-repeat.

**Data:** 550+ truths and 550+ dares across 10 categories, stored in `data/truths/*.json` and `data/dares/*.json`.

---

## Quick start (local)

### 1. Create a Discord application

1. Open the [Discord Developer Portal](https://discord.com/developers/applications).
2. **New Application** → name it (e.g. "Truth or Dare").
3. Open **Bot** → **Reset Token** → copy the token (keep it secret).
4. Enable **Message Content Intent** only if you add message features later (not required for slash commands).
5. Under **OAuth2 → URL Generator**:
   - Scopes: `bot`, `applications.commands`
   - Bot permissions: `Send Messages`, `Embed Links`, `Use External Emojis`, `Add Reactions`
6. Copy the **Application ID** (Client ID) from **General Information**.
7. Invite the bot to your server with the generated URL.

### 2. Install and configure

```bash
cd truth-or-dare-bot
npm install
cp .env.example .env
```

Edit `.env`:

```env
DISCORD_TOKEN=your_bot_token
CLIENT_ID=your_application_id
GUILD_ID=your_server_id
```

> **Tip:** Set `GUILD_ID` during development so slash commands appear instantly. Remove it for global registration (can take up to 1 hour).

### 3. Generate question data (first time)

```bash
npm run generate-data
```

This creates **550 truths**, **550 dares**, NHIE statements, daily challenges, and the punishment wheel.

### 4. Register slash commands

```bash
npm run register
```

### 5. Run the bot

```bash
npm start
```

Development with auto-restart:

```bash
npm run dev
```

---

## Project structure

```txt
truth-or-dare-bot/
├── data/
│   ├── truths/          # One JSON file per category
│   ├── dares/
│   ├── leaderboard.json
│   ├── settings.json
│   ├── submissions.json
│   ├── nhie.json
│   ├── daily-challenges.json
│   └── punishments.json
├── scripts/
│   └── generate-datasets.js
├── src/
│   ├── commands/        # Slash command modules
│   ├── events/          # ready, interactionCreate
│   ├── handlers/        # Command & event loaders
│   ├── utils/           # Embeds, storage, questions, party, etc.
│   ├── config.js
│   ├── index.js
│   └── register-commands.js
├── .env.example
├── package.json
└── README.md
```

---

## Adding questions

Each entry in category JSON files:

```json
{
  "id": 551,
  "question": "What is your most embarrassing moment?",
  "category": "Funny",
  "rating": "PG13",
  "enabled": true
}
```

**Ratings:** `PG`, `PG13`, `R`, `NSFW` — NSFW only appears in channels enabled via `/settings`.

**Ways to add content:**

1. Edit `data/truths/funny.json` (or any category file) manually.
2. Use `/admin addtruth` or `/admin adddare` in Discord.
3. Users submit via `/submit`; admins approve with `/admin approve submission_id:...`.
4. Re-run `npm run generate-data` to reset/regenerate bulk data (backs up custom edits if you copy files first).

After manual file edits: `/admin reload` or restart the bot.

---

## Commands reference

### Gameplay

- `/truth [category]` — Random truth
- `/dare [category]` — Random dare (optional timer from `.env`)
- `/random [category]` — 50/50 truth or dare
- `/skip` — Skip and pull a new random question
- `/categories` — List categories + library size
- `/leaderboard` — Server points

### Party mode

- `/party start [voice] [role]` — Add everyone in a voice channel and/or with a role (min 2, max configurable)
- `/party join` — Join an active party if there is room
- `/party leave` — Leave (party must stay ≥2 players; use `/party end` to stop)
- `/party add user:` — Host or admin adds someone
- `/party setmax max:25` — Admin: raise/lower server party cap (2–50)
- `/party round type:truth|dare` — Question for current turn
- `/party complete` — Finished dare, advance turn (+10 pts)
- `/party status` / `/party end`

**Party size:** Default **25** via `PARTY_MAX_PLAYERS` in `.env`. Per-server override with `/party setmax`. Hard ceiling **50**.

### Community

- `/submit` — Add to approval queue (👍/👎 voting)
- `/daily` — Daily challenge
- `/nhie` — Never Have I Ever (+ reactions)
- `/wheel` — Punishment wheel

### Settings (admin for global NSFW)

- `/settings nsfw-channel enabled:true` — Allow NSFW rating in **this** channel
- `/settings nsfw-global enabled:true` — Master switch
- `/settings view`

### Admin (Manage Server or `ADMIN_USER_IDS`)

- `/admin addtruth`, `/admin adddare`, `/admin remove id:`, `/admin reload`
- `/admin queue`, `/admin approve`, `/admin reject`

---

## Environment variables

| Variable | Description |
|----------|-------------|
| `DISCORD_TOKEN` | Bot token |
| `CLIENT_ID` | Application ID |
| `GUILD_ID` | Optional guild for fast command registration |
| `ADMIN_USER_IDS` | Extra admin user IDs (comma-separated) |
| `COOLDOWN_SECONDS` | Anti-spam cooldown (default 8) |
| `RECENT_QUESTION_POOL` | Avoid repeating last N questions (default 50) |
| `DARE_TIMER_SECONDS` | Dare reminder timer (default 60, 0 = off) |
| `ALLOW_NSFW_DEFAULT` | Default NSFW policy |
| `ENABLE_AI_FALLBACK` | Optional OpenAI fallback when pool empty (default false) |
| `EMBED_COLOR` | Hex embed color (default Discord blurple) |
| `PARTY_MAX_PLAYERS` | Default max players per party (default 25; admins can override per server) |

---

## Deployment (free hosting)

### Railway

1. Push this folder to GitHub.
2. [railway.app](https://railway.app) → **New Project** → Deploy from GitHub.
3. Add variables: `DISCORD_TOKEN`, `CLIENT_ID`, optionally `GUILD_ID`.
4. Start command (set in dashboard or use `railway.toml`):

   ```bash
   npm run register && npm start
   ```

5. Deploy. Railway free tier may sleep; upgrade or use a keep-alive ping for 24/7.

### Render

1. [render.com](https://render.com) → **New Background Worker**.
2. Connect repo; use `render.yaml` or set:
   - **Build:** `npm install && npm run generate-data`
   - **Start:** `npm run register && npm start`
3. Add env vars in the dashboard.

### Replit

1. Import the GitHub repo.
2. Secrets: `DISCORD_TOKEN`, `CLIENT_ID`.
3. Run `npm install && npm run generate-data && npm run register`.
4. Set **Run** command to `npm start`.
5. Enable **Always On** (Replit may require paid plan for 24/7).

### Local PC / VPS

Run in a terminal, or use **PM2**:

```bash
npm install -g pm2
pm2 start src/index.js --name truth-or-dare
pm2 save
```

Keep `.env` out of git. Regenerate data only when needed.

---

## Sample embed preview

When a user runs `/truth category:funny`, the bot replies with:

- **Title:** category emoji + "Truth"
- **Description:** bold question text
- **Fields:** Category, Rating, Requested by
- **Buttons:** Next · Skip · Random · Truth · Dare

Dares include an optional **Timer** field when `DARE_TIMER_SECONDS > 0`.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Commands not showing | Run `npm run register`; set `GUILD_ID` for instant guild commands |
| `Missing Access` | Re-invite bot with `applications.commands` scope |
| No questions found | Run `npm run generate-data`; check category spelling |
| Bot crashes on start | Verify `DISCORD_TOKEN` and `CLIENT_ID` in `.env` |
| NSFW questions missing | `/settings nsfw-global true` then `/settings nsfw-channel true` in that channel |

---

## License

MIT — use freely for your friend group. Have fun and play responsibly.
