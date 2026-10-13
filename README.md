# BotPiglet 🐷

A personal Discord bot for custom automations.

Currently does:
- Slash command framework (`src/commands/`)
- Polls Google Classroom for new announcements/coursework/materials and posts them to a Discord channel

Planned:
- GitHub push notifications

## 1. Create the Discord bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications) → New Application → name it "BotPiglet".
2. **Bot** tab → Reset Token, copy it → this is `DISCORD_TOKEN`.
3. **OAuth2 → General**: copy the **Application ID** → this is `DISCORD_CLIENT_ID`.
4. **OAuth2 → URL Generator**: scopes `bot` + `applications.commands`, permissions `Send Messages` + `Embed Links`. Open the generated URL to invite the bot to your server.
5. In Discord, enable Developer Mode (User Settings → Advanced), then right-click your server → Copy Server ID → this is `DISCORD_GUILD_ID` (used for instant command registration while developing).

## 2. Install dependencies

```
npm install
```

## 3. Configure environment

```
cp .env.example .env
```

Fill in `DISCORD_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_GUILD_ID`. Leave the Classroom variables for now.

## 4. Set up Google Classroom access

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create a new project (e.g. "BotPiglet").
2. **APIs & Services → Library** → enable **Google Classroom API**.
3. **APIs & Services → OAuth consent screen** → External → fill in app name/email → add your own Google account as a **test user**.
4. **APIs & Services → Credentials** → Create Credentials → OAuth client ID → Application type **Desktop app**.
5. Download the JSON and save it as `credentials.json` in the project root (same folder as `package.json`).
6. Run the one-time authorization flow:
   ```
   npm run auth:google
   ```
   It prints a URL — open it, sign in, approve access. This saves `token.json` (kept out of git).

## 5. Find your course IDs and pick a channel

1. Right-click the Discord channel you want updates posted to → Copy Channel ID → set as `CLASSROOM_CHANNEL_ID` in `.env`.
2. Register commands and start the bot (see below), then run `/classroom courses` in Discord to list your active courses and their IDs.
3. Optionally set `CLASSROOM_COURSE_IDS` in `.env` to a comma-separated list to only watch specific courses. Leave blank to watch all active courses.

## 6. Register slash commands and run

```
npm run deploy-commands
npm run dev
```

`npm run dev` runs the bot with auto-reload. Use `npm run build && npm start` for a production run.

## Commands

- `/ping` — health check
- `/classroom courses` — list your active Classroom courses and IDs
- `/classroom check` — manually trigger a Classroom check right now

## Notes

- On first run, BotPiglet silently records whatever's already posted in Classroom so it doesn't dump your entire course history into Discord — only new posts from then on get announced.
- `credentials.json`, `token.json`, `.env`, and `data/` are all gitignored since they hold secrets or local state.
