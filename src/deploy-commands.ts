import "dotenv/config";
import { REST, Routes } from "discord.js";
import fs from "fs";
import path from "path";

async function main() {
  const commandsPath = path.join(__dirname, "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((f) => f.endsWith(".ts") || f.endsWith(".js"));

  const commandData = [];
  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (command.data) commandData.push(command.data.toJSON());
  }

  const rest = new REST().setToken(process.env.DISCORD_TOKEN!);

  console.log(`Registering ${commandData.length} global command(s)...`);

  await rest.put(Routes.applicationCommands(process.env.CLIENT_ID!), {
    body: commandData,
  });

  console.log("Done. Global commands can take up to an hour to propagate.");
  console.log(
    "Tip: for instant updates while developing, register per-guild instead using Routes.applicationGuildCommands(clientId, guildId)."
  );
}

main().catch(console.error);
