# Borealise Chatbot

Standalone chatbot for the Borealise platform.  
Responds to chat commands, auto-woots tracks, greets new users, and replies when @mentioned — all configurable via `.env`, no site or database required.

The bot is a **chat-only bot** and does **not** join the DJ waitlist.

---

## Quick start

```bash
# 1. Enter the directory
cd chatbot

# 2. Install dependencies
npm install

# 3. Configure credentials
cp .env.example .env
# Fill in BOT_EMAIL, BOT_PASSWORD, BOT_ROOM in .env

# 4. Run
npm start

# Auto-restart on file changes (Node ≥ 18)
npm run dev
```

---

## Project structure

```
chatbot/
  index.js               ← entry point
  lib/
    bot.js               ← BorealiseBot core (pipeline, REST, dispatch logic)
    config.js            ← .env loader / config schema
    permissions.js       ← role hierarchy & helpers
  commands/
    index.js             ← CommandRegistry (auto-load, cooldowns, role checks)
    help.js              — !help [command]
    ping.js              — !ping
    nowplaying.js        — !np
    woot.js              — !woot
    stats.js             — !stats
    queue.js             — !queue
    mod.js               — !skip !kick !mute !unmute !ban !unban
  events/
    index.js             ← EventRegistry (auto-load, cooldowns, enable/disable)
    greet.js             — welcome message on user join
```

---

## Built-in commands

| Command           | Aliases                            | Role required | Description                                   |
| ----------------- | ---------------------------------- | ------------- | --------------------------------------------- |
| `!help [command]` | `!ajuda` `!commands`               | —             | List commands or get details on one           |
| `!ping`           | `!pong`                            | —             | Check if the bot is alive                     |
| `!np`             | `!nowplaying` `!tocando` `!musica` | —             | Show current track + reactions                |
| `!woot`           | `!w` `!votar`                      | —             | Trigger the bot to woot the current track     |
| `!stats`          | `!status` `!info` `!bot`           | —             | Show session stats (uptime, woots, reactions) |
| `!queue`          | `!fila` `!waitlist` `!pos`         | —             | Show the bot's waitlist position (if any)     |
| `!skip`           | —                                  | bouncer+      | Skip the current track                        |
| `!kick @user`     | —                                  | bouncer+      | Kick a user from the room                     |
| `!mute @user`     | —                                  | bouncer+      | Mute a user                                   |
| `!unmute @user`   | —                                  | bouncer+      | Unmute a user                                 |
| `!ban @user`      | —                                  | manager+      | Ban a user from the room                      |
| `!unban @user`    | —                                  | manager+      | Unban a user                                  |

> **Role order (lowest → highest):** user · resident_dj · bouncer · manager · cohost · host  
> Both the bot **and** the sender must hold the required role for moderation commands to work.

---

## Adding a command

Create `commands/mycommand.js` — the `CommandRegistry` auto-loads it on startup:

```js
export default {
  name: "greet",
  aliases: ["oi", "hello"],
  description: "Cumprimentos!",
  usage: "!greet",
  cooldown: 5_000, // ms between uses per user (default: 3 000)
  // minRole: "bouncer", // optional: minimum role required

  async execute(ctx) {
    // ctx.bot        — BorealiseBot instance
    // ctx.api        — @borealise/api REST client
    // ctx.args       — string[] (words after command name)
    // ctx.rawArgs    — string after command name, unsplit
    // ctx.message    — full chat message
    // ctx.sender     — { userId, username, displayName }
    // ctx.senderRole / ctx.senderRoleLevel
    // ctx.botRole    / ctx.botRoleLevel
    // ctx.room       — room slug
    // ctx.reply(txt) — send a chat message

    await ctx.reply(`Olá, @${ctx.sender.username ?? "amigo"}! 👋`);
  },
};
```

---

## Adding an event handler

Create `events/myevent.js` — the `EventRegistry` auto-loads it on startup:

```js
import { Events } from "@borealise/pipeline";

export default {
  name: "my-event",
  description: "Does something when a user joins.",
  enabled: true, // default enabled state

  event: Events.ROOM_USER_JOIN,
  // events: [Events.ROOM_USER_JOIN, Events.ROOM_USER_LEAVE],  // or multiple

  // Optional cooldown (ms). Can be a function for config-driven values:
  cooldown: 60_000,
  // cooldown: (ctx) => ctx.bot.cfg.someConfigField,
  cooldownScope: "user", // "user" (per-user) or "global" (room-wide)

  async handle(ctx, data) {
    // ctx.bot        — BorealiseBot instance
    // ctx.api        — @borealise/api REST client
    // ctx.room       — room slug
    // ctx.reply(txt) — send a chat message
    // data           — raw pipeline event payload

    await ctx.reply(`Welcome, ${data.displayName ?? "stranger"}!`);
  },
};
```

Toggle at runtime without restarting:

```js
bot.events.enable("my-event");
bot.events.disable("my-event");
```

---

## Configuration reference (`.env`)

| Variable                  | Default                              | Description                                    |
| ------------------------- | ------------------------------------ | ---------------------------------------------- |
| `BOT_EMAIL`               | _(required)_                         | Bot account e-mail                             |
| `BOT_PASSWORD`            | _(required)_                         | Bot account password                           |
| `BOT_ROOM`                | _(required)_                         | Room slug to join                              |
| `BOREALISE_API_URL`       | `https://prod.borealise.com/api`     | REST API base URL                              |
| `BOREALISE_WS_URL`        | `wss://prod.borealise.com/ws`        | WebSocket pipeline URL                         |
| `CMD_PREFIX`              | `!`                                  | Command prefix character                       |
| `AUTO_WOOT`               | `true`                               | Auto-woot every new track                      |
| `BOT_MESSAGE`             | `"Oi! Sou um bot…"`                  | Reply when @mentioned; leave empty to disable  |
| `BOT_MENTION_COOLDOWN_MS` | `30000`                              | Min ms between mention replies                 |
| `GREET_ENABLED`           | `true`                               | Send welcome message on user join              |
| `GREET_MESSAGE`           | `"🎵 Bem-vindo(a) à sala, @{name}!"` | Welcome template (`{name}` / `{username}`)     |
| `GREET_COOLDOWN_MS`       | `3600000`                            | Per-user cooldown for greets (default: 1 hour) |

---

## Tech stack

- [`@borealise/pipeline`](https://www.npmjs.com/package/@borealise/pipeline) — official realtime WebSocket client
- [`@borealise/api`](https://www.npmjs.com/package/@borealise/api) — official REST client
- [`ws`](https://www.npmjs.com/package/ws) — WebSocket implementation for Node.js
- [`dotenv`](https://www.npmjs.com/package/dotenv) — `.env` loader
