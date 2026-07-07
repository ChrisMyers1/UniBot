# Discord Time Tracking Bot

Multi-server Discord bot for clock in/out time tracking with an automatic
Friday 3am (America/New_York) weekly reset, plus a configurable
select-menu → modal → channel application system.

## What it does

**Time tracking**
- `/clockin` — clock yourself in
- `/clockout` — clock yourself out, logs the session length
- `/mytime` — see your current week's total
- `/addtime @user 2h30m` — admin: credit time manually
- `/removetime @user 1h` — admin: deduct time manually
- `/clockeveryone in` / `/clockeveryone out` — admin: bulk clock everyone
- Every **Friday 3:00 AM America/New_York**, a scheduled job automatically
  clocks out anyone still clocked in, posts a summary to a log channel
  (if configured), and rolls the tracking week forward. History isn't
  deleted — old weeks stay in the database so nothing is lost.

**Applications**
- `/apply` — shows a dropdown of up to 25 configured options
- Selecting one opens a modal with that option's specific questions
  (up to 5, Discord's per-modal limit)
- Submitting posts a formatted embed to that option's configured channel
- `/config add-app-option` — admins add/edit options, their questions,
  and which channel they route to, per server

**Multi-server**
Every table is scoped by `guildId`. Each server configures its own admin
role, log channel, and application options independently via `/config`.

## Setup

### 1. Create the Discord application
1. Go to https://discord.com/developers/applications → New Application
2. Bot tab → Reset Token, copy it (this is `DISCORD_TOKEN`)
3. Enable these under **Privileged Gateway Intents**: Server Members Intent
4. General Information tab → copy the **Application ID** (this is `CLIENT_ID`)
5. OAuth2 → URL Generator → scopes: `bot`, `applications.commands`.
   Bot permissions: Send Messages, Embed Links, Manage Roles (if you want
   it to assign anything later), View Channels. Use the generated URL to
   invite it to a server.

### 2. Install dependencies
```bash
npm install
```

### 3. Set up the database
Copy `.env.example` to `.env` and fill in `DISCORD_TOKEN`, `CLIENT_ID`,
and `DATABASE_URL`.

Easiest path for a Postgres instance:
- **Local**: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=timebot postgres:16`
- **Hosted**: Railway or Supabase both give you a connection string directly.

Then run:
```bash
npm run prisma:migrate
npm run prisma:generate
```

### 4. Register slash commands
```bash
npm run deploy-commands
```
Global commands can take up to an hour to show up the first time. For
faster iteration while developing, swap `Routes.applicationCommands` for
`Routes.applicationGuildCommands(clientId, guildId)` in
`src/deploy-commands.ts` — guild commands update instantly.

### 5. Run the bot
```bash
npm run dev      # ts-node, for local development
# or
npm run build && npm start   # compiled, for production
```

## Per-server admin setup (run once per server)
```
/config set-admin-role role:@Managers
/config set-log-channel channel:#time-logs
/config add-app-option value:leave-request label:"Request Time Off" channel:#hr-requests questions:"What dates?|Reason?|Who covers your shift?"
```

## Production notes
- Run this on an always-on host (small VPS), not a serverless/sleep-prone
  platform — the Friday cron job needs the process alive at 3am to fire.
- `node-cron`'s `timezone` option handles the EST/EDT daylight-saving
  shift automatically since it's tied to `America/New_York`, not a fixed
  UTC offset.
- Consider running the bot process under `pm2` or a systemd service so it
  restarts automatically if it crashes.

## Planned expansion
The schema and Prisma client are designed so a future web dashboard
(e.g. Next.js + Discord OAuth via NextAuth) can read/write the same
Postgres database directly — for editing admin roles, log channels, and
application options through a UI instead of slash commands.
