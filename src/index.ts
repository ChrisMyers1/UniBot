import "dotenv/config";
import fs from "fs";
import path from "path";
import { Client, GatewayIntentBits, Events } from "discord.js";
import type { Command } from "./types";
import { scheduleWeeklyReset } from "./jobs/weeklyReset";
import * as interactionCreate from "./events/interactionCreate";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
  ],
});

const commands = new Map<string, Command>();

function loadCommands() {
  const commandsDir = path.join(__dirname, "commands");
  const files = fs
    .readdirSync(commandsDir)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  for (const file of files) {
    const command = require(path.join(commandsDir, file));
    if (command.data && command.execute) {
      commands.set(command.data.name, command);
    }
  }
  console.log(`Loaded ${commands.size} command(s): ${[...commands.keys()].join(", ")}`);
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
  console.log(`Active in ${readyClient.guilds.cache.size} guild(s).`);
  scheduleWeeklyReset(readyClient);
});

client.on(interactionCreate.name, (interaction) =>
  interactionCreate.execute(interaction, commands)
);

loadCommands();
client.login(process.env.DISCORD_TOKEN);
