# Borealise Chatbot

Standalone chatbot for the Borealise platform. Responds to chat commands, auto-woots tracks, and can join the DJ waitlist — all configurable via a `.env` file, no site/database needed.

---

## Quick start

```bash
# 1. Install dependencies
npm install

# 2. Configure credentials
cp .env.example .env
# Fill in BOT_EMAIL, BOT_PASSWORD, BOT_ROOM in .env

# 3. Run
npm start

# Run with auto-restart on file changes (Node ≥ 18)
npm run dev
```

---

## Built-in commands

| Command | Aliases | Description |
|---------|---------|-------------|
| `!help [command]` | `!ajuda` `!commands` | List commands or get details on one |
| `!ping` | `!pong` | Check if the bot is alive |
| `!np` | `!nowplaying` `!tocando` `!musica` | Show current track + reactions |
| `!woot` | `!w` `!votar` | Trigger the bot to woot the current track |
| `!stats` | `!status` `!info` `!bot` | Show session stats (uptime, woots, reactions) |
| `!queue` | `!fila` `!waitlist` `!pos` | Show the bot's waitlist position |

---

## Adding a new command

Create a file in `commands/`, e.g. `commands/greet.js`:

```js
export default {
  name: "greet",
  aliases: ["oi", "hello"],
  description: "Cumprimentos!",
  usage: "!greet",
  cooldown: 5_000,           // ms between uses per user (optional, default 3 000)

  async execute(ctx) {
    // ctx fields:
    //   ctx.bot        — BorealiseBot instance (access state, config, etc.)
    //   ctx.api        — @borealise/api REST client
    //   ctx.args       — string[] split by whitespace
    //   ctx.rawArgs    — everything after the command name, unsplit
    //   ctx.message    — full original chat message
    //   ctx.sender     — { userId, username, displayName }
    //   ctx.room       — room slug
    //   ctx.reply(txt) — send a chat message

    await ctx.reply(`Olá, @${ctx.sender.username ?? "amigo"}! 👋`);
  },
};
```

That's it — no registration needed. The bot auto-loads every `.js` file in `commands/` on startup.

---

## Configuration reference (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `BOT_EMAIL` | *(required)* | Bot account e-mail |
| `BOT_PASSWORD` | *(required)* | Bot account password |
| `BOT_ROOM` | *(required)* | Room slug to join |
| `BOREALISE_API_URL` | `https://prod.borealise.com/api` | REST API base URL |
| `BOREALISE_WS_URL` | `wss://prod.borealise.com/ws` | WebSocket pipeline URL |
| `CMD_PREFIX` | `!` | Command prefix |
| `AUTO_WOOT` | `true` | Auto-woot every new track |
| `AUTO_JOIN` | `false` | Auto-join DJ waitlist |
| `AFK_MESSAGE` | *(empty)* | Reply when mentioned; leave blank to disable |
| `AFK_COOLDOWN_MS` | `30000` | Min ms between AFK replies |

---

## Tech stack

- [`@borealise/pipeline`](https://www.npmjs.com/package/@borealise/pipeline) — official realtime WebSocket client
- [`@borealise/api`](https://www.npmjs.com/package/@borealise/api) — official REST client
- [`ws`](https://www.npmjs.com/package/ws) — WebSocket implementation for Node.js
- [`dotenv`](https://www.npmjs.com/package/dotenv) — `.env` loader
